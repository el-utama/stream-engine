import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { config } from './config/index.js';
declare module 'fastify' {
    interface FastifyInstance {
        config: typeof config;
        prisma: PrismaClient;
        redis: any;
        queues: Map<string, any>;
        workers: Map<string, any>;
        io: any;
        nms: any;
        encryption: any;
        ffmpegProcessor: any;
        rtmpRelayService: any;
        healthMonitorService: any;
        streamService: any;
        youtubeService: any;
        getQueue: (name: string) => any;
        getWorker: (name: string, processor: any) => any;
    }
}
//# sourceMappingURL=index.d.ts.map