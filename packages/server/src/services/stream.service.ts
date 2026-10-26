// Stream Service - CRUD + Lifecycle

import * as crypto from 'crypto';
import { BaseService } from './base.service.js';
import { ok, err, Result } from '@stream-engine/shared/utils/result';
import { Stream, Prisma } from '@prisma/client';
import { FFmpegProcessor } from '@stream-engine/ffmpeg-worker';
import { SourceType, LoopMode, AudioSource, NoiseProfile, StreamStatus as SharedStreamStatus } from '@stream-engine/shared/types';
import { BUILTIN_VISUALIZERS } from '@stream-engine/shared/constants';

type StreamStatus = 'STOPPED' | 'STARTING' | 'LIVE' | 'ERROR' | 'RECONNECTING' | 'STOPPING';

interface StreamListParams {
  userId: string;
  page: number;
  limit: number;
  status?: string;
  accountId?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface StreamStatusResponse {
  streamId: string;
  status: StreamStatus;
  broadcastId: string | null;
  currentBroadcastId: string | null;
  startedAt: Date | null;
  uptime: number;
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
    reconnectCount: number;
    lastError: string | null;
    networkLatency: number;
  };
}

export interface RtmpTarget {
  platform: string;
  rtmpUrl: string;
  streamKey: string;
}

export class StreamService extends BaseService {
  private ffmpegProcessor: FFmpegProcessor;

  constructor(app: any) {
    super(app);
    this.ffmpegProcessor = new FFmpegProcessor(app.config.MAX_CONCURRENT_STREAMS);
  }

