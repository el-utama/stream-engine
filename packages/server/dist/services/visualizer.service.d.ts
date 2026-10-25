import { BaseService } from './base.service.js';
export declare class VisualizerService extends BaseService {
    list(includeBuiltIn: boolean): Promise<({
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
    } | {
        id: string;
        name: "Spectrum Bars" | "Waveform" | "Circular Spectrum" | "Dual View (Spectrum + Waveform)" | "Minimal Bars";
        type: import("packages/shared/dist/enums.js").VisualizerType.SPECTRUM_BARS | import("packages/shared/dist/enums.js").VisualizerType.WAVEFORM | import("packages/shared/dist/enums.js").VisualizerType.CIRCULAR | import("packages/shared/dist/enums.js").VisualizerType.CUSTOM;
        config: {
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
        } | {
            readonly waveform: {
                readonly style: "mirror";
                readonly thickness: 2;
                readonly color: "#00ff00";
                readonly glow: true;
            };
            readonly fftSize: 2048;
            readonly frequencyRange: readonly [20, 20000];
            readonly smoothingTimeConstant: 0.3;
        } | {
            readonly circular: {
                readonly radius: 400;
                readonly bars: 180;
                readonly rotationSpeed: 0.5;
                readonly bassPulse: true;
            };
            readonly fftSize: 4096;
            readonly frequencyRange: readonly [20, 20000];
            readonly smoothingTimeConstant: 0.6;
        } | {
            readonly customFilter: "\n        [0:a]showspectrum=mode=separate:color=rainbow:scale=log:size=1920x720:rate=30[spec];\n        [0:a]showwaves=mode=cline:colors=white:size=1920x360:rate=30[wave];\n        [spec][wave]vstack[viz]\n      ";
        } | {
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
        backgroundType: import("packages/shared/dist/enums.js").BackgroundType.COLOR | import("packages/shared/dist/enums.js").BackgroundType.GRADIENT;
        backgroundConfig: {
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
        } | {
            readonly color: "#000000";
        } | {
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
        } | {
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
        } | {
            readonly color: "#000000";
        };
        width: 1920;
        height: 1080;
        fps: 30;
        isBuiltIn: boolean;
    })[]>;
    create(userId: string, data: any): Promise<{
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
    }>;
    getById(id: string): Promise<{
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
    } | {
        isBuiltIn: boolean;
        name: "Spectrum Bars";
        type: import("packages/shared/dist/enums.js").VisualizerType.SPECTRUM_BARS;
        config: {
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
        backgroundType: import("packages/shared/dist/enums.js").BackgroundType.GRADIENT;
        backgroundConfig: {
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
        width: 1920;
        height: 1080;
        fps: 30;
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Waveform";
        type: import("packages/shared/dist/enums.js").VisualizerType.WAVEFORM;
        config: {
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
        backgroundType: import("packages/shared/dist/enums.js").BackgroundType.COLOR;
        backgroundConfig: {
            readonly color: "#000000";
        };
        width: 1920;
        height: 1080;
        fps: 30;
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Circular Spectrum";
        type: import("packages/shared/dist/enums.js").VisualizerType.CIRCULAR;
        config: {
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
        backgroundType: import("packages/shared/dist/enums.js").BackgroundType.GRADIENT;
        backgroundConfig: {
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
        width: 1920;
        height: 1080;
        fps: 30;
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Dual View (Spectrum + Waveform)";
        type: import("packages/shared/dist/enums.js").VisualizerType.CUSTOM;
        config: {
            readonly customFilter: "\n        [0:a]showspectrum=mode=separate:color=rainbow:scale=log:size=1920x720:rate=30[spec];\n        [0:a]showwaves=mode=cline:colors=white:size=1920x360:rate=30[wave];\n        [spec][wave]vstack[viz]\n      ";
        };
        backgroundType: import("packages/shared/dist/enums.js").BackgroundType.GRADIENT;
        backgroundConfig: {
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
        width: 1920;
        height: 1080;
        fps: 30;
        id: string;
    } | {
        isBuiltIn: boolean;
        name: "Minimal Bars";
        type: import("packages/shared/dist/enums.js").VisualizerType.SPECTRUM_BARS;
        config: {
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
        backgroundType: import("packages/shared/dist/enums.js").BackgroundType.COLOR;
        backgroundConfig: {
            readonly color: "#000000";
        };
        width: 1920;
        height: 1080;
        fps: 30;
        id: string;
    } | null>;
    update(id: string, data: any): Promise<{
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
    }>;
    delete(id: string): Promise<void>;
    generateFilter(config: any): Promise<string>;
    private buildSpectrumFilter;
    private buildWaveformFilter;
    private buildCircularFilter;
    generatePreview(id: string, duration: number): Promise<string>;
}
//# sourceMappingURL=visualizer.service.d.ts.map