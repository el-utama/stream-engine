export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeAccount {
  id: string;
  userId: string;
  channelId: string;
  channelName: string;
  channelHandle: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SourceType = 'VIDEO_FILE' | 'PLAYLIST' | 'RTMP_PUSH' | 'WEBCAM' | 'VISUALIZER';
export type LoopMode = 'INFINITE' | 'ONCE' | 'COUNT';
export type Platform = 'YOUTUBE' | 'TWITCH' | 'FACEBOOK' | 'CUSTOM_RTMP';
export type StreamStatus = 'STOPPED' | 'STARTING' | 'LIVE' | 'ERROR' | 'RECONNECTING' | 'STOPPING';
export type AudioSource = 'VIDEO' | 'FILE' | 'NOISE' | 'MIX';
export type NoiseProfile = 'WHITE' | 'PINK' | 'BROWN' | 'BLUE' | 'VIOLET' | 'VELVET' | 'CUSTOM';

export interface Stream {
  id: string;
  userId: string;
  accountId: string | null;
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
  customRtmpUrls: Record<string, { url: string; key: string }> | null;
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
  startedAt: string | null;
  stoppedAt: string | null;
  totalUptime: number;
  titleTemplate: string | null;
  descriptionTemplate: string | null;
  tagsTemplate: string | null;
  thumbnailPath: string | null;
  fxPreset: FxPreset | null;
  visualizerId: string | null;
  visualizer: Visualizer | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  healthCheckInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface FxPreset {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  filterGraph: string;
  videoFilters: Record<string, any>;
  audioFilters: Record<string, any>;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'AGGRESSIVE';
  isBuiltIn: boolean;
  vmafScore: number | null;
  vmafDetails: any | null;
  vmafTestedAt: string | null;
  customFilterGraph: string | null;
  tags: string | null;
  version: number;
  previousVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Visualizer {
  id: string;
  userId: string;
  name: string;
  type: string;
  config: Record<string, any>;
  backgroundType: string;
  backgroundConfig: Record<string, any>;
  width: number;
  height: number;
  fps: number;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  userId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  startDate: string | null;
  endDate: string | null;
  maxDuration: number | null;
  isActive: boolean;
  streamId: string | null;
  stream: Stream | null;
  createdAt: string;
  updatedAt: string;
}

export interface StreamStatusResponse {
  streamId: string;
  status: StreamStatus;
  broadcastId: string | null;
  currentBroadcastId: string | null;
  startedAt: string | null;
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
    lastCheck: string;
    reconnectCount: number;
    lastError: string | null;
    networkLatency: number;
  };
}

export interface VmafTestResult {
  success: boolean;
  vmafScore: number | null;
  details: {
    perFrame: number[];
    stats: {
      mean: number;
      stddev: number;
      min: number;
      max: number;
    };
  } | null;
  error: string | null;
  filterGraph: string;
}
