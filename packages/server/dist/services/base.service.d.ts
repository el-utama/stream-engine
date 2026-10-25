import { FastifyInstance } from 'fastify';
export declare abstract class BaseService {
    protected app: FastifyInstance;
    constructor(app: FastifyInstance);
    protected get prisma(): import("@prisma/client").PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
    protected get io(): any;
    protected get redis(): any;
    protected get queues(): Map<string, any>;
    protected get logger(): any;
    protected get config(): {
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        GOOGLE_REDIRECT_URI: string;
        MASTER_KEY: string;
        NODE_ENV: "development" | "production" | "test";
        PORT: number;
        DATABASE_URL: string;
        REDIS_URL: string;
        RTMP_PORT: number;
        HTTP_FLV_PORT: number;
        FFMPEG_HWACCEL: "auto" | "nvenc" | "qsv" | "videotoolbox" | "amf" | "none";
        FFMPEG_NVENC_PRESET: "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";
        MAX_CONCURRENT_STREAMS: number;
        LOG_LEVEL: "debug" | "info" | "warn" | "error";
        LOG_DIR: string;
        PROMETHEUS_ENABLED: boolean;
        PROMETHEUS_PORT: number;
    };
    protected get encryption(): any;
}
//# sourceMappingURL=base.service.d.ts.map