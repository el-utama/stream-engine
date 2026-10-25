// Stream Service - CRUD + Lifecycle
import { BaseService } from './base.service.js';
import { ok, err } from '@stream-engine/shared/utils/result';
import { FFmpegProcessor } from '@stream-engine/ffmpeg-worker';
export class StreamService extends BaseService {
    ffmpegProcessor;
    constructor(app) {
        super(app);
        this.ffmpegProcessor = new FFmpegProcessor(app.config.MAX_CONCURRENT_STREAMS);
    }
    async list(params) {
        const where = {
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
                include: { account: true, fxPreset: true, visualizer: true, schedule: true },
            }),
            this.prisma.stream.count({ where }),
        ]);
        return {
            data: streams,
            pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
        };
    }
    async create(userId, data) {
        return this.prisma.stream.create({
            data: { ...data, userId },
        });
    }
    async getById(id) {
        return this.prisma.stream.findUnique({
            where: { id },
            include: { account: true, fxPreset: true, visualizer: true, schedule: true },
        });
    }
    async update(id, data) {
        return this.prisma.stream.update({
            where: { id },
            data,
            include: { account: true, fxPreset: true, visualizer: true, schedule: true },
        });
    }
    async delete(id) {
        await this.prisma.stream.delete({ where: { id } });
    }
    async start(id) {
        const stream = await this.prisma.stream.findUnique({ where: { id } });
        if (!stream)
            return err({ code: 'NOT_FOUND', message: 'Stream not found' });
        if (stream.status === 'LIVE')
            return err({ code: 'ALREADY_LIVE', message: 'Stream is already live' });
        try {
            await this.prisma.stream.update({
                where: { id },
                data: { status: 'STARTING', startedAt: new Date(), reconnectAttempts: 0 },
            });
            const account = await this.prisma.youTubeAccount.findUnique({ where: { id: stream.accountId } });
            if (!account)
                return err({ code: 'ACCOUNT_NOT_FOUND', message: 'YouTube account not found' });
            const youtubeService = this.app.youtubeService;
            const liveStreamResult = await youtubeService.createLiveStream(account.id, stream.titleTemplate || stream.name, stream.descriptionTemplate);
            if (!liveStreamResult.ok)
                return err(liveStreamResult.error);
            const { id: broadcastId, rtmpUrl, streamKey } = liveStreamResult.value;
            const broadcastResult = await youtubeService.createLiveBroadcast(account.id, stream.titleTemplate || stream.name, stream.descriptionTemplate, broadcastId);
            if (!broadcastResult.ok)
                return err(broadcastResult.error);
            const { id: currentBroadcastId } = broadcastResult.value;
            await this.prisma.stream.update({
                where: { id },
                data: {
                    status: 'LIVE',
                    currentBroadcastId,
                    rtmpPushKey: streamKey,
                },
            });
            // Start FFmpeg process
            const ffmpegResult = await this.startFFmpegStream(id, stream, rtmpUrl, streamKey);
            if (!ffmpegResult.ok) {
                await this.prisma.stream.update({ where: { id }, data: { status: 'ERROR' } });
                return err(ffmpegResult.error);
            }
            const outputPlatforms = JSON.parse(stream.outputPlatforms);
            const targets = outputPlatforms
                .map((platform) => {
                if (platform === 'YOUTUBE') {
                    return { platform: 'youtube', rtmpUrl, streamKey };
                }
                return { platform: 'custom', rtmpUrl: stream.customRtmpUrls ? JSON.parse(stream.customRtmpUrls)[platform] : '', streamKey: '' };
            })
                .filter((t) => t.rtmpUrl && t.streamKey);
            if (targets.length > 0) {
                await this.app.rtmpRelayService.startRelay({
                    streamId: id,
                    sourceUrl: `rtmp://localhost:1935/live/${streamKey}`,
                    targets,
                    streamKey,
                });
            }
            this.logger.info('Stream started', { streamId: id, broadcastId: currentBroadcastId });
            return ok({ currentBroadcastId });
        }
        catch (error) {
            await this.prisma.stream.update({ where: { id }, data: { status: 'ERROR' } });
            this.logger.error('Failed to start stream', { streamId: id, error: error instanceof Error ? error.message : String(error) });
            return err({ code: 'START_FAILED', message: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async startFFmpegStream(streamId, stream, rtmpUrl, streamKey) {
        try {
            const sharedStream = {
                ...stream,
                sourceType: stream.sourceType,
                loopMode: stream.loopMode,
                audioSource: stream.audioSource,
                noiseProfile: stream.noiseProfile,
                status: stream.status,
                outputPlatforms: JSON.parse(stream.outputPlatforms),
                customRtmpUrls: stream.customRtmpUrls ? JSON.parse(stream.customRtmpUrls) : undefined,
                videoFiles: JSON.parse(stream.videoFiles),
                audioFiles: JSON.parse(stream.audioFiles),
                shuffleHistory: JSON.parse(stream.shuffleHistory),
                fxPreset: stream.fxPresetId ? await this.prisma.fxPreset.findUnique({ where: { id: stream.fxPresetId } }) : undefined,
                visualizer: stream.visualizerId ? await this.prisma.visualizer.findUnique({ where: { id: stream.visualizerId } }) : undefined,
                schedule: stream.scheduleId ? await this.prisma.schedule.findUnique({ where: { id: stream.scheduleId } }) : undefined,
            };
            const input = {
                videoFiles: sharedStream.videoFiles,
                playlistId: stream.playlistId || undefined,
                sourceType: sharedStream.sourceType,
                audioFiles: sharedStream.audioFiles,
            };
            const output = {
                rtmpUrl: 'rtmp://localhost:1935',
                streamKey,
            };
            await this.ffmpegProcessor.start(streamId, input, output, sharedStream, sharedStream.fxPreset, sharedStream.visualizer);
            return ok(undefined);
        }
        catch (error) {
            return err({ code: 'FFMPEG_START_FAILED', message: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async stop(id) {
        const stream = await this.prisma.stream.findUnique({ where: { id } });
        if (!stream)
            return;
        this.ffmpegProcessor.stop(id);
        await this.app.rtmpRelayService.stopRelay(id);
        await this.prisma.stream.update({
            where: { id },
            data: { status: 'STOPPED', stoppedAt: new Date(), currentBroadcastId: null },
        });
        this.logger.info('Stream stopped', { streamId: id });
    }
    async restart(id) {
        await this.stop(id);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.start(id);
    }
    async getStatus(id) {
        const stream = await this.prisma.stream.findUnique({ where: { id } });
        if (!stream)
            throw new Error('Stream not found');
        const ffmpegStatus = this.ffmpegProcessor.getStatus(id);
        const relayStatus = this.app.rtmpRelayService?.getRelayStatus(id);
        const stats = ffmpegStatus?.stats || { bitrate: 0, fps: 0, droppedFrames: 0, totalFrames: 0, speed: 0, audioLevel: 0 };
        const ffmpegHealth = ffmpegStatus?.health || { isHealthy: true, lastCheck: new Date(), reconnectCount: 0, lastError: null };
        return {
            streamId: stream.id,
            status: stream.status,
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
    async getLogs(streamId, query) {
        const where = { streamId };
        if (query.level)
            where.level = query.level;
        return this.prisma.streamLog.findMany({
            where,
            take: query.limit || 100,
            orderBy: { createdAt: 'desc' },
        });
    }
}
//# sourceMappingURL=stream.service.js.map