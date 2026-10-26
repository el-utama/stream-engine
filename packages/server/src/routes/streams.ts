// Stream Routes - CRUD + Control

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { StreamService } from '../services/stream.service.js';

interface StreamQuery {
  page?: number;
  limit?: number;
  status?: string;
  accountId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface StreamIdParams {
  id: string;
}

interface LogsQuery {
  limit?: number;
  level?: string;
}

const streamRoutes: FastifyPluginAsync = async (app) => {
  const streamService = new StreamService(app);
  const log = app.log as any;

  app.get('/', {
    schema: { querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        status: { type: 'string' },
        accountId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'name', 'status'], default: 'createdAt' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
      },
      additionalProperties: false
    }},
  }, async (request: FastifyRequest<{ Querystring: StreamQuery }>, reply) => {
    const { page, limit, status, accountId, sortBy, sortOrder } = request.query as any;
    const result = await streamService.list({
      userId: 'default-user',
      page,
      limit,
      status,
      accountId,
      sortBy,
      sortOrder
    });
    return result;
  });

  app.post('/', {
    schema: { body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', maxLength: 500 },
        accountId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        sourceType: { type: 'string', enum: ['VIDEO_FILE', 'PLAYLIST', 'RTMP_PUSH', 'WEBCAM', 'VISUALIZER'] },
        videoFiles: { type: 'array', items: { type: 'string' }, minItems: 0 },
        playlistId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        outputPlatforms: { type: 'array', items: { type: 'string', enum: ['YOUTUBE', 'TWITCH', 'FACEBOOK', 'CUSTOM_RTMP'] }, minItems: 1 },
        customRtmpUrls: { type: 'object' },
        resolution: { type: 'string', pattern: '^\\d+x\\d+$', default: '1920x1080' },
        fps: { type: 'integer', minimum: 15, maximum: 60, default: 30 },
        videoBitrate: { type: 'integer', minimum: 500, maximum: 20000, default: 4000 },
        audioBitrate: { type: 'integer', minimum: 64, maximum: 320, default: 128 },
        codec: { type: 'string', default: 'libx264' },
        preset: { type: 'string', default: 'veryfast' },
        loopMode: { type: 'string', enum: ['INFINITE', 'ONCE', 'COUNT'], default: 'INFINITE' },
        shuffleEnabled: { type: 'boolean', default: false },
        crossfadeDuration: { type: 'integer', minimum: 0, maximum: 10, default: 3 },
        fxPresetId: { type: 'string', pattern: '^(builtin-)?[a-z0-9]{25}$' },
        customFxFilters: { type: 'string' },
        audioSource: { type: 'string', enum: ['VIDEO', 'FILE', 'NOISE', 'MIX'], default: 'VIDEO' },
        audioFiles: { type: 'array', items: { type: 'string' } },
        noiseProfile: { type: 'string', enum: ['WHITE', 'PINK', 'BROWN', 'BLUE', 'VIOLET', 'VELVET', 'CUSTOM'] },
        noiseAmplitude: { type: 'number', minimum: 0, maximum: 1, default: 0.01 },
        scheduleId: { type: 'string', pattern: '^(builtin-)?[a-z0-9]{25}$' },
        maxDuration: { type: 'integer', minimum: 1, maximum: 168 },
        autoRestart: { type: 'boolean', default: true },
        titleTemplate: { type: 'string', maxLength: 200 },
        descriptionTemplate: { type: 'string', maxLength: 5000 },
        tagsTemplate: { type: 'string', maxLength: 500 },
        thumbnailPath: { type: 'string' }
      },
      required: ['name', 'sourceType', 'outputPlatforms', 'customRtmpUrls'],
      additionalProperties: false
    }},
  }, async (request, reply) => {
    const stream = await streamService.create('default-user', request.body);
    return reply.code(201).send({ id: stream.id });
  });

  app.get('/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: StreamIdParams }>, reply) => {
    const stream = await streamService.getById(request.params.id);
    if (!stream) return reply.code(404).send({ error: 'Stream not found' });
    return stream;
  });

  app.patch('/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }, body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', maxLength: 500 },
        accountId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        sourceType: { type: 'string', enum: ['VIDEO_FILE', 'PLAYLIST', 'RTMP_PUSH', 'WEBCAM', 'VISUALIZER'] },
        videoFiles: { type: 'array', items: { type: 'string' } },
        playlistId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        outputPlatforms: { type: 'array', items: { type: 'string', enum: ['YOUTUBE', 'TWITCH', 'FACEBOOK', 'CUSTOM_RTMP'] } },
        customRtmpUrls: { type: 'object' },
        resolution: { type: 'string', pattern: '^\\d+x\\d+$' },
        fps: { type: 'integer', minimum: 15, maximum: 60 },
        videoBitrate: { type: 'integer', minimum: 500, maximum: 20000 },
        audioBitrate: { type: 'integer', minimum: 64, maximum: 320 },
        codec: { type: 'string' },
        preset: { type: 'string' },
        loopMode: { type: 'string', enum: ['INFINITE', 'ONCE', 'COUNT'] },
        shuffleEnabled: { type: 'boolean' },
        crossfadeDuration: { type: 'integer', minimum: 0, maximum: 10 },
        fxPresetId: { type: 'string', pattern: '^(builtin-)?[a-z0-9]{25}$' },
        customFxFilters: { type: 'string' },
        audioSource: { type: 'string', enum: ['VIDEO', 'FILE', 'NOISE', 'MIX'] },
        audioFiles: { type: 'array', items: { type: 'string' } },
        noiseProfile: { type: 'string', enum: ['WHITE', 'PINK', 'BROWN', 'BLUE', 'VIOLET', 'VELVET', 'CUSTOM'] },
        noiseAmplitude: { type: 'number', minimum: 0, maximum: 1 },
        scheduleId: { type: 'string', pattern: '^(builtin-)?[a-z0-9]{25}$' },
        maxDuration: { type: 'integer', minimum: 1, maximum: 168 },
        autoRestart: { type: 'boolean' },
        titleTemplate: { type: 'string', maxLength: 200 },
        descriptionTemplate: { type: 'string', maxLength: 5000 },
        tagsTemplate: { type: 'string', maxLength: 500 },
        thumbnailPath: { type: 'string' }
      },
      additionalProperties: false
    }},
  }, async (request: FastifyRequest<{ Params: StreamIdParams }>, reply) => {
    await streamService.update(request.params.id, request.body);
    return { success: true };
  });

  app.delete('/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: StreamIdParams }>, reply) => {
    await streamService.delete(request.params.id);
    return { success: true };
  });

  app.post('/:id/start', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: StreamIdParams }>, reply) => {
    const result = await streamService.start(request.params.id);
    if (!result.ok) return reply.code(400).send({ error: result.error.message });
    return { success: true, rtmpTargets: result.value.rtmpTargets };
  });

  app.post('/:id/stop', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: StreamIdParams }>, reply) => {
    await streamService.stop(request.params.id);
    return { success: true };
  });

  app.post('/:id/restart', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: StreamIdParams }>, reply) => {
    await streamService.restart(request.params.id);
    return { success: true };
  });

  app.get('/:id/status', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: StreamIdParams }>, reply) => {
    const status = await streamService.getStatus(request.params.id);
    return status;
  });

  app.get('/:id/logs', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
          level: { type: 'string' }
        },
        additionalProperties: false
      }
    },
  }, async (request: FastifyRequest<{ Params: StreamIdParams; Querystring: LogsQuery }>, reply) => {
    const logs = await streamService.getLogs(request.params.id, request.query as any);
    return logs;
  });
};

export default streamRoutes;