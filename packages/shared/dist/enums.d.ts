export declare enum SourceType {
    VIDEO_FILE = "VIDEO_FILE",
    PLAYLIST = "PLAYLIST",
    RTMP_PUSH = "RTMP_PUSH",
    WEBCAM = "WEBCAM",
    VISUALIZER = "VISUALIZER"
}
export declare enum LoopMode {
    INFINITE = "INFINITE",
    ONCE = "ONCE",
    COUNT = "COUNT"
}
export declare enum Platform {
    YOUTUBE = "YOUTUBE",
    TWITCH = "TWITCH",
    FACEBOOK = "FACEBOOK",
    CUSTOM_RTMP = "CUSTOM_RTMP"
}
export declare enum StreamStatus {
    STOPPED = "STOPPED",
    STARTING = "STARTING",
    LIVE = "LIVE",
    ERROR = "ERROR",
    RECONNECTING = "RECONNECTING",
    STOPPING = "STOPPING"
}
export declare enum AudioSource {
    VIDEO = "VIDEO",
    FILE = "FILE",
    NOISE = "NOISE",
    MIX = "MIX"
}
export declare enum NoiseProfile {
    WHITE = "WHITE",
    PINK = "PINK",
    BROWN = "BROWN",
    BLUE = "BLUE",
    VIOLET = "VIOLET",
    VELVET = "VELVET",
    CUSTOM = "CUSTOM"
}
export declare enum FxIntensity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    AGGRESSIVE = "AGGRESSIVE"
}
export declare enum VisualizerType {
    SPECTRUM_BARS = "SPECTRUM_BARS",
    WAVEFORM = "WAVEFORM",
    CIRCULAR = "CIRCULAR",
    PARTICLES = "PARTICLES",
    CUSTOM = "CUSTOM"
}
export declare enum BackgroundType {
    COLOR = "COLOR",
    GRADIENT = "GRADIENT",
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export interface VideoFilterConfig {
    crop?: {
        percent: number;
        randomize: boolean;
    };
    rotate?: {
        degrees: number;
        randomize: boolean;
    };
    flip?: {
        horizontal: boolean;
        vertical: boolean;
    };
    colorJitter?: {
        brightness: number;
        contrast: number;
        saturation: number;
        gamma: number;
        hue: number;
    };
    noise?: {
        type: 'grain' | 'digital' | 'film';
        strength: number;
        temporal: boolean;
    };
    frameJitter?: {
        enabled: boolean;
        dropRate: number;
        blendRate: number;
    };
    speed?: {
        factor: number;
        pitchCorrection: boolean;
    };
    watermark?: {
        enabled: boolean;
        payload: string;
        strength: number;
    };
}
export interface AudioFilterConfig {
    noise?: {
        type: NoiseProfile;
        amplitude: number;
        mixLevel: number;
    };
    spectralSmear?: {
        enabled: boolean;
        intensity: number;
    };
    pitchShift?: {
        semitones: number;
    };
    tempoShift?: {
        factor: number;
    };
    compand?: {
        attack: number;
        release: number;
        threshold: number;
        ratio: number;
    };
    reverb?: {
        roomSize: number;
        damping: number;
        wetLevel: number;
    };
    loudness?: {
        target: number;
        jitter: number;
    };
}
//# sourceMappingURL=enums.d.ts.map