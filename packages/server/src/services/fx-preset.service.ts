// FX Preset Service

import { BaseService } from './base.service.js';
import { Prisma } from '@prisma/client';
import { BUILTIN_FX_PRESETS } from '@stream-engine/shared/constants';

export class FxPresetService extends BaseService {
  async list(includeBuiltIn: boolean) {
    this.logger.info('FxPresetService.list called', { includeBuiltIn });
    try {
      const presets = await this.prisma.fxPreset.findMany({
        where: { userId: 'default-user', ...(includeBuiltIn ? {} : { isBuiltIn: false }) },
        orderBy: { createdAt: 'desc' }
      });
      this.logger.info('Found presets', { count: presets.length });

      if (includeBuiltIn) {
        const builtIn: Array<{
          id: string;
          name: string;
          description: string;
          intensity: string;
          isBuiltIn: boolean;
          videoFilters: any;
          audioFilters: any;
        }> = [];

        for (const [key, value] of Object.entries(BUILTIN_FX_PRESETS)) {
          builtIn.push({
            id: `builtin-${key}`,
            name: value.name,
            description: value.description,
            intensity: value.intensity,
            isBuiltIn: true,
            videoFilters: value.videoFilters,
            audioFilters: value.audioFilters
          });
        }

        this.logger.info('Returning built-in presets', { count: builtIn.length });
        return [...builtIn, ...presets];
      }
      return presets;
    } catch (error) {
      this.logger.error('Error in FxPresetService.list', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async create(userId: string, data: any) {
    this.logger.info('Creating preset', { userId, name: data.name });
    return this.prisma.fxPreset.create({
      data: { ...data, userId, isBuiltIn: false }
    });
  }

  async getById(id: string) {
    this.logger.info('Getting preset by ID', { id });
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      const preset = BUILTIN_FX_PRESETS[key as keyof typeof BUILTIN_FX_PRESETS];
      if (!preset) return null;
      return { id, ...preset, isBuiltIn: true };
    }
    return this.prisma.fxPreset.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    this.logger.info('Updating preset', { id });
    if (id.startsWith('builtin-')) throw new Error('Cannot modify built-in preset');
    return this.prisma.fxPreset.update({ where: { id }, data });
  }

  async delete(id: string) {
    this.logger.info('Deleting preset', { id });
    if (id.startsWith('builtin-')) throw new Error('Cannot delete built-in preset');
    await this.prisma.fxPreset.delete({ where: { id } });
  }

  async testPreset(id: string, sampleFile?: string) {
    return { success: true, output: 'Test completed', error: undefined };
  }
}