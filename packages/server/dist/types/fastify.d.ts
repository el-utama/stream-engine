import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import { NodeMediaServer } from 'node-media-server';
import { Config } from '../config';
declare module 'fastify' {
    interface FastifyInstance {
        config: Config;
        prisma: PrismaClient;
        redis: Redis;
        queues: Map<string, Queue>;
        workers: Map<string, Worker>;
        io: SocketIOServer;
        nms: NodeMediaServer;
        encryption: any;
        getQueue: (name: string) => Queue;
        getWorker: (name: string, processor: any) => Worker;
    }
}
//# sourceMappingURL=fastify.d.ts.map