import { BaseService } from './base.service.js';
import { Result } from '@stream-engine/shared/utils/result';
import { ChildProcess } from 'child_process';
export interface RelayConfig {
    streamId: string;
    sourceUrl: string;
    targets: RelayTarget[];
    streamKey: string;
}
export interface RelayTarget {
    platform: 'youtube' | 'twitch' | 'facebook' | 'custom';
    rtmpUrl: string;
    streamKey: string;
}
export interface RelayProcess {
    streamId: string;
    process: ChildProcess;
    startTime: Date;
    targets: RelayTarget[];
    status: 'starting' | 'running' | 'error' | 'stopped';
    lastCheck: Date;
    lastError: string | null;
    reconnectAttempts: number;
}
export declare class RtmpRelayService extends BaseService {
    private relays;
    private maxConcurrent;
    constructor(app: any);
    startRelay(config: RelayConfig): Promise<Result<void, {
        code: string;
        message: string;
    }>>;
    private handleRelayError;
    stopRelay(streamId: string): Promise<void>;
    getRelayStatus(streamId: string): {
        streamId: string;
        status: "error" | "starting" | "running" | "stopped";
        startTime: Date;
        targets: RelayTarget[];
        lastError: string | null;
        reconnectAttempts: number;
    } | null;
    private emitRelayStatus;
    healthCheck(): Promise<void>;
}
//# sourceMappingURL=rtmp-relay.service.d.ts.map