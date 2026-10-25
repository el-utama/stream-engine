import { VideoFilterConfig, AudioFilterConfig, NoiseProfile } from '@stream-engine/shared/types';
export declare class FilterGraphBuilder {
    videoFilters: string[];
    audioFilters: string[];
    private inputIndex;
    crop(percent: number, randomize?: boolean): this;
    rotate(degrees: number, randomize?: boolean): this;
    flip(horizontal: boolean, vertical: boolean): this;
    colorJitter(brightness: number, contrast: number, saturation: number, gamma: number, hue: number): this;
    noise(type: 'grain' | 'digital' | 'film', strength: number, temporal: boolean): this;
    frameJitter(dropRate: number, blendRate: number): this;
    speed(factor: number, pitchCorrection: boolean): this;
    watermark(payload: string, strength?: number): this;
    noiseOverlay(type: NoiseProfile, amplitude: number, mixDb: number): this;
    loudnorm(target: number, jitter: number): this;
    pitchShift(semitones: number): this;
    tempo(factor: number): this;
    compand(attack: number, release: number, threshold: number, ratio: number): this;
    reverb(roomSize: number, damping: number, wetLevel: number): this;
    spectralSmear(intensity: number): this;
    build(): string;
    static buildPlaylistCrossfade(videoCount: number, crossfadeSec: number, durations: number[]): string;
    static buildMultiInputPlaylist(videoCount: number, crossfadeSec: number, durations: number[]): {
        filterGraph: string;
        inputArgs: string[];
    };
    applyVideoPreset(config: VideoFilterConfig): this;
    applyAudioPreset(config: AudioFilterConfig): this;
}
//# sourceMappingURL=filter-graph.builder.d.ts.map