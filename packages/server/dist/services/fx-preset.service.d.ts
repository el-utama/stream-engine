import { BaseService } from './base.service.js';
export declare class FxPresetService extends BaseService {
    list(includeBuiltIn: boolean): Promise<({
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
    } | {
        id: string;
        name: string;
        description: string;
        intensity: string;
        isBuiltIn: boolean;
        videoFilters: any;
        audioFilters: any;
    })[]>;
    create(userId: string, data: any): Promise<{
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
    }>;
    getById(id: string): Promise<{
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
    } | {
        isBuiltIn: boolean;
        name: "Soft";
        description: "Minimal changes, highest quality. For own content re-upload.";
        intensity: import("packages/shared/dist/enums.js").FxIntensity.LOW;
        videoFilters: {
            readonly crop: {
                readonly percent: 1;
                readonly randomize: true;
            };
        };
        audioFilters: {
            readonly noise: {
                readonly type: import("packages/shared/dist/enums.js").NoiseProfile.PINK;
                readonly amplitude: 0.005;
                readonly mixLevel: -30;
            };
        };
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Balanced";
        description: "General music streaming. VMAF \u2265 92.";
        intensity: import("packages/shared/dist/enums.js").FxIntensity.MEDIUM;
        videoFilters: {
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
        audioFilters: {
            readonly noise: {
                readonly type: import("packages/shared/dist/enums.js").NoiseProfile.BROWN;
                readonly amplitude: 0.01;
                readonly mixLevel: -25;
            };
            readonly loudness: {
                readonly target: -16;
                readonly jitter: 0.5;
            };
        };
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Aggressive";
        description: "Maximum uniqueness. Visible changes.";
        intensity: import("packages/shared/dist/enums.js").FxIntensity.HIGH;
        videoFilters: {
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
        audioFilters: {
            readonly noise: {
                readonly type: import("packages/shared/dist/enums.js").NoiseProfile.PINK;
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
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "CID Aware";
        description: "Content ID divergence calibrated. Best for YouTube.";
        intensity: import("packages/shared/dist/enums.js").FxIntensity.MEDIUM;
        videoFilters: {
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
        audioFilters: {
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
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "CID Aggressive";
        description: "Stronger shifts for strict detection.";
        intensity: import("packages/shared/dist/enums.js").FxIntensity.HIGH;
        videoFilters: {
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
        audioFilters: {
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
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Music Stream";
        description: "Audio-focused, preserves video quality.";
        intensity: import("packages/shared/dist/enums.js").FxIntensity.MEDIUM;
        videoFilters: {};
        audioFilters: {
            readonly noise: {
                readonly type: import("packages/shared/dist/enums.js").NoiseProfile.BROWN;
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
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Gaming";
        description: "Minimal visual impact, audio noise only.";
        intensity: import("packages/shared/dist/enums.js").FxIntensity.LOW;
        videoFilters: {};
        audioFilters: {
            readonly noise: {
                readonly type: import("packages/shared/dist/enums.js").NoiseProfile.PINK;
                readonly amplitude: 0.003;
                readonly mixLevel: -35;
            };
        };
        id: string;
    } | null>;
    update(id: string, data: any): Promise<{
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
    }>;
    delete(id: string): Promise<void>;
    testPreset(id: string, sampleFile?: string): Promise<{
        success: boolean;
        output: string;
        error: undefined;
    }>;
}
//# sourceMappingURL=fx-preset.service.d.ts.map