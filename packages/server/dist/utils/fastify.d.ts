import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
export interface ExtendedFastifyInstance extends FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    queues: Map<string, Queue>;
    workers: Map<string, Worker>;
    io: any;
    nms: any;
    encryption: any;
    getQueue: (name: string) => Queue;
    getWorker: (name: string, processor: any) => Worker;
}
export declare function getPrisma(app: FastifyInstance): PrismaClient;
export declare function getRedis(app: FastifyInstance): Redis;
export declare function getQueues(app: FastifyInstance): Map<string, Queue>;
export declare function getWorkers(app: FastifyInstance): Map<string, Worker>;
export declare function getIO(app: FastifyInstance): any;
export declare function getNMS(app: FastifyInstance): any;
export declare function getEncryption(app: FastifyInstance): any;
export declare function getQueue(app: FastifyInstance, name: string): Queue;
export declare function getWorker(app: FastifyInstance, name: string, processor: any): Worker;
//# sourceMappingURL=fastify.d.ts.map