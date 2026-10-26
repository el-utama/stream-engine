// Main Entry Point

import 'dotenv/config';
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/index.js';
import { initEncryption, getEncryption } from './utils/encryption.js';
import { FFmpegProcessor } from '@stream-engine/ffmpeg-worker';

// Type augmentation for Fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    config: typeof config;
    prisma: PrismaClient;
    redis: any;
    queues: Map<string, any>;
    workers: Map<string, any>;
    io: any; // SocketIOServer
    nms: any; // NodeMediaServer
    encryption: any;
    ffmpegProcessor: any; // FFmpegProcessor
    rtmpRelayService: any; // RtmpRelayService
    healthMonitorService: any; // HealthMonitorService
    streamService: any; // StreamService
    getQueue: (name: string) => any;
    getWorker: (name: string, processor: any) => any;
  }
}

// Plugins
import prismaPlugin from './plugins/prisma.js';
import socketPlugin from './plugins/socket.js';
import nmsPlugin from './plugins/nms.js';

// Routes
import authRoutes from './routes/auth.js';
import streamRoutes from './routes/streams.js';
import scheduleRoutes from './routes/schedules.js';
import fxPresetRoutes from './routes/fx-presets.js';
import visualizerRoutes from './routes/visualizers.js';
import healthRoutes from './routes/health.js';

// Services - import classes only
import { StreamService } from './services/stream.service.js';
import { RtmpRelayService } from './services/rtmp-relay.service.js';
import { HealthMonitorService } from './services/health-monitor.service.js';
import { initSchedulerWorker, scheduleRecurringJobs, shutdownScheduler } from './workers/scheduler.worker.js';

async function main() {
  // Initialize encryption
  initEncryption();

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
      } : undefined,
    },
  });

  // Decorate config and encryption
  app.decorate('config', config);
  app.decorate('encryption', getEncryption());

  // Initialize Redis directly (bypass plugin encapsulation)
  const Redis = (await import('ioredis')).default;
  const BullMQ = await import('bullmq');
  const Queue = BullMQ.Queue;
  const Worker = BullMQ.Worker;

  const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    lazyConnect: true,
  });

  redis.on('error', (err: Error) => app.log.error({ err }, 'Redis error'));
  redis.on('connect', () => app.log.info('Redis connected'));

  await redis.connect();

  const queues = new Map<string, InstanceType<typeof Queue>>();
  const workers = new Map<string, InstanceType<typeof Worker>>();

  app.decorate('redis', redis);
  app.log.info('Decorated app with redis');
  app.decorate('queues', new Map<string, any>());
  app.decorate('workers', new Map<string, any>());

  // Helper to get/create queue
  app.decorate('getQueue', (name: string) => {
    const queues = (app as any).queues;
    if (!queues.has(name)) {
      const { Queue } = require('bullmq');
      queues.set(name, new Queue(name, { connection: redis }));
    }
    return queues.get(name)!;
  });

  // Helper to get/create worker
  app.decorate('getWorker', (name: string, processor: any) => {
    const workers = (app as any).workers;
    if (!workers.has(name)) {
      const { Worker } = require('bullmq');
      workers.set(name, new Worker(name, processor, { connection: redis }));
    }
    return workers.get(name)!;
  });

  app.addHook('onClose', async (instance) => {
    // Shutdown scheduler worker
    await shutdownScheduler();
    
    await instance.redis.quit();
    for (const queue of instance.queues.values()) {
      await queue.close();
    }
    for (const worker of instance.workers.values()) {
      await worker.close();
    }
  });

  // Register plugins
  await app.register(prismaPlugin);
  await app.register(socketPlugin);
  await app.register(nmsPlugin);

  // Initialize Services
  const streamService = new StreamService(app);
  app.decorate('streamService', streamService);

  const rtmpRelayService = new RtmpRelayService(app);
  app.decorate('rtmpRelayService', rtmpRelayService);

  const healthMonitorService = new HealthMonitorService(app);
  app.decorate('healthMonitorService', healthMonitorService);

  // Initialize FFmpeg Processor
  const ffmpegProcessor = new FFmpegProcessor(config.MAX_CONCURRENT_STREAMS);
  app.decorate('ffmpegProcessor', ffmpegProcessor);

  // Health check intervals
  setInterval(() => ffmpegProcessor.healthCheck(), 15000);
  setInterval(() => healthMonitorService.checkAllStreams(), 15000);

  // Start health monitor
  healthMonitorService.start();

  // Initialize Scheduler Worker
  const schedulerWorker = initSchedulerWorker(app.prisma, streamService);
  app.decorate('schedulerWorker', schedulerWorker);

  // Schedule recurring jobs for active schedules
  await scheduleRecurringJobs(app.prisma);

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(streamRoutes, { prefix: '/api/streams' });
  await app.register(scheduleRoutes, { prefix: '/api/schedules' });
  await app.register(fxPresetRoutes, { prefix: '/api/fx-presets' });
  await app.register(visualizerRoutes, { prefix: '/api/visualizers' });
  await app.register(healthRoutes, { prefix: '/api' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error({ err: error, url: request.url }, 'Request error');
    const statusCode = error.statusCode || 500;
    reply.code(statusCode).send({
      error: error.name || 'InternalServerError',
      message: error.message,
      ...(config.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });

  // Start server
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();