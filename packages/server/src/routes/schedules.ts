// Schedule Routes

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ScheduleService } from '../services/schedule.service.js';
import { removeScheduleJobs, getScheduledJobsStatus, scheduleRecurringJobs } from '../workers/scheduler.worker.js';

interface ScheduleQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

interface ScheduleIdParams {
  id: string;
}

interface ScheduleRunBody {
  streamId: string;
}

interface CreateScheduleBody {
  name: string;
  cronExpression: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  maxDuration?: number;
  streamIds: string[];
}

interface UpdateScheduleBody {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  maxDuration?: number;
  isActive?: boolean;
  streamIds?: string[];
}

const scheduleRoutes: FastifyPluginAsync = async (app) => {
  const scheduleService = new ScheduleService(app);
  const log = app.log as any;

  app.get('/', {
    schema: { querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        isActive: { type: 'boolean' }
      },
      additionalProperties: false
    }},
  }, async (request: FastifyRequest<{ Querystring: ScheduleQuery }>, reply) => {
    return scheduleService.list(request.query as any);
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
    }},
  }, async (request: FastifyRequest<{ Body: CreateScheduleBody }>, reply) => {
    const schedule = await scheduleService.create('default-user', request.body);
    
    // Add recurring jobs for the new schedule
    await scheduleRecurringJobs(app.prisma);
    
    return reply.code(201).send({ id: schedule.id });
  });

  app.get('/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: ScheduleIdParams }>, reply) => {
    const schedule = await scheduleService.getById(request.params.id);
    if (!schedule) return reply.code(404).send({ error: 'Schedule not found' });
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
  }, async (request: FastifyRequest<{ Params: ScheduleIdParams; Body: UpdateScheduleBody }>, reply) => {
    await scheduleService.update(request.params.id, request.body);
    
    // Reschedule jobs after update
    await removeScheduleJobs(request.params.id);
    await scheduleRecurringJobs(app.prisma);
    
    return { success: true };
  });

  app.delete('/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: ScheduleIdParams }>, reply) => {
    // Remove recurring jobs before deleting
    await removeScheduleJobs(request.params.id);
    
    await scheduleService.delete(request.params.id);
    return { success: true };
  });

  app.post('/:id/toggle', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: ScheduleIdParams }>, reply) => {
    const schedule = await scheduleService.toggle(request.params.id);
    
    // Reschedule jobs after toggle
    await removeScheduleJobs(request.params.id);
    if (schedule.isActive) {
      await scheduleRecurringJobs(app.prisma);
    }
    
    return { success: true, isActive: schedule.isActive };
  });

  // POST /api/schedules/:id/run - Manually trigger a schedule run
  app.post('/:id/run', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false },
      body: {
        type: 'object',
        properties: {
          streamId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        },
        required: ['streamId'],
        additionalProperties: false,
      },
    },
  }, async (request: FastifyRequest<{ Params: ScheduleIdParams; Body: ScheduleRunBody }>, reply) => {
    const { id: scheduleId } = request.params;
    const { streamId } = request.body;
    
    const schedule = await app.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { streams: { where: { id: streamId } } },
    });
    
    if (!schedule) return reply.code(404).send({ error: 'Schedule not found' });
    
    const stream = schedule.streams[0];
    if (!stream) return reply.code(404).send({ error: 'Stream not found in schedule' });
    
    if (stream.status !== 'STOPPED') {
      return reply.code(400).send({ error: 'Stream is not stopped' });
    }
    
    // Add immediate job to queue
    const { getScheduleQueue } = await import('../workers/scheduler.worker.js');
    const queue = getScheduleQueue();
    
    await queue.add('scheduled-stream', {
      streamId: stream.id,
      scheduleId: schedule.id,
      titleTemplate: stream.titleTemplate,
      descriptionTemplate: stream.descriptionTemplate,
      tagsTemplate: stream.tagsTemplate,
      genre: stream.genre,
      mood: stream.mood,
      maxDurationHours: stream.maxDuration || schedule.maxDuration || 0,
      accountId: stream.accountId,
    }, { jobId: `manual-${scheduleId}-${streamId}-${Date.now()}` });
    
    return { success: true, message: 'Schedule triggered manually' };
  });

  // GET /api/schedules/status - Get scheduler status
  app.get('/status', async (request, reply) => {
    const status = await getScheduledJobsStatus();
    return status;
  });
};

export default scheduleRoutes;