// FX Preset Routes

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { FxPresetService } from '../services/fx-preset.service.js';

interface FxPresetQuery {
  includeBuiltIn?: boolean;
}

interface FxPresetIdParams {
  id: string;
}

interface CreateFxPresetBody {
  name: string;
  description?: string;
  videoFilters: Record<string, any>;
  audioFilters: Record<string, any>;
  intensity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'AGGRESSIVE';
  sourceType?: string;
  videoFiles?: string[];
  playlistId?: string;
  outputPlatforms?: string[];
  customRtmpUrls?: Record<string, { url: string; key: string }>;
  resolution?: string;
  fps?: number;
  videoBitrate?: number;
  audioBitrate?: number;
  codec?: string;
  preset?: string;
  loopMode?: string;
  shuffleEnabled?: boolean;
  crossfadeDuration?: number;
  fxPresetId?: string;
  customFxFilters?: string;
  audioSource?: string;
  audioFiles?: string[];
  noiseProfile?: string;
  noiseAmplitude?: number;
  scheduleId?: string;
  maxDuration?: number;
  autoRestart?: boolean;
  titleTemplate?: string;
  descriptionTemplate?: string;
  tagsTemplate?: string;
  thumbnailPath?: string;
  visualizerId?: string;
}

interface UpdateFxPresetBody {
  name?: string;
  description?: string;
  videoFilters?: Record<string, any>;
  audioFilters?: Record<string, any>;
  intensity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'AGGRESSIVE';
}

interface TestFxPresetBody {
  sampleFile?: string;
}

const fxPresetRoutes: FastifyPluginAsync = async (app) => {
  const fxService = new FxPresetService(app);
  const log = app.log as any;

  app.get('/', {
    schema: { querystring: {
      type: 'object',
      properties: {
        includeBuiltIn: { type: 'boolean', default: true }
      },
      additionalProperties: false
    }},
  }, async (request: FastifyRequest<{ Querystring: FxPresetQuery }>, reply) => {
    log.info('GET /api/fx-presets request received');
    try {
      const result = await fxService.list((request.query as any).includeBuiltIn);
      return result;
    } catch (error) {
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
    }},
  }, async (request: FastifyRequest<{ Body: CreateFxPresetBody }>, reply) => {
    log.info('POST /api/fx-presets request received', { body: request.body });
    const preset = await fxService.create('default-user', request.body);
    return reply.code(201).send({ id: preset.id });
  });

  app.get('/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: FxPresetIdParams }>, reply) => {
    const preset = await fxService.getById(request.params.id);
    if (!preset) return reply.code(404).send({ error: 'Preset not found' });
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
  }, async (request: FastifyRequest<{ Params: FxPresetIdParams; Body: UpdateFxPresetBody }>, reply) => {
    await fxService.update(request.params.id, request.body);
    return { success: true };
  });

  app.delete('/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string', pattern: '^[a-z0-9]{25}$' } }, required: ['id'], additionalProperties: false }},
  }, async (request: FastifyRequest<{ Params: FxPresetIdParams }>, reply) => {
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
  }, async (request: FastifyRequest<{ Params: FxPresetIdParams; Body: TestFxPresetBody }>, reply) => {
    const result = await fxService.testPreset(request.params.id, (request.body as any).sampleFile);
    return result;
  });
};

export default fxPresetRoutes;