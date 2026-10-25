// Health Monitoring Service - Anti-ghosting auto-reconnect and stream health
import { BaseService } from './base.service.js';
export class HealthMonitorService extends BaseService {
    healthCheckInterval = null;
    CHECK_INTERVAL = 15000;
    HEALTH_TIMEOUT = 30000;
    MIN_SPEED = 0.5;
    MAX_DROPPED_FRAMES_RATIO = 0.05;
    constructor(app) {
        super(app);
    }
    start() {
        if (this.healthCheckInterval)
            return;
        this.healthCheckInterval = setInterval(async () => {
            await this.checkAllStreams();
        }, this.CHECK_INTERVAL);
        this.logger.info('Health monitor started');
    }
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            this.logger.info('Health monitor stopped');
        }
    }
    async checkAllStreams() {
        try {
            const liveStreams = await this.prisma.stream.findMany({
                where: { status: 'LIVE' },
                include: { account: true }
            });
            for (const stream of liveStreams) {
                await this.checkStreamHealth(stream);
            }
        }
        catch (error) {
            this.logger.error('Health check failed', { err: error });
        }
    }
    async checkStreamHealth(stream) {
        const ffmpegStatus = this.app.ffmpegProcessor?.getStatus(stream.id);
        const relayStatus = this.app.rtmpRelayService?.getRelayStatus(stream.id);
        const stats = ffmpegStatus?.stats || {
            bitrate: 0, fps: 0, droppedFrames: 0, totalFrames: 0, speed: 0, audioLevel: 0
        };
        const ffmpegHealth = ffmpegStatus?.health || {
            isHealthy: true, lastCheck: new Date(), reconnectCount: 0, lastError: null
        };
        const relayHealth = relayStatus ? {
            status: relayStatus.status,
            reconnectAttempts: relayStatus.reconnectAttempts,
            lastError: relayStatus.lastError
        } : null;
        const isHealthy = this.evaluateHealth(stats, ffmpegHealth, relayHealth);
        const health = {
            streamId: stream.id,
            isHealthy,
            lastCheck: new Date(),
            bitrate: stats.bitrate,
            fps: stats.fps,
            droppedFrames: stats.droppedFrames,
            speed: stats.speed,
            reconnectAttempts: stream.reconnectAttempts,
            lastError: ffmpegHealth.lastError || relayHealth?.lastError || null,
            uptime: stream.startedAt ? Math.floor((Date.now() - stream.startedAt.getTime()) / 1000) : 0
        };
        await this.updateStreamHealth(stream.id, health);
        this.io.to(`stream:${stream.id}`).emit('stream:health', health);
        if (!isHealthy) {
            await this.handleUnhealthyStream(stream, health);
        }
        return health;
    }
    evaluateHealth(stats, ffmpegHealth, relayHealth) {
        if (!ffmpegHealth.isHealthy)
            return false;
        if (stats.speed !== undefined && stats.speed < this.MIN_SPEED)
            return false;
        if (stats.totalFrames > 100 && stats.droppedFrames > 0) {
            const dropRatio = stats.droppedFrames / stats.totalFrames;
            if (dropRatio > this.MAX_DROPPED_FRAMES_RATIO)
                return false;
        }
        if (relayHealth && relayHealth.status === 'error')
            return false;
        if (stats.bitrate !== undefined && stats.bitrate === 0)
            return false;
        return true;
    }
    async updateStreamHealth(streamId, health) {
        try {
            await this.prisma.stream.update({
                where: { id: streamId },
                data: { reconnectAttempts: health.reconnectAttempts }
            });
        }
        catch (error) {
            this.logger.warn('Failed to update stream health', { streamId, err: error });
        }
    }
    async handleUnhealthyStream(stream, health) {
        this.logger.warn('Stream unhealthy, considering restart', {
            streamId: stream.id,
            health,
            reconnectAttempts: stream.reconnectAttempts
        });
        if (stream.reconnectAttempts >= (stream.maxReconnectAttempts || 10)) {
            this.logger.error('Max reconnect attempts reached, marking as ERROR', { streamId: stream.id });
            await this.prisma.stream.update({
                where: { id: stream.id },
                data: { status: 'ERROR', stoppedAt: new Date() }
            });
            this.emitStatusChange(stream.id, 'ERROR');
            return;
        }
        const newAttempts = stream.reconnectAttempts + 1;
        await this.prisma.stream.update({
            where: { id: stream.id },
            data: { reconnectAttempts: newAttempts, status: 'RECONNECTING' }
        });
        this.emitStatusChange(stream.id, 'RECONNECTING');
        const delay = Math.min((stream.reconnectDelay || 5000) * Math.pow(2, stream.reconnectAttempts), 300000);
        this.logger.info('Scheduling reconnect', { streamId: stream.id, delay, attempt: newAttempts });
        setTimeout(async () => {
            try {
                const streamService = this.app.streamService;
                if (streamService) {
                    await streamService.restart(stream.id);
                }
            }
            catch (error) {
                this.logger.error('Reconnect failed', { streamId: stream.id, err: error });
            }
        }, delay);
    }
    emitStatusChange(streamId, status) {
        this.io.to(`stream:${streamId}`).emit('stream:status', { streamId, status });
    }
    async checkNetworkConnectivity(targetUrl) {
        const start = Date.now();
        try {
            const response = await fetch(targetUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
            return { reachable: response.ok, latency: Date.now() - start };
        }
        catch {
            return { reachable: false, latency: Date.now() - start };
        }
    }
    getStreamHealth(streamId) {
        return null;
    }
}
//# sourceMappingURL=health-monitor.service.js.map