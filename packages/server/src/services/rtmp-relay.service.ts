// RTMP Relay Service - Multi-platform streaming via FFmpeg tee muxer

import { BaseService } from './base.service.js';
import { ok, err, Result } from '@stream-engine/shared/utils/result';
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

export class RtmpRelayService extends BaseService {
  private relays: Map<string, RelayProcess> = new Map();
  private maxConcurrent: number;

  constructor(app: any) {
    super(app);
    this.maxConcurrent = app.config.MAX_CONCURRENT_STREAMS || 3;
  }

  async startRelay(config: RelayConfig): Promise<Result<void, { code: string; message: string }>> {
    if (this.relays.size >= this.maxConcurrent) {
      return err({ code: 'MAX_RELAYS_REACHED', message: `Max concurrent relays (${this.maxConcurrent}) reached` });
    }

    if (this.relays.has(config.streamId)) {
      return err({ code: 'RELAY_EXISTS', message: 'Relay already exists for this stream' });
    }

    try {
      const ffmpeg = require('fluent-ffmpeg');
      const ffmpegStatic = require('ffmpeg-static');

      const proc = ffmpeg()
        .input(config.sourceUrl)
        .inputOptions([
          '-re',
          '-reconnect_at_eof', '1',
          '-reconnect_streamed', '1',
          '-reconnect_on_network_error', '1',
          '-reconnect_on_http_error', '1',
          '-reconnect_delay_max', '5',
          '-timeout', '10000000'
        ])
        .outputOptions([
          '-c:v', 'copy',
          '-c:a', 'copy',
          '-f', 'tee',
          '-map', '0:v',
          '-map', '0:a',
          config.targets.map(t => `[f=flv:onfail=ignore]${t.rtmpUrl}/${t.streamKey}`).join('|')
        ])
        .on('start', (cmd: string) => {
          this.logger.info('Relay started', { streamId: config.streamId, cmd });
        })
        .on('stderr', (stderr: string) => {
          const relay = this.relays.get(config.streamId);
          if (relay) {
            relay.lastCheck = new Date();
          }
        })
        .on('error', (error: Error) => {
          this.logger.error('Relay error', { streamId: config.streamId, err: error });
          const relay = this.relays.get(config.streamId);
          if (relay) {
            relay.status = 'error';
            relay.lastError = error.message;
            this.handleRelayError(config.streamId, error);
          }
        })
        .on('end', () => {
          this.logger.info('Relay ended', { streamId: config.streamId });
          this.relays.delete(config.streamId);
        });

      const relayProcess: RelayProcess = {
        streamId: config.streamId,
        process: proc.ffmpegProc,
        startTime: new Date(),
        targets: config.targets,
        status: 'starting',
        lastCheck: new Date(),
        lastError: null,
        reconnectAttempts: 0
      };

      this.relays.set(config.streamId, relayProcess);

      await new Promise(resolve => setTimeout(resolve, 1000));

      return ok(undefined);
    } catch (error) {
      return err({ code: 'START_FAILED', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleRelayError(streamId: string, error: Error): Promise<void> {
    const relay = this.relays.get(streamId);
    if (!relay) return;

    if (relay.reconnectAttempts >= 10) {
      this.logger.error('Max reconnect attempts reached', { streamId, attempts: relay.reconnectAttempts });
      relay.status = 'error';
      this.emitRelayStatus(streamId);
      return;
    }

    relay.reconnectAttempts++;
    this.logger.warn('Attempting relay reconnect', { streamId, attempt: relay.reconnectAttempts });

    const delay = Math.min(5000 * Math.pow(2, relay.reconnectAttempts - 1), 300000);

    setTimeout(async () => {
      try {
        const targets = relay.targets;
        const stream = await this.prisma.stream.findUnique({ where: { id: streamId } });
        if (stream && stream.status === 'LIVE') {
          const config = {
            streamId,
            sourceUrl: `rtmp://localhost:1935/live/${stream.rtmpPushKey || streamId}`,
            targets,
            streamKey: streamId
          };
          await this.startRelay(config);
        }
      } catch (e) {
        this.logger.error('Reconnect failed', { streamId, err: e });
      }
    }, delay);
  }

  async stopRelay(streamId: string): Promise<void> {
    const relay = this.relays.get(streamId);
    if (!relay) return;

    relay.status = 'stopped';
    relay.process?.kill('SIGTERM');

    setTimeout(() => {
      if (!relay.process?.killed) {
        relay.process?.kill('SIGKILL');
      }
    }, 5000);

    this.relays.delete(streamId);
    this.emitRelayStatus(streamId);
  }

  getRelayStatus(streamId: string) {
    const relay = this.relays.get(streamId);
    if (!relay) return null;

    return {
      streamId: relay.streamId,
      status: relay.status,
      startTime: relay.startTime,
      targets: relay.targets,
      lastError: relay.lastError,
      reconnectAttempts: relay.reconnectAttempts
    };
  }

  private emitRelayStatus(streamId: string) {
    const status = this.getRelayStatus(streamId);
    if (status) {
      this.io.to(`stream:${streamId}`).emit('relay:status', status);
    }
  }

  async healthCheck(): Promise<void> {
    for (const [streamId, relay] of this.relays) {
      const timeSinceCheck = Date.now() - relay.lastCheck.getTime();
      if (timeSinceCheck > 30000 && relay.status !== 'running') {
        this.logger.warn('Relay health check failed', { streamId });
        await this.handleRelayError(streamId, new Error('Health check timeout'));
      }
    }
  }
}