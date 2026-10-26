// VMAF Service - Video Multimethod Assessment Fusion for quality assessment

import { BaseService } from './base.service.js';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

export interface VmafResult {
  score: number;
  details?: {
    perFrame: number[];
    stats: {
      mean: number;
      stddev: number;
      min: number;
      max: number;
    };
  };
}

export interface VmafOptions {
  referencePath: string;
  distortedPath: string;
  model?: 'vmaf_v0.6.1' | 'vmaf_v0.6.1_neg' | 'vmaf_v0.6.1_4k';
  phoneModel?: boolean;
  enableTransform?: boolean;
  nThreads?: number;
  subsample?: number;
}

export class VmafService extends BaseService {
  private ffmpegPath: string;

  constructor(app: any) {
    super(app);
    this.ffmpegPath = ffmpegStatic || 'ffmpeg';
  }

  /**
   * Compute VMAF score between reference and distorted video
   */
  async computeVmaf(options: VmafOptions): Promise<VmafResult> {
    const {
      referencePath,
      distortedPath,
      model = 'vmaf_v0.6.1',
      phoneModel = false,
      enableTransform = false,
      nThreads = 0,
      subsample = 1,
    } = options;

    // Validate input files exist
    const fs = await import('fs');
    if (!fs.existsSync(referencePath)) {
      throw new Error(`Reference video not found: ${referencePath}`);
    }
    if (!fs.existsSync(distortedPath)) {
      throw new Error(`Distorted video not found: ${distortedPath}`);
    }

    // Build FFmpeg command with libvmaf filter
    const filterComplex = `libvmaf=model=${model}:phone_model=${phoneModel}:enable_transform=${enableTransform}:n_threads=${nThreads}:subsample=${subsample}:log_fmt=json:log_path=/tmp/vmaf_${Date.now()}.json`;

    const args = [
      '-i', referencePath,
      '-i', distortedPath,
      '-lavfi', `[0:v][1:v]${filterComplex}[out]`,
      '-map', '[out]',
      '-f', 'null',
      '-'
    ];

    this.logger.info('Running VMAF computation', { referencePath, distortedPath, model });

    try {
      const { stdout, stderr } = await execFileAsync(this.ffmpegPath, args, { timeout: 300000 }); // 5 min timeout

      // Parse VMAF output from stderr (libvmaf outputs to stderr)
      const vmafScore = this.parseVmafScore(stderr);
      
      if (vmafScore === null) {
        throw new Error('Failed to parse VMAF score from FFmpeg output');
      }

      // Try to read detailed JSON output if available
      const details = this.parseVmafDetails(stderr);

      return {
        score: vmafScore,
        details,
      };
    } catch (error: any) {
      this.logger.error('VMAF computation failed', { error: error.message, stderr: error.stderr });
      throw new Error(`VMAF computation failed: ${error.message}`);
    }
  }

  /**
   * Parse VMAF score from FFmpeg stderr output
   */
  private parseVmafScore(stderr: string): number | null {
    // Look for VMAF score in stderr output
    // Pattern: "VMAF score: 95.123456"
    const scoreMatch = stderr.match(/VMAF score:\s*([0-9.]+)/);
    if (scoreMatch) {
      return parseFloat(scoreMatch[1]);
    }

    // Alternative pattern: "VMAF score: 95.123456 (mean)"
    const meanMatch = stderr.match(/mean:\s*([0-9.]+)/);
    if (meanMatch) {
      return parseFloat(meanMatch[1]);
    }

    // JSON output pattern
    const jsonMatch = stderr.match(/\{.*"VMAF score":\s*([0-9.]+)/);
    if (jsonMatch) {
      return parseFloat(jsonMatch[1]);
    }

    return null;
  }

  /**
   * Parse detailed VMAF output from stderr
   */
  private parseVmafDetails(stderr: string): { perFrame: number[]; stats: { mean: number; stddev: number; min: number; max: number } } | undefined {
    try {
      // Try to find JSON output in stderr
      const jsonMatch = stderr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        
        if (data.per_frame) {
          const perFrame = data.per_frame.map((f: any) => f.score || f);
          const scores = perFrame.filter((s: number) => !isNaN(s));
          
          if (scores.length > 0) {
            const mean = scores.reduce((sum: number, val: number) => sum + val, 0) / scores.length;
            const variance = scores.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / scores.length;
            const stddev = Math.sqrt(variance);
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            
            return {
              perFrame: scores,
              stats: { mean, stddev, min, max },
            };
          }
        }
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined;
  }

  /**
   * Compute VMAF between reference and distorted video using a reference file
   * This is used for preset testing where we have a reference video
   */
  async computeVmafForPreset(
    referenceVideoPath: string,
    fxFilterGraph: string,
    testDuration: number = 10
  ): Promise<VmafResult> {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    // Create temporary files
    const tempDir = os.tmpdir();
    const referencePath = path.join(os.tmpdir(), `vmaf_ref_${Date.now()}.mp4`);
    const distortedPath = path.join(os.tmpdir(), `vmaf_dist_${Date.now()}.mp4`);

    try {
      // Generate reference video (clean)
      await this.generateReferenceVideo(referencePath, testDuration);
      
      // Generate distorted video (with FX applied)
      await this.generateDistortedVideo(referencePath, distortedPath, fxFilterGraph, testDuration);

      // Compute VMAF
      return await this.computeVmaf({
        referencePath,
        distortedPath,
      });
    } finally {
      // Cleanup temp files
      try { await import('fs').then(fs => fs.unlinkSync(referencePath)); } catch {}
      try { await import('fs').then(fs => fs.unlinkSync(distortedPath)); } catch {}
    }
  }

  /**
   * Generate reference video (clean, no FX)
   */
  private async generateReferenceVideo(outputPath: string, duration: number): Promise<void> {
    const ffmpegPath = ffmpegStatic || 'ffmpeg';
    const args = [
      '-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
      '-t', String(duration),
      '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '4000k',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k',
      '-y', outputPath,
    ];

    await execFileAsync(ffmpegPath, args, { timeout: 60000 });
  }

  /**
   * Generate distorted video with FX applied
   */
  private async generateDistortedVideo(
    referencePath: string,
    outputPath: string,
    fxFilterGraph: string,
    duration: number
  ): Promise<void> {
    const ffmpegPath = ffmpegStatic || 'ffmpeg';
    const args = [
      '-i', referencePath,
      '-filter_complex', fxFilterGraph,
      '-map', '[vout]', '-map', '[aout]',
      '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '4000k',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k',
      '-t', String(duration),
      '-y', outputPath,
    ];

    await execFileAsync(ffmpegPath, args, { timeout: 120000 });
  }

  /**
   * Batch compute VMAF for multiple preset comparisons
   */
  async computeVmafBatch(pairs: { referencePath: string; distortedPath: string }[]): Promise<number[]> {
    const results = await Promise.all(
      pairs.map(pair => this.computeVmaf({
        referencePath: pair.referencePath,
        distortedPath: pair.distortedPath,
      }))
    );
    return results.map(r => r.score);
  }
}