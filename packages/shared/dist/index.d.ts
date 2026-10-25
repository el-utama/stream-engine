import { SourceType, LoopMode, Platform, StreamStatus, AudioSource, NoiseProfile, FxIntensity, VisualizerType, BackgroundType, LogLevel, VideoFilterConfig, AudioFilterConfig } from './enums.js';
export type { SourceType, LoopMode, Platform, StreamStatus, AudioSource, NoiseProfile, FxIntensity, VisualizerType, BackgroundType, LogLevel, VideoFilterConfig, AudioFilterConfig, } from './enums.js';
export interface User {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface YouTubeAccount {
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
}
export interface Stream {
    id: string;
    userId: string;
    accountId: string;
    name: string;
    description: string | null;
    sourceType: SourceType;
    videoFiles: string[];
    playlistId: string | null;
    rtmpPushKey: string | null;
    loopMode: LoopMode;
    shuffleEnabled: boolean;
    crossfadeDuration: number;
    outputPlatforms: Platform[];
    customRtmpUrls: Record<string, {
        url: string;
        key: string;
    }> | null;
    resolution: string;
    fps: number;
    videoBitrate: number;
    audioBitrate: number;
    codec: string;
    preset: string;
    fxPresetId: string | null;
    customFxFilters: string | null;
    audioSource: AudioSource;
    audioFiles: string[];
    noiseProfile: NoiseProfile | null;
    noiseAmplitude: number;
    scheduleId: string | null;
    maxDuration: number | null;
    autoRestart: boolean;
    status: StreamStatus;
    currentBroadcastId: string | null;
    startedAt: Date | null;
    stoppedAt: Date | null;
    totalUptime: number;
    titleTemplate: string | null;
    descriptionTemplate: string | null;
    tagsTemplate: string | null;
    thumbnailPath: string | null;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    healthCheckInterval: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Schedule {
    id: string;
    userId: string;
    name: string;
    cronExpression: string;
    timezone: string;
    startDate: Date | null;
    endDate: Date | null;
    maxDuration: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface FxPreset {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    filterGraph: string;
    videoFilters: VideoFilterConfig;
    audioFilters: AudioFilterConfig;
    intensity: FxIntensity;
    isBuiltIn: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Visualizer {
    id: string;
    userId: string;
    name: string;
    type: VisualizerType;
    config: VisualizerConfig;
    backgroundType: BackgroundType;
    backgroundConfig: BackgroundConfig;
    width: number;
    height: number;
    fps: number;
    isBuiltIn: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface StreamLog {
    id: string;
    streamId: string;
    level: LogLevel;
    message: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
}
export interface VisualizerConfig {
    type: VisualizerType;
    bars?: {
        count: number;
        spacing: number;
        width: number;
        height: number;
        colors: string[];
        mirror: boolean;
        peakHold: boolean;
        smoothing: number;
    };
    waveform?: {
        style: 'line' | 'filled' | 'mirror';
        thickness: number;
        color: string;
        glow: boolean;
    };
    circular?: {
        radius: number;
        bars: number;
        rotationSpeed: number;
        bassPulse: boolean;
    };
    particles?: {
        count: number;
        bassSize: boolean;
        trebleVelocity: boolean;
        midColor: boolean;
    };
    fftSize: 2048 | 4096 | 8192;
    frequencyRange: [number, number];
    smoothingTimeConstant: number;
}
export interface BackgroundConfig {
    color?: string;
    gradient?: {
        direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
        stops: {
            position: number;
            color: string;
        }[];
    };
    image?: {
        url: string;
        fit: 'cover' | 'contain' | 'stretch' | 'tile';
        opacity: number;
        blur: number;
        darken: number;
    };
    video?: {
        url: string;
        loop: boolean;
        opacity: number;
        darken: number;
    };
}
export interface CreateStreamInput {
    name: string;
    description?: string;
    accountId: string;
    sourceType: SourceType;
    videoFiles?: string[];
    playlistId?: string;
    outputPlatforms: Platform[];
    customRtmpUrls?: Record<string, {
        url: string;
        key: string;
    }>;
    resolution?: string;
    fps?: number;
    videoBitrate?: number;
    audioBitrate?: number;
    codec?: string;
    preset?: string;
    loopMode?: LoopMode;
    shuffleEnabled?: boolean;
    crossfadeDuration?: number;
    fxPresetId?: string;
    customFxFilters?: string;
    audioSource?: AudioSource;
    audioFiles?: string[];
    noiseProfile?: NoiseProfile;
    noiseAmplitude?: number;
    scheduleId?: string;
    maxDuration?: number;
    autoRestart?: boolean;
    titleTemplate?: string;
    descriptionTemplate?: string;
    tagsTemplate?: string;
    thumbnailPath?: string;
}
export interface UpdateStreamInput extends Partial<CreateStreamInput> {
    id: string;
}
export interface StreamStatusResponse {
    streamId: string;
    status: StreamStatus;
    broadcastId: string | null;
    startedAt: Date | null;
    uptime: number;
    currentVideo?: string;
    currentVideoIndex?: number;
    playlistProgress?: number;
    stats: StreamStats;
    health: StreamHealth;
}
export interface StreamStats {
    bitrate: number;
    fps: number;
    droppedFrames: number;
    totalFrames: number;
    speed: number;
    audioLevel: number;
    viewers?: number;
}
export interface StreamHealth {
    isHealthy: boolean;
    lastCheck: Date;
    reconnectCount: number;
    lastError: string | null;
    networkLatency: number;
}
export interface CreateScheduleInput {
    name: string;
    cronExpression: string;
    timezone?: string;
    startDate?: Date;
    endDate?: Date;
    maxDuration?: number;
}
export interface CreateFxPresetInput {
    name: string;
    description?: string;
    videoFilters: VideoFilterConfig;
    audioFilters: AudioFilterConfig;
    intensity: FxIntensity;
}
export interface CreateVisualizerInput {
    name: string;
    type: VisualizerType;
    config: VisualizerConfig;
    backgroundType: BackgroundType;
    backgroundConfig: BackgroundConfig;
    width?: number;
    height?: number;
    fps?: number;
}
export interface YouTubeBroadcast {
    id: string;
    snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        thumbnails: Record<string, {
            url: string;
            width: number;
            height: number;
        }>;
        scheduledStartTime: string;
        scheduledEndTime: string | null;
        actualStartTime: string | null;
        actualEndTime: string | null;
        liveChatId: string;
    };
    status: {
        lifeCycleStatus: 'created' | 'ready' | 'testing' | 'live' | 'complete' | 'revoked';
        privacyStatus: 'private' | 'public' | 'unlisted';
        recordingStatus: 'notRecording' | 'recorded' | 'recording';
        madeForKids: boolean;
    };
    contentDetails: {
        boundStreamId: string | null;
        monitorStream: {
            enableMonitorStream: boolean;
            broadcastStreamDelayMs: number;
        };
        enableEmbed: boolean;
        enableDvr: boolean;
        enableAutoStart: boolean;
        enableAutoStop: boolean;
    };
}
export interface YouTubeLiveStream {
    id: string;
    snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        isDefaultStream: boolean;
    };
    cdn: {
        ingestionType: string;
        ingestionInfo: {
            streamName: string;
            ingestionAddress: string;
            backupIngestionAddress: string;
        };
        resolution: string;
        frameRate: string;
        bitrateRange: string;
    };
    status: {
        streamStatus: 'active' | 'inactive' | 'ready';
        healthStatus: {
            status: 'good' | 'ok' | 'bad' | 'noData';
            lastUpdateTimeSeconds: string;
            configurationIssues: string[];
        };
    };
}
export interface MetadataTemplate {
    title: string;
    description: string;
    tags: string;
}
export interface StreamContext {
    date: string;
    time: string;
    playlistName?: string;
    currentVideo?: string;
    videoIndex: number;
    totalVideos: number;
    streamNumber: number;
    currentViewers?: number;
    genre?: string;
    mood?: string;
}
export interface SocketEvents {
    'stream:status': StreamStatusResponse;
    'stream:stats': {
        streamId: string;
        stats: StreamStats;
    };
    'stream:log': {
        streamId: string;
        log: StreamLog;
    };
    'stream:error': {
        streamId: string;
        error: string;
        fatal: boolean;
    };
    'stream:started': {
        streamId: string;
        broadcastId: string;
    };
    'stream:stopped': {
        streamId: string;
        reason: string;
    };
    'schedule:triggered': {
        scheduleId: string;
        streamId: string;
    };
    'account:tokenRefreshed': {
        accountId: string;
    };
    'system:health': SystemHealth;
}
export interface SystemHealth {
    cpu: number;
    memory: number;
    disk: number;
    gpu?: {
        name: string;
        memoryUsed: number;
        memoryTotal: number;
        utilization: number;
    };
    activeStreams: number;
    uptime: number;
}
export interface StreamLog {
    id: string;
    streamId: string;
    level: LogLevel;
    message: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
}
export * from './constants/index.js';
export * from './utils/encryption.js';
export * from './utils/result.js';
export * from './utils/hwaccel.js';
export * from './schemas/stream.schema.js';
export * from './schemas/auth.schema.js';
export * from './enums.js';
//# sourceMappingURL=index.d.ts.map