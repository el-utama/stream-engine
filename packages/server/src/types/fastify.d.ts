// Fastify Type Declarations

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import { NodeMediaServer } from 'node-media-server';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: number;
      DATABASE_URL: string;
      REDIS_URL: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_REDIRECT_URI: string;
      MASTER_KEY: string;
      RTMP_PORT: number;
      HTTP_FLV_PORT: number;
      FFMPEG_HWACCEL: 'auto' | 'nvenc' | 'qsv' | 'videotoolbox' | 'amf' | 'none';
      FFMPEG_NVENC_PRESET: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7';
      MAX_CONCURRENT_STREAMS: number;
      LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
      LOG_DIR: string;
      PROMETHEUS_ENABLED: boolean;
      PROMETHEUS_PORT: number;
    };
    prisma: any; // PrismaClient
    redis: any; // Redis
    queues: Map<string, any>; // Queue
    workers: Map<string, any>; // Worker
    io: any; // SocketIOServer
    nms: any; // NodeMediaServer
    encryption: any;
    getQueue: (name: string) => any;
    getWorker: (name: string, processor: any) => any;
  }
}