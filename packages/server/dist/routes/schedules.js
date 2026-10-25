// Schedule Routes
import { ScheduleService } from '../services/schedule.service.js';
const scheduleRoutes = async (app) => {
    const scheduleService = new ScheduleService(app);
    const log = app.log;
    app.get('/', {
        schema: { querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    isActive: { type: 'boolean' }
                },
                additionalProperties: false
            } },
    }, async (request, reply) => {
        return scheduleService.list(request.query);
    });
    app.post('/', {
        schema: { body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    cronExpression: { type: 'string' },
                    timezone: { type: 'string', default: 'UTC' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    maxDuration: { type: 'integer', minimum: 1, maximum: 168 },
                    streamIds: { type: 'array', items: { type: 'string', pattern: '^[a-z0-9]{25}$' }, minItems: 1 }
                },
                required: ['name', 'cronExpression', 'streamIds'],
                additionalProperties: false
            } },
    }, async (request, reply) => {
        const schedule = await scheduleService.create('default-user', request.body);
        return reply.code(201).send({ id: schedule.id });
    });
    app.get('/:id', {
        schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false } },
    }, async (request, reply) => {
        const schedule = await scheduleService.getById(request.params.id);
        if (!schedule)
            return reply.code(404).send({ error: 'Schedule not found' });
        return schedule;
    });
    app.patch('/:id', {
        schema: {
            params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    cronExpression: { type: 'string' },
                    timezone: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    maxDuration: { type: 'integer', minimum: 1, maximum: 168 },
                    isActive: { type: 'boolean' },
                    streamIds: { type: 'array', items: { type: 'string', pattern: '^[a-z0-9]{25}$' } }
                },
                additionalProperties: false
            },
        },
    }, async (request, reply) => {
        await scheduleService.update(request.params.id, request.body);
        return { success: true };
    });
    app.delete('/:id', {
        schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false } },
    }, async (request, reply) => {
        await scheduleService.delete(request.params.id);
        return { success: true };
    });
    app.post('/:id/toggle', {
        schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false } },
    }, async (request, reply) => {
        const schedule = await scheduleService.toggle(request.params.id);
        return { success: true, isActive: schedule.isActive };
    });
};
export default scheduleRoutes;
//# sourceMappingURL=schedules.js.map