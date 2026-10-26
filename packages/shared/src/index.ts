// Shared Package - Main Exports

import {
  SourceType,
  LoopMode,
  Platform,
  StreamStatus,
  AudioSource,
  NoiseProfile,
  FxIntensity,
  VisualizerType,
  BackgroundType,
  LogLevel,
  VideoFilterConfig,
  AudioFilterConfig,
} from './enums.js';

export type {
  SourceType,
  LoopMode,
  Platform,
  StreamStatus,
  AudioSource,
  NoiseProfile,
  FxIntensity,
  VisualizerType,
  BackgroundType,
  LogLevel,
  VideoFilterConfig,
  AudioFilterConfig,
} from './enums.js';

// ==================== Core Entities ====================

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

  // Source Configuration
  sourceType: SourceType;
  videoFiles: string[]; // JSON array
  playlistId: string | null;
  rtmpPushKey: string | null;

  // Loop & Playback
  loopMode: LoopMode;
  shuffleEnabled: boolean;
  crossfadeDuration: number; // seconds

  // Output Configuration
  outputPlatforms: Platform[];
  customRtmpUrls: Record<string, { url: string; key: string }> | null;

  // Video Settings
  resolution: string;
  fps: number;
  videoBitrate: number; // kbps
  audioBitrate: number; // kbps
  codec: string;
  preset: string;

  // FX Engine
  fxPresetId: string | null;
  customFxFilters: string | null;

  // Audio
  audioSource: AudioSource;
  audioFiles: string[];
  noiseProfile: NoiseProfile | null;
  noiseAmplitude: number;

  // Scheduling
  scheduleId: string | null;
  maxDuration: number | null; // hours
  autoRestart: boolean;

  // Status
  status: StreamStatus;
  currentBroadcastId: string | null;
  startedAt: Date | null;
  stoppedAt: Date | null;
  totalUptime: number; // seconds

  // Metadata
  titleTemplate: string | null;
  descriptionTemplate: string | null;
  tagsTemplate: string | null;
  thumbnailPath: string | null;

  // Anti-ghosting
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number; // seconds
  healthCheckInterval: number; // seconds

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
  maxDuration: number | null; // hours
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FxPreset {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  filterGraph: string; // FFmpeg filter_complex
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

// ==================== FX & Visualizer Configs ====================

export interface VisualizerConfig {
  type: VisualizerType;

  // Spectrum Bars
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

  // Waveform
  waveform?: {
    style: 'line' | 'filled' | 'mirror';
    thickness: number;
    color: string;
    glow: boolean;
  };

  // Circular
  circular?: {
    radius: number;
    bars: number;
    rotationSpeed: number;
    bassPulse: boolean;
  };

  // Particles
  particles?: {
    count: number;
    bassSize: boolean;
    trebleVelocity: boolean;
    midColor: boolean;
  };

  // Audio analysis
  fftSize: 2048 | 4096 | 8192;
  frequencyRange: [number, number];
  smoothingTimeConstant: number;
}

export interface BackgroundConfig {
  color?: string;
  gradient?: {
    direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
    stops: { position: number; color: string }[];
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

// ==================== API Types ====================

export interface CreateStreamInput {
  name: string;
  description?: string;
  accountId: string;
  sourceType: SourceType;
  videoFiles?: string[];
  playlistId?: string;
  outputPlatforms: Platform[];
  customRtmpUrls?: Record<string, { url: string; key: string }>;
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
  bitrate: number; // kbps
  fps: number;
  droppedFrames: number;
  totalFrames: number;
  speed: number; // encoding speed multiplier
  audioLevel: number; // dB
  viewers?: number;
}

export interface StreamHealth {
  isHealthy: boolean;
  lastCheck: Date;
  reconnectCount: number;
  lastError: string | null;
  networkLatency: number; // ms
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

// ==================== YouTube API Types ====================

export interface YouTubeBroadcast {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
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
    },
  },
}

export interface MetadataTemplate {
  title: string;
  description: string;
  tags: string;
}

// ==================== WebSocket Events ====================

export interface SocketEvents {
  'stream:status': StreamStatusResponse;
  'stream:stats': { streamId: string; stats: StreamStats };
  'stream:log': { streamId: string; log: StreamLog };
  'stream:error': { streamId: string; error: string; fatal: boolean };
  'stream:started': { streamId: string; broadcastId: string };
  'stream:stopped': { streamId: string; reason: string };
  'schedule:triggered': { scheduleId: string; streamId: string };
  'account:tokenRefreshed': { accountId: string };
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

// Re-export constants
export * from './constants/index.js';

// Re-export utils
export * from './utils/encryption.js';
export * from './utils/result.js';
export * from './utils/hwaccel.js';
export * from './utils/metadata-renderer.js';

// Re-export VMAF types
export * from './types/vmaf.js';

// Re-export schemas
export * from './schemas/stream.schema.js';
export * from './schemas/auth.schema.js';

// Re-export enums
export * from './enums.js';