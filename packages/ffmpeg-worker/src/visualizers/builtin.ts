// FFmpeg-Native Visualizer Filters

export class VisualizerFilters {
  static spectrumBars(config: any): string {
    const { bars, fftSize, frequencyRange, smoothingTimeConstant, width, height, fps } = config;
    const b = bars || {};
    const colors = b.colors || ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'];
    const colorStr = colors.join('|');
    const mode = b.mirror ? 'combined' : 'separate';
    const scale = 'log';
    return `[0:a]showspectrum=mode=${mode}:color=${colorStr}:scale=${scale}:size=${width}x${height}:rate=${fps}:smoothing=${b.smoothing || 0.8}[viz]`;
  }

  static waveform(config: any): string {
    const { waveform, fftSize, frequencyRange, smoothingTimeConstant, width, height, fps } = config;
    const w = waveform || {};
    const style = w.style || 'cline';
    const colors = w.color || '0x00ff00';
    return `[0:a]showwaves=mode=${style}:colors=${colors}:size=${width}x${height}:rate=${fps}:smoothing=${w.smoothing || 0.3}[viz]`;
  }

  static circular(config: any): string {
    const { circular, fftSize, frequencyRange, smoothingTimeConstant, width, height, fps } = config;
    const c = circular || {};
    const count = c.bars || 120;
    return `[0:a]showcqt=size=${width}x${height}:rate=${fps}:count=${count}:cscheme=rainbow[viz]`;
  }

  static vectorscope(config: any): string {
    const { width, height, fps } = config;
    return `[0:a]avectorscope=size=${width}x${height}:rate=${fps}:mode=lissajous[viz]`;
  }

  static dualView(config: any): string {
    const { width, height, fps } = config;
    return `
      [0:a]showspectrum=mode=separate:color=rainbow:scale=log:size=${width}x${Math.floor(height*0.66)}:rate=${fps}[spec];
      [0:a]showwaves=mode=cline:colors=white:size=${width}x${Math.floor(height*0.33)}:rate=${fps}[wave];
      [spec][wave]vstack[viz]
    `.trim().replace(/\n\s+/g, ' ');
  }

  static minimal(config: any): string {
    const { width, height, fps } = config;
    return `[0:a]showspectrum=mode=combined:color=0x00ff88:scale=log:size=${width}x${height}:rate=${fps}:smoothing=0.9[viz]`;
  }

  static byType(type: string, config: any): string {
    switch (type) {
      case 'SPECTRUM_BARS':
        return this.spectrumBars(config);
      case 'WAVEFORM':
        return this.waveform(config);
      case 'CIRCULAR':
        return this.circular(config);
      case 'VECTORSCOPE':
        return this.vectorscope(config);
      case 'DUAL_VIEW':
        return this.dualView(config);
      case 'MINIMAL':
        return this.minimal(config);
      default:
        return this.spectrumBars(config);
    }
  }

  // Background overlay
  static withBackground(vizFilter: string, bgConfig: any): string {
    const { backgroundType, backgroundConfig, width, height } = bgConfig;
    
    let bgInput = '';
    switch (backgroundType) {
      case 'COLOR':
        bgInput = `color=c=${backgroundConfig.color || '#000000'}:s=${width}x${height}[bg]`;
        break;
      case 'GRADIENT':
        const grad = backgroundConfig.gradient || {};
        const dir = grad.direction || 'vertical';
        const stops = (grad.stops || [{position: 0, color: '#000000'}, {position: 1, color: '#1a1a2e'}])
          .map((s: { position: number; color: string }) => `${s.position}:${s.color}`).join('|');
        bgInput = `gradients=s=${width}x${height}:c0=${stops.split('|')[0].split(':')[1]}:c1=${stops.split('|')[1].split(':')[1]}:direction=${dir}[bg]`;
        break;
      case 'IMAGE':
        bgInput = `movie=${backgroundConfig.image?.url}:loop=0,scale=${width}:${height}[bg]`;
        break;
      case 'VIDEO':
        bgInput = `movie=${backgroundConfig.video?.url}:loop=0,scale=${width}:${height}[bg]`;
        break;
      default:
        bgInput = `color=c=black:s=${width}x${height}[bg]`;
    }

    return `${bgInput};${vizFilter.replace('[viz]', '[viz_raw]')};[bg][viz_raw]overlay[viz]`;
  }
}