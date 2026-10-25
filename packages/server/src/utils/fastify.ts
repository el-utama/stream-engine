// Fastify Instance Utilities

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

export function getPrisma(app: FastifyInstance): PrismaClient {
  return (app as any).prisma;
}

export function getRedis(app: FastifyInstance): Redis {
  return (app as any).redis;
}

export function getQueues(app: FastifyInstance): Map<string, Queue> {
  return (app as any).queues;
}

export function getWorkers(app: FastifyInstance): Map<string, Worker> {
  return (app as any).workers;
}

export function getIO(app: FastifyInstance): any {
  return (app as any).io;
}

export function getNMS(app: FastifyInstance): any {
  return (app as any).nms;
}

export function getEncryption(app: FastifyInstance): any {
  return (app as any).encryption;
}

export function getQueue(app: FastifyInstance, name: string): Queue {
  return (app as any).getQueue(name);
}

export function getWorker(app: FastifyInstance, name: string, processor: any): Worker {
  return (app as any).getWorker(name, processor);
}