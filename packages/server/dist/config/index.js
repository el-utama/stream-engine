// Server Configuration - Zod Validated
import { z } from 'zod';
const envSchema = z.object({
    // Required
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.string().url(),
    MASTER_KEY: z.string().length(44), // base64 32 bytes
    // Optional - Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    // Optional - Database
    DATABASE_URL: z.string().default('file:./data/db.sqlite'),
    // Optional - Redis
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    // Optional - RTMP
    RTMP_PORT: z.coerce.number().default(1935),
    HTTP_FLV_PORT: z.coerce.number().default(8000),
    // Optional - FFmpeg
    FFMPEG_HWACCEL: z.enum(['auto', 'nvenc', 'qsv', 'videotoolbox', 'amf', 'none']).default('auto'),
    FFMPEG_NVENC_PRESET: z.enum(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']).default('p4'),
    MAX_CONCURRENT_STREAMS: z.coerce.number().default(3),
    // Optional - Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    LOG_DIR: z.string().default('./logs'),
    // Optional - Monitoring
    PROMETHEUS_ENABLED: z.coerce.boolean().default(false),
    PROMETHEUS_PORT: z.coerce.number().default(9090),
});
export const config = envSchema.parse(process.env);
//# sourceMappingURL=index.js.map