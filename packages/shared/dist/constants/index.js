// Built-in FX Presets (CID-aware calibrated)
import { FxIntensity, NoiseProfile } from '../enums.js';
export const BUILTIN_FX_PRESETS = {
    soft: {
        name: 'Soft',
        description: 'Minimal changes, highest quality. For own content re-upload.',
        intensity: FxIntensity.LOW,
        videoFilters: {
            crop: { percent: 1, randomize: true },
        },
        audioFilters: {
            noise: { type: NoiseProfile.PINK, amplitude: 0.005, mixLevel: -30 },
        },
    },
    balanced: {
        name: 'Balanced',
        description: 'General music streaming. VMAF ≥ 92.',
        intensity: FxIntensity.MEDIUM,
        videoFilters: {
            crop: { percent: 2, randomize: true },
            colorJitter: { brightness: 0.01, contrast: 0.01, saturation: 0.02, gamma: 0.02, hue: 1 },
        },
        audioFilters: {
            noise: { type: NoiseProfile.BROWN, amplitude: 0.01, mixLevel: -25 },
            loudness: { target: -16, jitter: 0.5 },
        },
    },
    aggressive: {
        name: 'Aggressive',
        description: 'Maximum uniqueness. Visible changes.',
        intensity: FxIntensity.HIGH,
        videoFilters: {
            crop: { percent: 3, randomize: true },
            rotate: { degrees: 0.3, randomize: true },
            colorJitter: { brightness: 0.02, contrast: 0.02, saturation: 0.05, gamma: 0.05, hue: 2 },
            noise: { type: 'film', strength: 5, temporal: true },
            speed: { factor: 1.005, pitchCorrection: true },
        },
        audioFilters: {
            noise: { type: NoiseProfile.PINK, amplitude: 0.02, mixLevel: -20 },
            spectralSmear: { enabled: true, intensity: 0.3 },
            pitchShift: { semitones: 0.2 },
            tempoShift: { factor: 1.005 },
            loudness: { target: -16, jitter: 1 },
        },
    },
    cidAware: {
        name: 'CID Aware',
        description: 'Content ID divergence calibrated. Best for YouTube.',
        intensity: FxIntensity.MEDIUM,
        videoFilters: {
            crop: { percent: 2, randomize: false },
            colorJitter: { brightness: 0.015, contrast: 0.015, saturation: 0.03, gamma: 0.03, hue: 0 },
            frameJitter: { enabled: true, dropRate: 0.001, blendRate: 0.5 },
        },
        audioFilters: {
            spectralSmear: { enabled: true, intensity: 0.2 },
            compand: { attack: 5, release: 50, threshold: -20, ratio: 2 },
            loudness: { target: -14, jitter: 0.3 },
        },
    },
    cidAggressive: {
        name: 'CID Aggressive',
        description: 'Stronger shifts for strict detection.',
        intensity: FxIntensity.HIGH,
        videoFilters: {
            crop: { percent: 3, randomize: true },
            colorJitter: { brightness: 0.02, contrast: 0.02, saturation: 0.04, gamma: 0.04, hue: 0 },
            frameJitter: { enabled: true, dropRate: 0.002, blendRate: 0.5 },
            speed: { factor: 1.003, pitchCorrection: true },
        },
        audioFilters: {
            spectralSmear: { enabled: true, intensity: 0.3 },
            pitchShift: { semitones: 0.15 },
            tempoShift: { factor: 1.003 },
            compand: { attack: 3, release: 30, threshold: -18, ratio: 2.5 },
            loudness: { target: -14, jitter: 0.5 },
        },
    },
    musicStream: {
        name: 'Music Stream',
        description: 'Audio-focused, preserves video quality.',
        intensity: FxIntensity.MEDIUM,
        videoFilters: {},
        audioFilters: {
            noise: { type: NoiseProfile.BROWN, amplitude: 0.008, mixLevel: -28 },
            loudness: { target: -16, jitter: 0.3 },
            compand: { attack: 10, release: 100, threshold: -24, ratio: 1.5 },
        },
    },
    gaming: {
        name: 'Gaming',
        description: 'Minimal visual impact, audio noise only.',
        intensity: FxIntensity.LOW,
        videoFilters: {},
        audioFilters: {
            noise: { type: NoiseProfile.PINK, amplitude: 0.003, mixLevel: -35 },
        },
    },
};
// Built-in Visualizers
import { VisualizerType, BackgroundType } from '../enums.js';
export const BUILTIN_VISUALIZERS = {
    spectrumBars: {
        name: 'Spectrum Bars',
        type: VisualizerType.SPECTRUM_BARS,
        config: {
            bars: { count: 128, spacing: 2, width: 8, height: 800, colors: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'], mirror: true, peakHold: true, smoothing: 0.8 },
            fftSize: 4096,
            frequencyRange: [20, 20000],
            smoothingTimeConstant: 0.8,
        },
        backgroundType: BackgroundType.GRADIENT,
        backgroundConfig: { gradient: { direction: 'vertical', stops: [{ position: 0, color: '#0a0a0a' }, { position: 1, color: '#1a1a2e' }] } },
        width: 1920,
        height: 1080,
        fps: 30,
    },
    waveform: {
        name: 'Waveform',
        type: VisualizerType.WAVEFORM,
        config: {
            waveform: { style: 'mirror', thickness: 2, color: '#00ff00', glow: true },
            fftSize: 2048,
            frequencyRange: [20, 20000],
            smoothingTimeConstant: 0.3,
        },
        backgroundType: BackgroundType.COLOR,
        backgroundConfig: { color: '#000000' },
        width: 1920,
        height: 1080,
        fps: 30,
    },
    circular: {
        name: 'Circular Spectrum',
        type: VisualizerType.CIRCULAR,
        config: {
            circular: { radius: 400, bars: 180, rotationSpeed: 0.5, bassPulse: true },
            fftSize: 4096,
            frequencyRange: [20, 20000],
            smoothingTimeConstant: 0.6,
        },
        backgroundType: BackgroundType.GRADIENT,
        backgroundConfig: { gradient: { direction: 'radial', stops: [{ position: 0, color: '#1a1a2e' }, { position: 1, color: '#0f0f1a' }] } },
        width: 1920,
        height: 1080,
        fps: 30,
    },
    dualView: {
        name: 'Dual View (Spectrum + Waveform)',
        type: VisualizerType.CUSTOM,
        config: {
            customFilter: `
        [0:a]showspectrum=mode=separate:color=rainbow:scale=log:size=1920x720:rate=30[spec];
        [0:a]showwaves=mode=cline:colors=white:size=1920x360:rate=30[wave];
        [spec][wave]vstack[viz]
      `,
        },
        backgroundType: BackgroundType.GRADIENT,
        backgroundConfig: { gradient: { direction: 'vertical', stops: [{ position: 0, color: '#0a0a1a' }, { position: 0.5, color: '#1a1a3e' }, { position: 1, color: '#0a0a1a' }] } },
        width: 1920,
        height: 1080,
        fps: 30,
    },
    minimal: {
        name: 'Minimal Bars',
        type: VisualizerType.SPECTRUM_BARS,
        config: {
            bars: { count: 64, spacing: 4, width: 12, height: 600, colors: ['#00ff88'], mirror: false, peakHold: true, smoothing: 0.9 },
            fftSize: 2048,
            frequencyRange: [60, 16000],
            smoothingTimeConstant: 0.9,
        },
        backgroundType: BackgroundType.COLOR,
        backgroundConfig: { color: '#000000' },
        width: 1920,
        height: 1080,
        fps: 30,
    },
};
// Default Stream Settings
export const DEFAULT_STREAM_SETTINGS = {
    resolution: '1920x1080',
    fps: 30,
    videoBitrate: 4000,
    audioBitrate: 128,
    codec: 'libx264',
    preset: 'veryfast',
    loopMode: 'INFINITE',
    shuffleEnabled: false,
    crossfadeDuration: 3,
    audioSource: 'VIDEO',
    noiseAmplitude: 0.01,
    autoRestart: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 5,
    healthCheckInterval: 15,
};
// Default Schedule Settings
export const DEFAULT_SCHEDULE_SETTINGS = {
    timezone: 'UTC',
    isActive: true,
};
// YouTube Categories
export const YOUTUBE_CATEGORIES = {
    MUSIC: '10',
    GAMING: '20',
    ENTERTAINMENT: '24',
    EDUCATION: '27',
    SCIENCE_TECH: '28',
};
//# sourceMappingURL=index.js.map