import { FxIntensity, NoiseProfile } from '../types';
export declare const BUILTIN_FX_PRESETS: {
    readonly soft: {
        readonly name: "Soft";
        readonly description: "Minimal changes, highest quality. For own content re-upload.";
        readonly intensity: FxIntensity.LOW;
        readonly videoFilters: {
            readonly crop: {
                readonly percent: 1;
                readonly randomize: true;
            };
        };
        readonly audioFilters: {
            readonly noise: {
                readonly type: NoiseProfile.PINK;
                readonly amplitude: 0.005;
                readonly mixLevel: -30;
            };
        };
    };
    readonly balanced: {
        readonly name: "Balanced";
        readonly description: "General music streaming. VMAF ≥ 92.";
        readonly intensity: FxIntensity.MEDIUM;
        readonly videoFilters: {
            readonly crop: {
                readonly percent: 2;
                readonly randomize: true;
            };
            readonly colorJitter: {
                readonly brightness: 0.01;
                readonly contrast: 0.01;
                readonly saturation: 0.02;
                readonly gamma: 0.02;
                readonly hue: 1;
            };
        };
        readonly audioFilters: {
            readonly noise: {
                readonly type: NoiseProfile.BROWN;
                readonly amplitude: 0.01;
                readonly mixLevel: -25;
            };
            readonly loudness: {
                readonly target: -16;
                readonly jitter: 0.5;
            };
        };
    };
    readonly aggressive: {
        readonly name: "Aggressive";
        readonly description: "Maximum uniqueness. Visible changes.";
        readonly intensity: FxIntensity.HIGH;
        readonly videoFilters: {
            readonly crop: {
                readonly percent: 3;
                readonly randomize: true;
            };
            readonly rotate: {
                readonly degrees: 0.3;
                readonly randomize: true;
            };
            readonly colorJitter: {
                readonly brightness: 0.02;
                readonly contrast: 0.02;
                readonly saturation: 0.05;
                readonly gamma: 0.05;
                readonly hue: 2;
            };
            readonly noise: {
                readonly type: "film";
                readonly strength: 5;
                readonly temporal: true;
            };
            readonly speed: {
                readonly factor: 1.005;
                readonly pitchCorrection: true;
            };
        };
        readonly audioFilters: {
            readonly noise: {
                readonly type: NoiseProfile.PINK;
                readonly amplitude: 0.02;
                readonly mixLevel: -20;
            };
            readonly spectralSmear: {
                readonly enabled: true;
                readonly intensity: 0.3;
            };
            readonly pitchShift: {
                readonly semitones: 0.2;
            };
            readonly tempoShift: {
                readonly factor: 1.005;
            };
            readonly loudness: {
                readonly target: -16;
                readonly jitter: 1;
            };
        };
    };
    readonly cidAware: {
        readonly name: "CID Aware";
        readonly description: "Content ID divergence calibrated. Best for YouTube.";
        readonly intensity: FxIntensity.MEDIUM;
        readonly videoFilters: {
            readonly crop: {
                readonly percent: 2;
                readonly randomize: false;
            };
            readonly colorJitter: {
                readonly brightness: 0.015;
                readonly contrast: 0.015;
                readonly saturation: 0.03;
                readonly gamma: 0.03;
                readonly hue: 0;
            };
            readonly frameJitter: {
                readonly enabled: true;
                readonly dropRate: 0.001;
                readonly blendRate: 0.5;
            };
        };
        readonly audioFilters: {
            readonly spectralSmear: {
                readonly enabled: true;
                readonly intensity: 0.2;
            };
            readonly compand: {
                readonly attack: 5;
                readonly release: 50;
                readonly threshold: -20;
                readonly ratio: 2;
            };
            readonly loudness: {
                readonly target: -14;
                readonly jitter: 0.3;
            };
        };
    };
    readonly cidAggressive: {
        readonly name: "CID Aggressive";
        readonly description: "Stronger shifts for strict detection.";
        readonly intensity: FxIntensity.HIGH;
        readonly videoFilters: {
            readonly crop: {
                readonly percent: 3;
                readonly randomize: true;
            };
            readonly colorJitter: {
                readonly brightness: 0.02;
                readonly contrast: 0.02;
                readonly saturation: 0.04;
                readonly gamma: 0.04;
                readonly hue: 0;
            };
            readonly frameJitter: {
                readonly enabled: true;
                readonly dropRate: 0.002;
                readonly blendRate: 0.5;
            };
            readonly speed: {
                readonly factor: 1.003;
                readonly pitchCorrection: true;
            };
        };
        readonly audioFilters: {
            readonly spectralSmear: {
                readonly enabled: true;
                readonly intensity: 0.3;
            };
            readonly pitchShift: {
                readonly semitones: 0.15;
            };
            readonly tempoShift: {
                readonly factor: 1.003;
            };
            readonly compand: {
                readonly attack: 3;
                readonly release: 30;
                readonly threshold: -18;
                readonly ratio: 2.5;
            };
            readonly loudness: {
                readonly target: -14;
                readonly jitter: 0.5;
            };
        };
    };
    readonly musicStream: {
        readonly name: "Music Stream";
        readonly description: "Audio-focused, preserves video quality.";
        readonly intensity: FxIntensity.MEDIUM;
        readonly videoFilters: {};
        readonly audioFilters: {
            readonly noise: {
                readonly type: NoiseProfile.BROWN;
                readonly amplitude: 0.008;
                readonly mixLevel: -28;
            };
            readonly loudness: {
                readonly target: -16;
                readonly jitter: 0.3;
            };
            readonly compand: {
                readonly attack: 10;
                readonly release: 100;
                readonly threshold: -24;
                readonly ratio: 1.5;
            };
        };
    };
    readonly gaming: {
        readonly name: "Gaming";
        readonly description: "Minimal visual impact, audio noise only.";
        readonly intensity: FxIntensity.LOW;
        readonly videoFilters: {};
        readonly audioFilters: {
            readonly noise: {
                readonly type: NoiseProfile.PINK;
                readonly amplitude: 0.003;
                readonly mixLevel: -35;
            };
        };
    };
};
import { VisualizerType, BackgroundType } from '../types';
export declare const BUILTIN_VISUALIZERS: {
    readonly spectrumBars: {
        readonly name: "Spectrum Bars";
        readonly type: VisualizerType.SPECTRUM_BARS;
        readonly config: {
            readonly bars: {
                readonly count: 128;
                readonly spacing: 2;
                readonly width: 8;
                readonly height: 800;
                readonly colors: readonly ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#ff00ff"];
                readonly mirror: true;
                readonly peakHold: true;
                readonly smoothing: 0.8;
            };
            readonly fftSize: 4096;
            readonly frequencyRange: readonly [20, 20000];
            readonly smoothingTimeConstant: 0.8;
        };
        readonly backgroundType: BackgroundType.GRADIENT;
        readonly backgroundConfig: {
            readonly gradient: {
                readonly direction: "vertical";
                readonly stops: readonly [{
                    readonly position: 0;
                    readonly color: "#0a0a0a";
                }, {
                    readonly position: 1;
                    readonly color: "#1a1a2e";
                }];
            };
        };
        readonly width: 1920;
        readonly height: 1080;
        readonly fps: 30;
    };
    readonly waveform: {
        readonly name: "Waveform";
        readonly type: VisualizerType.WAVEFORM;
        readonly config: {
            readonly waveform: {
                readonly style: "mirror";
                readonly thickness: 2;
                readonly color: "#00ff00";
                readonly glow: true;
            };
            readonly fftSize: 2048;
            readonly frequencyRange: readonly [20, 20000];
            readonly smoothingTimeConstant: 0.3;
        };
        readonly backgroundType: BackgroundType.COLOR;
        readonly backgroundConfig: {
            readonly color: "#000000";
        };
        readonly width: 1920;
        readonly height: 1080;
        readonly fps: 30;
    };
    readonly circular: {
        readonly name: "Circular Spectrum";
        readonly type: VisualizerType.CIRCULAR;
        readonly config: {
            readonly circular: {
                readonly radius: 400;
                readonly bars: 180;
                readonly rotationSpeed: 0.5;
                readonly bassPulse: true;
            };
            readonly fftSize: 4096;
            readonly frequencyRange: readonly [20, 20000];
            readonly smoothingTimeConstant: 0.6;
        };
        readonly backgroundType: BackgroundType.GRADIENT;
        readonly backgroundConfig: {
            readonly gradient: {
                readonly direction: "radial";
                readonly stops: readonly [{
                    readonly position: 0;
                    readonly color: "#1a1a2e";
                }, {
                    readonly position: 1;
                    readonly color: "#0f0f1a";
                }];
            };
        };
        readonly width: 1920;
        readonly height: 1080;
        readonly fps: 30;
    };
    readonly dualView: {
        readonly name: "Dual View (Spectrum + Waveform)";
        readonly type: VisualizerType.CUSTOM;
        readonly config: {
            readonly customFilter: "\n        [0:a]showspectrum=mode=separate:color=rainbow:scale=log:size=1920x720:rate=30[spec];\n        [0:a]showwaves=mode=cline:colors=white:size=1920x360:rate=30[wave];\n        [spec][wave]vstack[viz]\n      ";
        };
        readonly backgroundType: BackgroundType.GRADIENT;
        readonly backgroundConfig: {
            readonly gradient: {
                readonly direction: "vertical";
                readonly stops: readonly [{
                    readonly position: 0;
                    readonly color: "#0a0a1a";
                }, {
                    readonly position: 0.5;
                    readonly color: "#1a1a3e";
                }, {
                    readonly position: 1;
                    readonly color: "#0a0a1a";
                }];
            };
        };
        readonly width: 1920;
        readonly height: 1080;
        readonly fps: 30;
    };
    readonly minimal: {
        readonly name: "Minimal Bars";
        readonly type: VisualizerType.SPECTRUM_BARS;
        readonly config: {
            readonly bars: {
                readonly count: 64;
                readonly spacing: 4;
                readonly width: 12;
                readonly height: 600;
                readonly colors: readonly ["#00ff88"];
                readonly mirror: false;
                readonly peakHold: true;
                readonly smoothing: 0.9;
            };
            readonly fftSize: 2048;
            readonly frequencyRange: readonly [60, 16000];
            readonly smoothingTimeConstant: 0.9;
        };
        readonly backgroundType: BackgroundType.COLOR;
        readonly backgroundConfig: {
            readonly color: "#000000";
        };
        readonly width: 1920;
        readonly height: 1080;
        readonly fps: 30;
    };
};
export declare const DEFAULT_STREAM_SETTINGS: {
    resolution: string;
    fps: number;
    videoBitrate: number;
    audioBitrate: number;
    codec: string;
    preset: string;
    loopMode: "INFINITE";
    shuffleEnabled: boolean;
    crossfadeDuration: number;
    audioSource: "VIDEO";
    noiseAmplitude: number;
    autoRestart: boolean;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    healthCheckInterval: number;
};
export declare const DEFAULT_SCHEDULE_SETTINGS: {
    timezone: string;
    isActive: boolean;
};
export declare const YOUTUBE_CATEGORIES: {
    readonly MUSIC: "10";
    readonly GAMING: "20";
    readonly ENTERTAINMENT: "24";
    readonly EDUCATION: "27";
    readonly SCIENCE_TECH: "28";
};
//# sourceMappingURL=index.d.ts.map