// Visualizer Service

import { BaseService } from './base.service.js';
import { Prisma } from '@prisma/client';
import { BUILTIN_VISUALIZERS } from '@stream-engine/shared/constants';
import { VisualizerFilters } from '@stream-engine/ffmpeg-worker/visualizers/builtin';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

export class VisualizerService extends BaseService {
  async list(includeBuiltIn: boolean) {
    this.logger.info('VisualizerService.list called', { includeBuiltIn });
    const visualizers = await this.prisma.visualizer.findMany({
      where: { userId: 'default-user', ...(includeBuiltIn ? {} : { isBuiltIn: false }) },
      orderBy: { createdAt: 'desc' }
    });

    if (includeBuiltIn) {
      const builtIn = Object.entries(BUILTIN_VISUALIZERS).map(([key, value]) => ({
        id: `builtin-${key}`,
        name: value.name,
        type: value.type,
        config: value.config,
        backgroundType: value.backgroundType,
        backgroundConfig: value.backgroundConfig,
        width: value.width,
        height: value.height,
        fps: value.fps,
        isBuiltIn: true
      }));
      this.logger.info('Returning built-in visualizers', { count: builtIn.length });
      return [...builtIn, ...visualizers];
    }
    return visualizers;
  }

  async create(userId: string, data: any) {
    this.logger.info('Creating visualizer', { userId, name: data.name });
    return this.prisma.visualizer.create({
      data: { ...data, userId, isBuiltIn: false }
    });
  }

  async getById(id: string) {
    this.logger.info('Getting visualizer by ID', { id });
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      const viz = BUILTIN_VISUALIZERS[key as keyof typeof BUILTIN_VISUALIZERS];
      if (!viz) return null;
      return { id, ...viz, isBuiltIn: true };
    }
    return this.prisma.visualizer.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    this.logger.info('Updating visualizer', { id });
    if (id.startsWith('builtin-')) throw new Error('Cannot modify built-in visualizer');
    return this.prisma.visualizer.update({ where: { id }, data });
  }

  async delete(id: string) {
    this.logger.info('Deleting visualizer', { id });
    if (id.startsWith('builtin-')) throw new Error('Cannot delete built-in visualizer');
    await this.prisma.visualizer.delete({ where: { id } });
  }

  async generateFilter(config: any): Promise<string> {
    if (config.customFilter) return config.customFilter;

    let vizFilter: string;

    switch (config.type) {
      case 'SPECTRUM_BARS':
        vizFilter = this.buildSpectrumFilter(config);
        break;
      case 'WAVEFORM':
        vizFilter = this.buildWaveformFilter(config);
        break;
      case 'CIRCULAR':
        vizFilter = this.buildCircularFilter(config);
        break;
      default:
        vizFilter = `color=black:size=${config.width || 1920}x${config.height || 1080}[viz]`;
    }

    // Apply background overlay if configured
    if (config.backgroundType && config.backgroundConfig) {
      return VisualizerFilters.withBackground(vizFilter, {
        backgroundType: config.backgroundType,
        backgroundConfig: config.backgroundConfig,
        width: config.width || 1920,
        height: config.height || 1080,
      }).replace(/\[viz\]/g, '[vout]');
    }

    return vizFilter.replace(/\[viz\]/g, '[vout]');
  }

  private buildSpectrumFilter(config: any): string {
    return `[0:a]showspectrum=mode=combined:color=rainbow:scale=log:saturation=1:size=${config.width || 1920}x${config.height || 1080},fps=${config.fps || 30}[viz]`;
  }

  private buildWaveformFilter(config: any): string {
    const wave = config.waveform || {};
    return `[0:a]showwaves=mode=${wave.style || 'cline'}:colors=${wave.color || 'white'}:size=${config.width || 1920}x${config.height || 1080},fps=${config.fps || 30}[viz]`;
  }

  private buildCircularFilter(config: any): string {
    const circ = config.circular || {};
    const count = Math.min(circ.bars || 30, 30);
    return `[0:a]showcqt=size=${config.width || 1920}x${config.height || 1080}:count=${count},fps=${config.fps || 30}[viz]`;
  }

  async generatePreview(id: string, duration: number): Promise<string> {
    let visualizer: any;
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      visualizer = BUILTIN_VISUALIZERS[key as keyof typeof BUILTIN_VISUALIZERS];
      if (!visualizer) throw new Error('Built-in visualizer not found');
    } else {
      visualizer = await this.prisma.visualizer.findUnique({ where: { id } });
      if (!visualizer) throw new Error('Visualizer not found');
    }

    const filterGraph = await this.generateFilter({
      type: visualizer.type,
      config: visualizer.config,
      backgroundType: visualizer.backgroundType,
      backgroundConfig: visualizer.backgroundConfig,
      width: visualizer.width,
      height: visualizer.height,
      fps: visualizer.fps,
    });

    const outputPath = `/tmp/preview-${id}-${Date.now()}.mp4`;
    const ffmpegPath = ffmpegStatic || 'ffmpeg';

    try {
      const args = [
        '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
        '-filter_complex', filterGraph,
        '-map', '[vout]',
        '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '2000k',
        '-pix_fmt', 'yuv420p',
        '-t', String(duration || 10),
        '-y',
        outputPath,
      ];

      await execFileAsync(ffmpegPath, args, { timeout: 30000 });

      return outputPath;
    } catch (error: any) {
      this.logger.error('Failed to generate preview', { error: error.message, filterGraph });
      throw error;
    }
  }

  async generateGifPreview(id: string, duration: number): Promise<string> {
    let visualizer: any;
    if (id.startsWith('builtin-')) {
      const key = id.replace('builtin-', '');
      visualizer = BUILTIN_VISUALIZERS[key as keyof typeof BUILTIN_VISUALIZERS];
      if (!visualizer) throw new Error('Built-in visualizer not found');
    } else {
      visualizer = await this.prisma.visualizer.findUnique({ where: { id } });
      if (!visualizer) throw new Error('Visualizer not found');
    }

    // Generate a simpler filter graph specifically for GIF (no background overlay complexity)
    const gifFilterGraph = await this.generateFilter({
      type: visualizer.type,
      config: visualizer.config,
      backgroundType: 'COLOR',
      backgroundConfig: { color: visualizer.backgroundConfig?.color || '#000000' },
      width: 480,
      height: 270,
      fps: 10,
    });

    const outputPath = `/tmp/preview-${id}-${Date.now()}.gif`;
    const ffmpegPath = ffmpegStatic || 'ffmpeg';

    try {
      // Build complete filter graph with palette generation
      const gifFilterGraphFull = `${gifFilterGraph};[vout]fps=10,scale=480:-1:flags=lanczos,split[vout1][pal];[pal]palettegen=stats_mode=diff[pal];[vout1][pal]paletteuse[vout_gif]`;

      const args = [
        '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
        '-filter_complex', gifFilterGraphFull,
        '-map', '[vout_gif]',
        '-t', String(duration || 5),
        '-y',
        outputPath,
      ];

      await execFileAsync(ffmpegPath, args, { timeout: 30000 });

      return outputPath;
    } catch (error: any) {
      this.logger.error('Failed to generate GIF preview', { error: error.message, filterGraph: gifFilterGraph });
      throw error;
    }
  }
}
