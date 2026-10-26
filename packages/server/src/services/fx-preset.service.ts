// FX Preset Service

import { BaseService } from './base.service.js';
import { Prisma } from '@prisma/client';
import { BUILTIN_FX_PRESETS } from '@stream-engine/shared/constants';
import { FilterGraphBuilder } from '@stream-engine/ffmpeg-worker/filters/filter-graph.builder';
import ffmpegStatic from 'ffmpeg-static';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { VmafService } from './vmaf.service.js';
import { VmafTestResult, PresetDiff } from '@stream-engine/shared/types/vmaf';

const execFileAsync = promisify(execFile);

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
    
    // Build filter graph from videoFilters and audioFilters
    const builder = new FilterGraphBuilder();
    builder.applyVideoPreset(data.videoFilters || {});
    builder.applyAudioPreset(data.audioFilters || {});
    const filterGraph = builder.build();

    // Remove fields that don't exist in the Prisma schema
    const { videoFiles, audioFiles, outputPlatforms, customRtmpUrls, shuffleHistory, ...restData } = data;
    
    const createData = {
      ...restData,
      userId,
      videoFilters: JSON.stringify(data.videoFilters || {}),
      audioFilters: JSON.stringify(data.audioFilters || {}),
      filterGraph,
    };
    return this.prisma.fxPreset.create({
      data: createData,
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
    return this.prisma.fxPreset.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: any) {
    this.logger.info('Updating preset', { id });
    if (id.startsWith('builtin-')) throw new Error('Cannot modify built-in preset');
    return this.prisma.fxPreset.update({
      where: { id },
      data,
      
    });
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting preset', { id });
    if (id.startsWith('builtin-')) throw new Error('Cannot delete built-in preset');
    await this.prisma.fxPreset.delete({ where: { id } });
  }

  async testPreset(id: string, sampleFile?: string, runVmaf: boolean = false): Promise<any> {
    // Resolve preset config
    let preset: any;
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      preset = BUILTIN_FX_PRESETS[key as keyof typeof BUILTIN_FX_PRESETS];
      if (!preset) return { success: false, output: undefined, error: 'Built-in preset not found', filterGraph: '' };
    } else {
      const dbPreset = await this.prisma.fxPreset.findUnique({ where: { id } });
      if (!dbPreset) return { success: false, output: undefined, error: 'Preset not found', filterGraph: '' };
      preset = {
        name: dbPreset.name,
        videoFilters: typeof dbPreset.videoFilters === 'string' ? JSON.parse(dbPreset.videoFilters) : dbPreset.videoFilters,
        audioFilters: typeof dbPreset.audioFilters === 'string' ? JSON.parse(dbPreset.audioFilters) : dbPreset.audioFilters,
        intensity: dbPreset.intensity,
      };
    }

    // Build filter graph using FilterGraphBuilder
    const builder = new FilterGraphBuilder();
    builder.applyVideoPreset(preset.videoFilters || {});
    builder.applyAudioPreset(preset.audioFilters || {});
    const filterGraph = builder.build();

    // Validate filter graph by running FFmpeg with a test input
    const testInput = sampleFile || '/tmp/dummy.mp4';
    const ffmpegPath = ffmpegStatic || 'ffmpeg';

    try {
      const args = [
        '-re', '-stream_loop', '-1', '-i', testInput,
        '-filter_complex', filterGraph,
        '-map', '[vout]', '-map', '[aout]',
        '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '1000k',
        '-c:a', 'aac', '-b:a', '128k',
        '-t', '5',  // Test for 5 seconds
        '-f', 'null', '-'
      ];

      const { stdout, stderr } = await execFileAsync(ffmpegPath, args, { timeout: 15000 });

      const result: any = {
        success: true,
        output: filterGraph,
        filterGraph,
        ffmpegOutput: stdout,
        ffmpegStderr: stderr,
        error: undefined,
      };

      // Run VMAF test if requested
      if (runVmaf) {
        try {
          const { VmafService } = await import('./vmaf.service.js');
          const vmafService = new VmafService(this.app);
          const vmafResult = await vmafService.computeVmafForPreset(
            '/tmp/dummy.mp4',  // Use test input as reference
            filterGraph,
            5  // Test for 5 seconds
          );
          
          result.vmafScore = vmafResult.score;
          result.details = vmafResult.details;

          // Update database with VMAF score if not built-in
          if (!id.startsWith('builtin-')) {
            await this.prisma.fxPreset.update({
              where: { id },
              data: {
                vmafScore: vmafResult.score,
                vmafDetails: vmafResult.details ? JSON.stringify(vmafResult.details) : null,
                vmafTestedAt: new Date(),
              },
            });
          }
        } catch (vmafError: any) {
          this.logger.warn('VMAF test failed', { error: vmafError.message });
          // Don't fail the whole test if VMAF fails
        }
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        output: filterGraph,
        filterGraph,
        ffmpegOutput: error.stdout,
        ffmpegStderr: error.stderr,
        error: error.message || String(error),
      };
    }
  }

  async testPresetVmaf(id: string, sampleFile?: string): Promise<any> {
    return this.testPreset(id, sampleFile, true);
  }

  /**
   * Compare two presets - return parameter diff and VMAF difference
   */
  async comparePresets(id1: string, id2: string): Promise<{ video: any; audio: any; vmafDifference?: number }> {
    const preset1 = await this.getPresetConfig(id1);
    const preset2 = await this.getPresetConfig(id2);

    if (!preset1 || !preset2) {
      throw new Error('One or both presets not found');
    }

    const videoDiff = this.diffFilters(preset1.videoFilters || {}, preset2.videoFilters || {});
    const audioDiff = this.diffFilters(preset1.audioFilters || {}, preset2.audioFilters || {});

    // Get VMAF scores if available
    const preset1Db = await this.prisma.fxPreset.findUnique({ where: { id: id1 } });
    const preset2Db = await this.prisma.fxPreset.findUnique({ where: { id: id2 } });
    
    let vmafDifference: number | undefined;
    if (preset1Db?.vmafScore !== undefined && preset2Db?.vmafScore !== undefined) {
      vmafDifference = (preset1Db.vmafScore ?? 0) - (preset2Db.vmafScore ?? 0);
    }

    return {
      video: videoDiff,
      audio: audioDiff,
      vmafDifference,
    };
  }

  /**
   * Get preset configuration for comparison
   */
  private async getPresetConfig(id: string) {
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      const preset = BUILTIN_FX_PRESETS[key as keyof typeof BUILTIN_FX_PRESETS];
      if (!preset) return null;
      return preset;
    }
    const dbPreset = await this.prisma.fxPreset.findUnique({ where: { id } });
    if (!dbPreset) return null;
    return {
      name: dbPreset.name,
      videoFilters: typeof dbPreset.videoFilters === 'string' ? JSON.parse(dbPreset.videoFilters) : dbPreset.videoFilters,
      audioFilters: typeof dbPreset.audioFilters === 'string' ? JSON.parse(dbPreset.audioFilters) : dbPreset.audioFilters,
      intensity: dbPreset.intensity,
    };
  }

  /**
   * Diff two filter config objects
   */
  private diffFilters(obj1: Record<string, any>, obj2: Record<string, any>) {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    const videoAdded: string[] = [];
    const videoRemoved: string[] = [];
    const videoModified: Array<{ param: string; from: any; to: any }> = [];
    const audioAdded: string[] = [];
    const audioRemoved: string[] = [];
    const audioModified: Array<{ param: string; from: any; to: any }> = [];

    for (const key of Array.from(allKeys)) {
      if (!(key in obj1)) {
        // Check if it's a video or audio filter based on key prefix
        if (key.startsWith('video') || key.startsWith('crop') || key.startsWith('rotate') || key.startsWith('flip') || key.startsWith('color') || key.startsWith('noise') || key.startsWith('frame') || key.startsWith('speed') || key.startsWith('watermark')) {
          videoAdded.push(key);
        } else {
          audioAdded.push(key);
        }
      } else if (!(key in obj2)) {
        if (key.startsWith('video') || key.startsWith('crop') || key.startsWith('rotate') || key.startsWith('flip') || key.startsWith('color') || key.startsWith('noise') || key.startsWith('frame') || key.startsWith('speed') || key.startsWith('watermark')) {
          videoRemoved.push(key);
        } else {
          audioRemoved.push(key);
        }
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        if (key.startsWith('video') || key.startsWith('crop') || key.startsWith('rotate') || key.startsWith('flip') || key.startsWith('color') || key.startsWith('noise') || key.startsWith('frame') || key.startsWith('speed') || key.startsWith('watermark')) {
          videoModified.push({ param: key, from: obj1[key], to: obj2[key] });
        } else {
          audioModified.push({ param: key, from: obj1[key], to: obj2[key] });
        }
      }
    }

    return {
      videoFilters: { added: videoAdded, removed: videoRemoved, modified: videoModified },
      audioFilters: { added: audioAdded, removed: audioRemoved, modified: audioModified },
    };
  }

  /**
   * Export preset as JSON
   */
  async exportPreset(id: string): Promise<{ filterGraph: string; metadata: any } | null> {
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      const preset = BUILTIN_FX_PRESETS[key as keyof typeof BUILTIN_FX_PRESETS];
      if (!preset) return null;
      return {
        filterGraph: '',  // Will be built from filters
        metadata: {
          id: `builtin-${key}`,
          name: preset.name,
          description: preset.description,
          intensity: preset.intensity,
          videoFilters: preset.videoFilters,
          audioFilters: preset.audioFilters,
          isBuiltIn: true,
        },
      };
    }

    const preset = await this.prisma.fxPreset.findUnique({ where: { id } });
    if (!preset) return null;

    return {
      filterGraph: preset.filterGraph,
      metadata: {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        intensity: preset.intensity,
        videoFilters: JSON.parse(preset.videoFilters),
        audioFilters: JSON.parse(preset.audioFilters),
        customFilterGraph: preset.customFilterGraph,
        tags: preset.tags ? preset.tags.split(',') : [],
        version: preset.version,
        isBuiltIn: preset.isBuiltIn,
        vmafScore: preset.vmafScore,
        vmafTestedAt: preset.vmafTestedAt,
      },
    };
  }

  /**
   * Import preset from JSON
   */
  async importPreset(userId: string, data: { filterGraph?: string; metadata: any }): Promise<any> {
    const { filterGraph: providedFilterGraph, metadata } = data;
    
    const videoFilters = metadata.videoFilters || {};
    const audioFilters = metadata.audioFilters || {};
    
    // Build filter graph if not provided
    let filterGraph = data.filterGraph;
    if (!filterGraph && (Object.keys(videoFilters).length > 0 || Object.keys(audioFilters).length > 0)) {
      const builder = new FilterGraphBuilder();
      builder.applyVideoPreset(videoFilters);
      builder.applyAudioPreset(audioFilters);
      filterGraph = builder.build();
    }

    const preset = await this.prisma.fxPreset.create({
      data: {
        userId,
        name: metadata.name || 'Imported Preset',
        description: metadata.description,
        filterGraph: filterGraph || '',
        videoFilters: JSON.stringify(videoFilters),
        audioFilters: JSON.stringify(audioFilters),
        intensity: metadata.intensity || 'MEDIUM',
        customFilterGraph: metadata.customFilterGraph,
        tags: metadata.tags ? metadata.tags.join(',') : '',
        version: metadata.version || 1,
        isBuiltIn: false,
      },
    });

    return { id: preset.id };
  }

  /**
   * Duplicate a preset
   */
  async duplicatePreset(id: string, userId: string, newName?: string): Promise<any> {
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      const preset = BUILTIN_FX_PRESETS[key as keyof typeof BUILTIN_FX_PRESETS];
      if (!preset) throw new Error('Built-in preset not found');

      const newPreset = await this.prisma.fxPreset.create({
        data: {
          userId,
          name: newName || `${preset.name} (Copy)`,
          description: preset.description,
          filterGraph: '',
          videoFilters: JSON.stringify(preset.videoFilters),
          audioFilters: JSON.stringify(preset.audioFilters),
          intensity: preset.intensity,
          isBuiltIn: false,
        },
      });
      return newPreset;
    }

    const preset = await this.prisma.fxPreset.findUnique({ where: { id } });
    if (!preset) throw new Error('Preset not found');

    const newPreset = await this.prisma.fxPreset.create({
      data: {
        userId,
        name: newName || `${preset.name} (Copy)`,
        description: preset.description,
        filterGraph: preset.filterGraph,
        videoFilters: preset.videoFilters,
        audioFilters: preset.audioFilters,
        intensity: preset.intensity,
        customFilterGraph: preset.customFilterGraph,
        tags: preset.tags,
        version: 1,
        isBuiltIn: false,
      },
    });

    return newPreset;
  }
}