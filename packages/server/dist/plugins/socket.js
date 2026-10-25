// Socket.io Plugin for Fastify
import fp from 'fastify-plugin';
import { Server as SocketIOServer } from 'socket.io';
const socketPlugin = async (app) => {
    const io = new SocketIOServer(app.server, {
        cors: {
            origin: app.config.NODE_ENV === 'production' ? false : '*',
            methods: ['GET', 'POST'],
        },
    });
    // Auth middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Authentication required'));
        // TODO: Validate JWT token
        // socket.data.user = validatedUser;
        next();
    });
    io.on('connection', (socket) => {
        app.log.info({ socketId: socket.id }, 'Client connected');
        socket.on('stream:join', (streamId) => {
            socket.join(`stream:${streamId}`);
            app.log.debug({ streamId, socketId: socket.id }, 'Joined stream room');
        });
        socket.on('stream:leave', (streamId) => {
            socket.leave(`stream:${streamId}`);
        });
        socket.on('disconnect', (reason) => {
            app.log.info({ socketId: socket.id, reason }, 'Client disconnected');
        });
    });
    app.decorate('io', io);
    app.addHook('onClose', async (instance) => {
        await instance.io.close();
    });
};
export default fp(socketPlugin);
//# sourceMappingURL=socket.js.map