  async list(params: StreamListParams) {
    const where: Prisma.StreamWhereInput = {
      userId: params.userId,
      ...(params.status && { status: params.status }),
      ...(params.accountId && { accountId: params.accountId }),
    };

    const [streams, total] = await Promise.all([
      this.prisma.stream.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: { fxPreset: true, visualizer: true, schedule: true },
      }),
      this.prisma.stream.count({ where }),
    ]);

    return {
      data: streams,
      pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
    };
  }

  async create(userId: string, data: any): Promise<Stream> {
    const now = new Date().toISOString();
    const createData: any = {
      ...data,
      userId,
      videoFiles: JSON.stringify(data.videoFiles || []),
      audioFiles: JSON.stringify(data.audioFiles || []),
      outputPlatforms: JSON.stringify(data.outputPlatforms || ['CUSTOM_RTMP']),
      customRtmpUrls: data.customRtmpUrls ? JSON.stringify(data.customRtmpUrls) : null,
      shuffleHistory: JSON.stringify(data.shuffleHistory || []),
    };
    // accountId is optional - use userId as fallback
    if (!createData.accountId) {
      createData.accountId = userId;
    }

    // Use $executeRawUnsafe to bypass Prisma client-side relation validation
    const fields = Object.keys(createData).filter(k => k !== 'id');
    const values = fields.map(f => createData[f]);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO Stream (id, createdAt, updatedAt, ${fields.join(', ')}) VALUES (?, ?, ?, ${placeholders})`;
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 25);

    try {
      await this.prisma.$executeRawUnsafe(sql, id, now, now, ...values);
      return this.prisma.stream.findUnique({ where: { id } }) as Promise<Stream>;
    } catch (error: any) {
      this.logger.error('Failed to create stream via raw SQL', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getById(id: string): Promise<Stream | null> {
    return this.prisma.stream.findUnique({
      where: { id },
      include: { fxPreset: true, visualizer: true, schedule: true },
    });
  }

  async update(id: string, data: any): Promise<Stream> {
    return this.prisma.stream.update({
      where: { id },
      data,
      include: { fxPreset: true, visualizer: true, schedule: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.stream.delete({ where: { id } });
  }

  async start(id: string): Promise<Result<{ rtmpTargets: RtmpTarget[] }, { code: string; message: string }>> {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) return err({ code: 'NOT_FOUND', message: 'Stream not found' });
    if (stream.status === 'LIVE') return err({ code: 'ALREADY_LIVE', message: 'Stream is already live' });

    try {
      await this.prisma.stream.update({
        where: { id },
        data: { status: 'STARTING', startedAt: new Date(), reconnectAttempts: 0 },
      });

      // Parse RTMP targets from customRtmpUrls (user-provided RTMP URL + key)
      const customRtmpUrls = stream.customRtmpUrls ? JSON.parse(stream.customRtmpUrls) : {};
      const outputPlatforms = JSON.parse(stream.outputPlatforms || '[]');

      const rtmpTargets: RtmpTarget[] = outputPlatforms.map((platform: string) => {
        if (platform === 'CUSTOM_RTMP' && customRtmpUrls[platform]) {
          const entry = customRtmpUrls[platform];
          const url = entry.url || entry;
          const key = entry.key || '';
          return {
            platform: 'custom',
            rtmpUrl: url,
            streamKey: key,
          };
        }
        return null;
      }).filter(Boolean) as RtmpTarget[];

      if (rtmpTargets.length === 0) {
        await this.prisma.stream.update({
          where: { id },
          data: { status: 'ERROR', stoppedAt: new Date() },
        });
        return err({ code: 'NO_RTMP_TARGET', message: 'No RTMP output targets configured. Add custom RTMP URL and key.' });
      }

      // Start FFmpeg process - outputs to NMS (localhost:1935)
      const ffmpegResult = await this.startFFmpegStream(id, stream, rtmpTargets);
      if (!ffmpegResult.ok) {
        await this.prisma.stream.update({ where: { id }, data: { status: 'ERROR' } });
        return err(ffmpegResult.error);
      }

      // Use tee muxer directly in main FFmpeg to push to target RTMP endpoints
      // This bypasses NMS/relay which had connection issues
      const streamKey = `s_${id.slice(-12)}`;
      
      await this.prisma.stream.update({
        where: { id },
        data: {
          status: 'LIVE',
          rtmpPushKey: streamKey,
        },
      });

      this.logger.info('Stream started', { streamId: id, rtmpTargets: rtmpTargets.length });
      return ok({ rtmpTargets });
    } catch (error) {
      await this.prisma.stream.update({ where: { id }, data: { status: 'ERROR' } });
      this.logger.error('Failed to start stream', { streamId: id, error: error instanceof Error ? error.message : String(error) });
      return err({ code: 'START_FAILED', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async startFFmpegStream(
    streamId: string,
    stream: Stream,
    rtmpTargets: RtmpTarget[]
  ): Promise<Result<void, { code: string; message: string }>> {
    try {
      const sharedStream: any = {
        ...stream,
        sourceType: stream.sourceType as SourceType,
        loopMode: stream.loopMode as LoopMode,
        audioSource: stream.audioSource as AudioSource,
        noiseProfile: stream.noiseProfile as NoiseProfile | null,
        status: stream.status as SharedStreamStatus,
        outputPlatforms: JSON.parse(stream.outputPlatforms || '[]'),
        customRtmpUrls: stream.customRtmpUrls ? JSON.parse(stream.customRtmpUrls) : undefined,
        videoFiles: JSON.parse(stream.videoFiles || '[]'),
        audioFiles: JSON.parse(stream.audioFiles || '[]'),
        shuffleHistory: JSON.parse(stream.shuffleHistory || '[]'),
        fxPreset: stream.fxPresetId ? await this.prisma.fxPreset.findUnique({ where: { id: stream.fxPresetId } }) : undefined,
        visualizer: stream.visualizerId
          ? stream.visualizerId.startsWith('builtin-')
            ? { id: stream.visualizerId, ...(BUILTIN_VISUALIZERS as any)[stream.visualizerId.replace('builtin-', '')], isBuiltIn: true }
            : await this.prisma.visualizer.findUnique({ where: { id: stream.visualizerId } })
          : undefined,
        schedule: stream.scheduleId ? await this.prisma.schedule.findUnique({ where: { id: stream.scheduleId } }) : undefined,
      };

      const input = {
        videoFiles: sharedStream.videoFiles,
        playlistId: stream.playlistId || undefined,
        sourceType: sharedStream.sourceType,
        audioFiles: sharedStream.audioFiles,
      };

      // Build RTMP output targets string for tee muxer
      const streamKey = `s_${streamId.slice(-12)}`;
      const rtmpOutputs = rtmpTargets.map(t => `${t.rtmpUrl}/${t.streamKey}`);

      // Use tee muxer to push directly to target RTMP endpoints
      const output = {
        rtmpUrl: 'rtmp://localhost:1935/live', // fallback
        streamKey,
        teeOutputs: rtmpOutputs,
      };

      await this.ffmpegProcessor.start(
        streamId,
        input,
        output,
        sharedStream,
        sharedStream.fxPreset,
        sharedStream.visualizer,
      );

      return ok(undefined);
    } catch (error) {
      return err({ code: 'FFMPEG_START_FAILED', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async stop(id: string): Promise<void> {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) return;

    this.ffmpegProcessor.stop(id);
    await this.prisma.stream.update({
      where: { id },
      data: { status: 'STOPPED', stoppedAt: new Date(), currentBroadcastId: null },
    });
    this.logger.info('Stream stopped', { streamId: id });
  }

  async restart(id: string): Promise<void> {
    await this.stop(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.start(id);
  }

  async getStatus(id: string): Promise<StreamStatusResponse> {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new Error('Stream not found');

    const ffmpegStatus = this.ffmpegProcessor.getStatus(id);

    const stats = ffmpegStatus?.stats || { bitrate: 0, fps: 0, droppedFrames: 0, totalFrames: 0, speed: 0, audioLevel: 0 };
    const ffmpegHealth = ffmpegStatus?.health || { isHealthy: true, lastCheck: new Date(), reconnectCount: 0, lastError: null };

    return {
      streamId: stream.id,
      status: stream.status as StreamStatus,
      broadcastId: stream.currentBroadcastId,
      currentBroadcastId: stream.currentBroadcastId,
      startedAt: stream.startedAt,
      uptime: stream.startedAt ? Math.floor((Date.now() - stream.startedAt.getTime()) / 1000) : 0,
      stats,
      health: {
        isHealthy: ffmpegHealth.isHealthy,
        lastCheck: ffmpegHealth.lastCheck,
        reconnectCount: ffmpegHealth.reconnectCount,
        lastError: ffmpegHealth.lastError,
        networkLatency: 0,
      },
    };
  }

  async getLogs(streamId: string, query: { limit?: number; level?: string }) {
    const where: Prisma.StreamLogWhereInput = { streamId };
    if (query.level) where.level = query.level;

    return this.prisma.streamLog.findMany({
      where,
      take: query.limit || 100,
      orderBy: { createdAt: 'desc' },
    });
  }
}
