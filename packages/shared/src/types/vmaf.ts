// VMAF Types

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

export interface VmafTestOptions {
  presetId: string;
  referenceVideoPath?: string;
  testDuration?: number;
}

export interface VmafTestResult {
  success: boolean;
  vmafScore?: number;
  details?: {
    perFrame: number[];
    stats: {
      mean: number;
      stddev: number;
      min: number;
      max: number;
    };
  };
  error?: string;
  vmafError?: string;
  filterGraph: string;
  output?: string;
  ffmpegOutput?: string;
  ffmpegStderr?: string;
}

export interface VmafCompareResult {
  presetA: {
    id: string;
    name: string;
    vmafScore?: number;
  };
  presetB: {
    id: string;
    name: string;
    vmafScore?: number;
  };
  comparison: {
    videoFilters: {
      added: string[];
      removed: string[];
      modified: Array<{ param: string; from: any; to: any }>;
    };
    audioFilters: {
      added: string[];
      removed: string[];
      modified: Array<{ param: string; from: any; to: any }>;
    };
    vmafDifference?: number;
  };
}

export interface PresetDiff {
  videoFilters: {
    added: string[];
    removed: string[];
    modified: Array<{ param: string; from: any; to: any }>;
  };
  audioFilters: {
    added: string[];
    removed: string[];
    modified: Array<{ param: string; from: any; to: any }>;
  };
}