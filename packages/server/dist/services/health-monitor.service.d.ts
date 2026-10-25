import { BaseService } from './base.service.js';
export interface StreamHealth {
    streamId: string;
    isHealthy: boolean;
    lastCheck: Date;
    bitrate: number;
    fps: number;
    droppedFrames: number;
    speed: number;
    reconnectAttempts: number;
    lastError: string | null;
    uptime: number;
}
export declare class HealthMonitorService extends BaseService {
    private healthCheckInterval;
    private readonly CHECK_INTERVAL;
    private readonly HEALTH_TIMEOUT;
    private readonly MIN_SPEED;
    private readonly MAX_DROPPED_FRAMES_RATIO;
    constructor(app: any);
    start(): void;
    stop(): void;
    checkAllStreams(): Promise<void>;
    checkStreamHealth(stream: any): Promise<any>;
    private evaluateHealth;
    private updateStreamHealth;
    private handleUnhealthyStream;
    private emitStatusChange;
    checkNetworkConnectivity(targetUrl: string): Promise<{
        reachable: boolean;
        latency: number;
    }>;
    getStreamHealth(streamId: string): any | null;
}
//# sourceMappingURL=health-monitor.service.d.ts.map