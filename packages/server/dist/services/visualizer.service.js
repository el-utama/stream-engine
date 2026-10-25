// Visualizer Service
import { BaseService } from './base.service.js';
import { BUILTIN_VISUALIZERS } from '@stream-engine/shared/constants';
export class VisualizerService extends BaseService {
    async list(includeBuiltIn) {
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
    async create(userId, data) {
        this.logger.info('Creating visualizer', { userId, name: data.name });
        return this.prisma.visualizer.create({
            data: { ...data, userId, isBuiltIn: false }
        });
    }
    async getById(id) {
        this.logger.info('Getting visualizer by ID', { id });
        if (id.startsWith('builtin-')) {
            const key = id.replace('builtin-', '');
            const viz = BUILTIN_VISUALIZERS[key];
            if (!viz)
                return null;
            return { id, ...viz, isBuiltIn: true };
        }
        return this.prisma.visualizer.findUnique({ where: { id } });
    }
    async update(id, data) {
        this.logger.info('Updating visualizer', { id });
        if (id.startsWith('builtin-'))
            throw new Error('Cannot modify built-in visualizer');
        return this.prisma.visualizer.update({ where: { id }, data });
    }
    async delete(id) {
        this.logger.info('Deleting visualizer', { id });
        if (id.startsWith('builtin-'))
            throw new Error('Cannot delete built-in visualizer');
        await this.prisma.visualizer.delete({ where: { id } });
    }
    async generateFilter(config) {
        if (config.customFilter)
            return config.customFilter;
        switch (config.type) {
            case 'SPECTRUM_BARS':
                return this.buildSpectrumFilter(config);
            case 'WAVEFORM':
                return this.buildWaveformFilter(config);
            case 'CIRCULAR':
                return this.buildCircularFilter(config);
            default:
                return 'color=black:1920x1080';
        }
    }
    buildSpectrumFilter(config) {
        return `[0:a]showspectrum=mode=combined:color=rainbow:scale=log:saturation=1:size=${config.width || 1920}x${config.height || 1080}:rate=${config.fps || 30}[viz]`;
    }
    buildWaveformFilter(config) {
        const wave = config.waveform || {};
        return `[0:a]showwaves=mode=${wave.style || 'cline'}:colors=${wave.color || 'white'}:size=${config.width || 1920}x${config.height || 1080}:rate=${config.fps || 30}[viz]`;
    }
    buildCircularFilter(config) {
        const circ = config.circular || {};
        return `[0:a]showcqt=size=${config.width || 1920}x${config.height || 1080}:rate=${config.fps || 30}:count=${circ.bars || 120}:cscheme=rainbow[viz]`;
    }
    async generatePreview(id, duration) {
        return `/preview/${id}.mp4`;
    }
}
//# sourceMappingURL=visualizer.service.js.map