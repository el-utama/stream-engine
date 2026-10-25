// FX Preset Routes
import { FxPresetService } from '../services/fx-preset.service.js';
const fxPresetRoutes = async (app) => {
    const fxService = new FxPresetService(app);
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
        log.info('GET /api/fx-presets request received');
        try {
            const result = await fxService.list(request.query.includeBuiltIn);
            return result;
        }
        catch (error) {
            log.error('Error in GET /api/fx-presets', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    });
    app.post('/', {
        schema: { body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 50 },
                    description: { type: 'string', maxLength: 200 },
                    videoFilters: { type: 'object' },
                    audioFilters: { type: 'object' },
                    intensity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'AGGRESSIVE'], default: 'MEDIUM' }
                },
                required: ['name', 'videoFilters', 'audioFilters'],
                additionalProperties: false
            } },
    }, async (request, reply) => {
        log.info('POST /api/fx-presets request received', { body: request.body });
        const preset = await fxService.create('default-user', request.body);
        return reply.code(201).send({ id: preset.id });
    });
    app.get('/:id', {
        schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false } },
    }, async (request, reply) => {
        const preset = await fxService.getById(request.params.id);
        if (!preset)
            return reply.code(404).send({ error: 'Preset not found' });
        return preset;
    });
    app.patch('/:id', {
        schema: {
            params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 50 },
                    description: { type: 'string', maxLength: 200 },
                    videoFilters: { type: 'object' },
                    audioFilters: { type: 'object' },
                    intensity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'AGGRESSIVE'] }
                },
                additionalProperties: false
            },
        },
    }, async (request, reply) => {
        await fxService.update(request.params.id, request.body);
        return { success: true };
    });
    app.delete('/:id', {
        schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false } },
    }, async (request, reply) => {
        await fxService.delete(request.params.id);
        return { success: true };
    });
    app.post('/:id/test', {
        schema: {
            params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false },
            body: {
                type: 'object',
                properties: {
                    sampleFile: { type: 'string' }
                },
                additionalProperties: false
            },
        },
    }, async (request, reply) => {
        const result = await fxService.testPreset(request.params.id, request.body.sampleFile);
        return result;
    });
};
export default fxPresetRoutes;
//# sourceMappingURL=fx-presets.js.map