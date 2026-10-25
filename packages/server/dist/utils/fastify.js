// Fastify Instance Utilities
export function getPrisma(app) {
    return app.prisma;
}
export function getRedis(app) {
    return app.redis;
}
export function getQueues(app) {
    return app.queues;
}
export function getWorkers(app) {
    return app.workers;
}
export function getIO(app) {
    return app.io;
}
export function getNMS(app) {
    return app.nms;
}
export function getEncryption(app) {
    return app.encryption;
}
export function getQueue(app, name) {
    return app.getQueue(name);
}
export function getWorker(app, name, processor) {
    return app.getWorker(name, processor);
}
//# sourceMappingURL=fastify.js.map