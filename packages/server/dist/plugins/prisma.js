// Prisma Plugin for Fastify
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
const prismaPlugin = async (app) => {
    // SQLite connection pool configuration
    // SQLite with Prisma uses a connection pool. Default is 1 connection.
    // Increase pool size and add timeout to prevent hanging
    const prisma = new PrismaClient({
        log: app.config.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        datasources: {
            db: {
                url: app.config.DATABASE_URL,
            },
        },
    });
    // Add connection event listeners for debugging
    prisma.$on('query', (e) => {
        app.log.debug({ query: e.query, duration: e.duration }, 'Prisma query');
    });
    prisma.$on('error', (e) => {
        app.log.error({ err: e }, 'Prisma error');
    });
    await prisma.$connect();
    app.decorate('prisma', prisma);
    app.addHook('onClose', async (instance) => {
        await instance.prisma.$disconnect();
    });
};
export default fp(prismaPlugin);
//# sourceMappingURL=prisma.js.map