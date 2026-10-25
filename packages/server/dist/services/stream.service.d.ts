import { BaseService } from './base.service.js';
import { Result } from '@stream-engine/shared/utils/result';
import { Stream } from '@prisma/client';
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
export declare class StreamService extends BaseService {
    private ffmpegProcessor;
    constructor(app: any);
    list(params: StreamListParams): Promise<{
        data: ({
            schedule: {
                id: string;
                userId: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                maxDuration: number | null;
                cronExpression: string;
                timezone: string;
                startDate: Date | null;
                endDate: Date | null;
            } | null;
            fxPreset: {
                description: string | null;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                filterGraph: string;
                videoFilters: string;
                audioFilters: string;
                intensity: string;
                isBuiltIn: boolean;
            } | null;
            visualizer: {
                type: string;
                config: string;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                fps: number;
                isBuiltIn: boolean;
                backgroundType: string;
                backgroundConfig: string;
                width: number;
                height: number;
            } | null;
            account: {
                id: string;
                userId: string;
                channelId: string;
                channelName: string;
                channelHandle: string | null;
                refreshTokenEnc: string;
                accessTokenEnc: string | null;
                tokenExpiry: Date | null;
                avatarUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            status: string;
            description: string | null;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            name: string;
            sourceType: string;
            videoFiles: string;
            playlistId: string | null;
            rtmpPushKey: string | null;
            loopMode: string;
            shuffleEnabled: boolean;
            crossfadeDuration: number;
            outputPlatforms: string;
            customRtmpUrls: string | null;
            resolution: string;
            fps: number;
            videoBitrate: number;
            audioBitrate: number;
            codec: string;
            preset: string;
            fxPresetId: string | null;
            customFxFilters: string | null;
            audioSource: string;
            audioFiles: string;
            noiseProfile: string | null;
            noiseAmplitude: number;
            scheduleId: string | null;
            maxDuration: number | null;
            autoRestart: boolean;
            currentBroadcastId: string | null;
            startedAt: Date | null;
            stoppedAt: Date | null;
            totalUptime: number;
            titleTemplate: string | null;
            descriptionTemplate: string | null;
            tagsTemplate: string | null;
            thumbnailPath: string | null;
            genre: string | null;
            mood: string | null;
            shuffleHistory: string;
            visualizerId: string | null;
            reconnectAttempts: number;
            maxReconnectAttempts: number;
            reconnectDelay: number;
            healthCheckInterval: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    create(userId: string, data: any): Promise<Stream>;
    getById(id: string): Promise<Stream | null>;
    update(id: string, data: any): Promise<Stream>;
    delete(id: string): Promise<void>;
    start(id: string): Promise<Result<{
        currentBroadcastId: string | null;
    }, {
        code: string;
        message: string;
    }>>;
    private startFFmpegStream;
    stop(id: string): Promise<void>;
    restart(id: string): Promise<void>;
    getStatus(id: string): Promise<StreamStatusResponse>;
    getLogs(streamId: string, query: {
        limit?: number;
        level?: string;
    }): Promise<{
        message: string;
        streamId: string;
        id: string;
        createdAt: Date;
        level: string;
        metadata: string | null;
    }[]>;
}
export {};
//# sourceMappingURL=stream.service.d.ts.map