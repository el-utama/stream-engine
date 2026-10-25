// Visualizer Routes
import { VisualizerService } from '../services/visualizer.service.js';
const visualizerRoutes = async (app) => {
    const visualizerService = new VisualizerService(app);
    const log = app.log;
    app.get('/', {
        schema: { querystring: {
                type: 'object',
                properties: {
                    includeBuiltIn: { type: 'boolean', default: true }
                },
                additionalProperties: false
            } },
    }, async (request, reply) => {
        return visualizerService.list(request.query.includeBuiltIn);
    });
    app.post('/', {
        schema: { body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 50 },
                    type: { type: 'string', enum: ['SPECTRUM_BARS', 'WAVEFORM', 'CIRCULAR', 'PARTICLES', 'CUSTOM'] },
                    config: { type: 'object' },
                    backgroundType: { type: 'string', enum: ['COLOR', 'GRADIENT', 'IMAGE', 'VIDEO'] },
                    backgroundConfig: { type: 'object' },
                    width: { type: 'integer', minimum: 640, maximum: 3840, default: 1920 },
                    height: { type: 'integer', minimum: 360, maximum: 2160, default: 1080 },
                    fps: { type: 'integer', minimum: 15, maximum: 60, default: 30 }
                },
                required: ['name', 'type', 'config', 'backgroundType', 'backgroundConfig'],
                additionalProperties: false
            } },
    }, async (request, reply) => {
        const visualizer = await visualizerService.create('default-user', request.body);
        return reply.code(201).send({ id: visualizer.id });
    });
    app.get('/:id', {
        schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false } },
    }, async (request, reply) => {
        const visualizer = await visualizerService.getById(request.params.id);
        if (!visualizer)
            return reply.code(404).send({ error: 'Visualizer not found' });
        return visualizer;
    });
    app.patch('/:id', {
        schema: {
            params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 50 },
                    type: { type: 'string', enum: ['SPECTRUM_BARS', 'WAVEFORM', 'CIRCULAR', 'PARTICLES', 'CUSTOM'] },
                    config: { type: 'object' },
                    backgroundType: { type: 'string', enum: ['COLOR', 'GRADIENT', 'IMAGE', 'VIDEO'] },
                    backgroundConfig: { type: 'object' },
                    width: { type: 'integer', minimum: 640, maximum: 3840 },
                    height: { type: 'integer', minimum: 360, maximum: 2160 },
                    fps: { type: 'integer', minimum: 15, maximum: 60 }
                },
                additionalProperties: false
            },
        },
    }, async (request, reply) => {
        await visualizerService.update(request.params.id, request.body);
        return { success: true };
    });
    app.delete('/:id', {
        schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false } },
    }, async (request, reply) => {
        await visualizerService.delete(request.params.id);
        return { success: true };
    });
    app.get('/:id/preview', {
        schema: {
            params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false },
            querystring: {
                type: 'object',
                properties: {
                    duration: { type: 'integer', minimum: 5, maximum: 60, default: 10 }
                },
                additionalProperties: false
            }
        },
    }, async (request, reply) => {
        const url = await visualizerService.generatePreview(request.params.id, request.query.duration);
        return { url };
    });
};
export default visualizerRoutes;
//# sourceMappingURL=visualizers.js.map