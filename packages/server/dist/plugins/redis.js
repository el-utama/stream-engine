// Redis + BullMQ Plugin for Fastify
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
const redisPlugin = async (app) => {
    const redis = new Redis(app.config.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 100, 3000),
        lazyConnect: true,
    });
    redis.on('error', (err) => app.log.error({ err }, 'Redis error'));
    redis.on('connect', () => app.log.info('Redis connected'));
    await redis.connect();
    const queues = new Map();
    const workers = new Map();
    app.decorate('redis', redis);
    app.log.info('Decorated app with redis');
    app.decorate('queues', queues);
    app.decorate('workers', workers);
    // Helper to get/create queue
    app.decorate('getQueue', (name) => {
        if (!queues.has(name)) {
            queues.set(name, new Queue(name, { connection: redis }));
        }
        return queues.get(name);
    });
    // Helper to get/create worker
    app.decorate('getWorker', (name, processor) => {
        if (!workers.has(name)) {
            workers.set(name, new Worker(name, processor, { connection: redis }));
        }
        return workers.get(name);
    });
    app.addHook('onClose', async (instance) => {
        await instance.redis.quit();
        for (const queue of instance.queues.values()) {
            await queue.close();
        }
        for (const worker of instance.workers.values()) {
            await worker.close();
        }
    });
};
export default redisPlugin;
//# sourceMappingURL=redis.js.map