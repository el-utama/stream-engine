import { ChildProcess } from 'child_process';
import { Stream, Visualizer, FxPreset } from '@stream-engine/shared/types';
export interface FFmpegProcess {
    id: string;
    streamId: string;
    proc: ChildProcess;
    startTime: Date;
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
        lastCheck: Date;
        lastError: string | null;
        reconnectCount: number;
    };
}
export interface StreamInput {
    videoFiles?: string[];
    playlistId?: string;
    rtmpPushKey?: string;
    sourceType: string;
    audioFiles?: string[];
}
export interface StreamOutput {
    rtmpUrl: string;
    streamKey: string;
}
export declare class FFmpegProcessor {
    private processes;
    private maxConcurrent;
    private ffmpegPath;
    private encoder;
    constructor(maxConcurrent?: number);
    private getEncoder;
    private clearEncoderCache;
    private getVideoEncoder;
    private getVideoEncoderArgs;
    start(streamId: string, input: StreamInput, output: StreamOutput, stream: Stream, fxPreset?: FxPreset, visualizer?: Visualizer): Promise<void>;
    private buildFilterGraph;
    private buildArgs;
    private createConcatFile;
    private setupProcessHandlers;
    private parseFFmpegOutput;
    stop(streamId: string): void;
    getStatus(streamId: string): FFmpegProcess | undefined;
    getActiveCount(): number;
    healthCheck(): Promise<void>;
}
//# sourceMappingURL=processor.d.ts.map