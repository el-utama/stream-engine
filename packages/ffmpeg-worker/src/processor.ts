// FFmpeg Processor - Manages FFmpeg processes

import { spawn, ChildProcess } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { FilterGraphBuilder } from './filters/filter-graph.builder.js';
import { VisualizerFilters } from './visualizers/builtin.js';
import { Stream, Visualizer, FxPreset } from '@stream-engine/shared/types';
import { detectAvailableEncoders, getBestEncoder, buildEncoderArgs, EncoderInfo } from '@stream-engine/shared/utils/hwaccel';

export interface FFmpegProcess {
  id: string;
  streamId: string;
  proc: ChildProcess;
  startTime: Date;
  stats: {
    bitrate: number;
    fps: number;
    droppedFrames: number;
    totalFrames: number;
    speed: number;
    audioLevel: number;
  };
  health: {
    isHealthy: boolean;
    lastCheck: Date;
    lastError: string | null;
    reconnectCount: number;
  };
}

export interface StreamInput {
  videoFiles?: string[];
  playlistId?: string;
  rtmpPushKey?: string;
  sourceType: string;
  audioFiles?: string[];
}

export interface StreamOutput {
  rtmpUrl: string;
  streamKey: string;
}

export class FFmpegProcessor {
  private processes: Map<string, FFmpegProcess> = new Map();
  private maxConcurrent: number;
  private ffmpegPath: string;
  private encoder: EncoderInfo | null = null;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.ffmpegPath = ffmpegStatic || 'ffmpeg';
  }

  private async getEncoder(): Promise<EncoderInfo> {
    if (this.encoder) return this.encoder;
    const available = await detectAvailableEncoders();
    this.encoder = available[0] || { name: 'libx264', hwaccel: 'none', vendor: 'cpu', preset: 'veryfast', available: true };
    return this.encoder;
  }

  private clearEncoderCache(): void {
    this.encoder = null;
  }

  private async getVideoEncoder(): Promise<string> {
    const encoder = await this.getEncoder();
    return encoder.name;
  }

  private async getVideoEncoderArgs(stream: Stream): Promise<string[]> {
    const encoder = await this.getEncoder();
    return buildEncoderArgs(encoder, stream.videoBitrate, stream.fps);
  }

  async start(
    streamId: string,
    input: StreamInput,
    output: StreamOutput,
    stream: Stream,
    fxPreset?: FxPreset,
    visualizer?: Visualizer
  ): Promise<void> {
    if (this.processes.size >= this.maxConcurrent) {
      throw new Error(`Max concurrent streams (${this.maxConcurrent}) reached`);
    }

    // Build filter graph
    const filterGraph = await this.buildFilterGraph(stream, fxPreset, visualizer, input);

    // Build FFmpeg args
    const args = await this.buildArgs(input, output, stream, filterGraph);

    // Spawn FFmpeg
    const childProcess = spawn(this.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FFREPORT: `file=/tmp/ffmpeg-${streamId}.log:level=32` },
    });

    const ffmpegProcess: FFmpegProcess = {
      id: streamId,
      streamId,
      proc: childProcess,
      startTime: new Date(),
      stats: { bitrate: 0, fps: 0, droppedFrames: 0, totalFrames: 0, speed: 0, audioLevel: 0 },
      health: { isHealthy: true, lastCheck: new Date(), lastError: null, reconnectCount: 0 },
    };

    this.processes.set(streamId, ffmpegProcess);
    this.setupProcessHandlers(ffmpegProcess);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('FFmpeg startup timeout'));
      }, 30000);

      childProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Opening') || output.includes('Stream mapping') || output.includes('Press')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      childProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  private async buildFilterGraph(
    stream: Stream,
    fxPreset?: FxPreset,
    visualizer?: Visualizer,
    input?: StreamInput
  ): Promise<string> {
    const builder = new FilterGraphBuilder();

    // Apply FX preset
    if (fxPreset) {
      builder.applyVideoPreset(fxPreset.videoFilters as any);
      builder.applyAudioPreset(fxPreset.audioFilters as any);
    } else if (stream.customFxFilters) {
      // Custom filters appended
    }

    // Add visualizer if no video input or visualizer source
    if (input?.sourceType === 'VISUALIZER' || !input?.videoFiles?.length) {
      if (visualizer) {
        const vizFilter = VisualizerFilters.byType(visualizer.type, visualizer.config);
        const withBg = VisualizerFilters.withBackground(vizFilter, {
          backgroundType: visualizer.backgroundType,
          backgroundConfig: visualizer.backgroundConfig,
          width: visualizer.width,
          height: visualizer.height,
        });
        builder.videoFilters.push(withBg);
      }
    }

    // Add noise overlay if configured
    if (stream.noiseProfile && stream.noiseAmplitude > 0) {
      builder.noiseOverlay(stream.noiseProfile, stream.noiseAmplitude, -25);
    }

    // Apply audio loudnorm
    builder.loudnorm(-16, 0.5);

    return builder.build();
  }

  private async buildArgs(
    input: StreamInput,
    output: StreamOutput,
    stream: Stream,
    filterGraph: string
  ): Promise<string[]> {
    const args: string[] = [];

    // Input options
    if (input.sourceType === 'RTMP_PUSH') {
      args.push('-listen', '1', '-i', `rtmp://0.0.0.0:1935/live/${stream.rtmpPushKey}`);
    } else if (input.videoFiles?.length) {
      // Concat multiple video files
      if (input.videoFiles.length > 1) {
        args.push('-f', 'concat', '-safe', '0', '-i', this.createConcatFile(input.videoFiles));
      } else {
        args.push('-re', '-stream_loop', '-1', '-i', input.videoFiles[0]);
      }
    } else if (input.sourceType === 'VISUALIZER') {
      // No video input, visualizer generates it
      args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
    }

    // Audio input if separate
    if (input.audioFiles?.length) {
      args.push('-stream_loop', '-1', '-i', input.audioFiles[0]);
    }

    // Filter graph
    args.push('-filter_complex', filterGraph);

    // Video encoding
    const encoderName = await this.getVideoEncoder();
    const encoderArgs = await this.getVideoEncoderArgs(stream);
    args.push(
      '-map', '[vout]',
      '-c:v', encoderName,
      ...encoderArgs,
      '-pix_fmt', 'yuv420p'
    );

    // Audio encoding
    args.push(
      '-map', '[aout]',
      '-c:a', 'aac',
      '-b:a', `${stream.audioBitrate}k`,
      '-ac', '2',
      '-ar', '48000'
    );

    // Output
    args.push(
      '-f', 'flv',
      '-flv_size', '65536',
      `${output.rtmpUrl}/${output.streamKey}`
    );

    return args;
  }

  private createConcatFile(files: string[]): string {
    const fs = require('fs');
    const path = require('path');
    const content = files.map(f => `file '${path.resolve(f)}'`).join('\n');
    const concatPath = `/tmp/concat-${Date.now()}.txt`;
    fs.writeFileSync(concatPath, content);
    return concatPath;
  }

  private setupProcessHandlers(ffmpegProcess: FFmpegProcess): void {
    const { proc, streamId } = ffmpegProcess;

    proc.stderr?.on('data', (data) => {
      this.parseFFmpegOutput(ffmpegProcess, data.toString());
    });

    proc.on('close', (code) => {
      this.processes.delete(streamId);
      console.log(`FFmpeg process ${streamId} exited with code ${code}`);
    });

    proc.on('error', (err: Error) => {
      ffmpegProcess.health.lastError = err.message;
      ffmpegProcess.health.isHealthy = false;
    });
  }

  private parseFFmpegOutput(ffmpegProcess: FFmpegProcess, output: string): void {
    // Parse bitrate, fps, dropped frames, speed from FFmpeg output
    const bitrateMatch = output.match(/bitrate=(\d+\.?\d*)kbits\/s/);
    if (bitrateMatch) ffmpegProcess.stats.bitrate = parseFloat(bitrateMatch[1]);

    const fpsMatch = output.match(/fps=(\d+\.?\d*)/);
    if (fpsMatch) ffmpegProcess.stats.fps = parseFloat(fpsMatch[1]);

    const speedMatch = output.match(/speed=(\d+\.?\d*)x/);
    if (speedMatch) ffmpegProcess.stats.speed = parseFloat(speedMatch[1]);

    const frameMatch = output.match(/frame=(\d+)/);
    if (frameMatch) ffmpegProcess.stats.totalFrames = parseInt(frameMatch[1]);

    const dropMatch = output.match(/drop=(\d+)/);
    if (dropMatch) ffmpegProcess.stats.droppedFrames = parseInt(dropMatch[1]);

    ffmpegProcess.health.lastCheck = new Date();
    ffmpegProcess.health.isHealthy = ffmpegProcess.stats.speed > 0.5;
  }

  stop(streamId: string): void {
    const ffmpegProcess = this.processes.get(streamId);
    if (ffmpegProcess) {
      ffmpegProcess.proc.kill('SIGTERM');
      setTimeout(() => {
        if (!ffmpegProcess.proc.killed) {
          ffmpegProcess.proc.kill('SIGKILL');
        }
      }, 5000);
    }
  }

  getStatus(streamId: string): FFmpegProcess | undefined {
    return this.processes.get(streamId);
  }

  getActiveCount(): number {
    return this.processes.size;
  }

  async healthCheck(): Promise<void> {
    for (const [streamId, proc] of this.processes) {
      const timeSinceCheck = Date.now() - proc.health.lastCheck.getTime();
      if (timeSinceCheck > 30000) { // 30 seconds
        proc.health.isHealthy = false;
        proc.health.lastError = 'No output for 30s';
        // Trigger restart
        this.stop(streamId);
      }
    }
  }
}