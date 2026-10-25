// Health Check Routes
import { getRedis } from '../utils/fastify.js';
const healthRoutes = async (app) => {
    app.get('/health', async (request, reply) => {
        const redis = getRedis(app);
        const checks = await Promise.allSettled([
            redis.ping(),
        ]);
        const healthy = checks.every(c => c.status === 'fulfilled');
        return {
            status: healthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            checks: {
                redis: checks[0].status,
            },
        };
    });
    // Test Prisma connection
    app.get('/health/prisma', async (request, reply) => {
        try {
            const result = await app.prisma.$queryRaw `SELECT 1 as test`;
            return { status: 'ok', result };
        }
        catch (error) {
            return reply.code(500).send({ error: error instanceof Error ? error.message : String(error) });
        }
    });
    // Test fxPreset query
    app.get('/health/fx-presets', async (request, reply) => {
        try {
            const result = await app.prisma.fxPreset.findMany();
            return { status: 'ok', count: result.length };
        }
        catch (error) {
            return reply.code(500).send({ error: error instanceof Error ? error.message : String(error) });
        }
    });
};
export default healthRoutes;
//# sourceMappingURL=health.js.map