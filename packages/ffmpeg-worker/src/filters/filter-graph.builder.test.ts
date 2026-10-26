import { describe, it, expect } from 'vitest';
import { FilterGraphBuilder } from './filter-graph.builder.js';

describe('FilterGraphBuilder', () => {
  describe('build()', () => {
    it('should return empty string when no filters', () => {
      const builder = new FilterGraphBuilder();
      const result = builder.build();
      expect(result).toBe('');
    });

    it('should build video filter chain', () => {
      const builder = new FilterGraphBuilder();
      builder.crop(2, true);
      builder.colorJitter(0.01, 0.01, 0.02, 0.02, 1);
      const result = builder.build();
      expect(result).toContain('[0:v]');
      expect(result).toContain('[vout]');
      expect(result).toContain('crop=');
      expect(result).toContain('eq=');
    });

    it('should build audio filter chain', () => {
      const builder = new FilterGraphBuilder();
      builder.loudnorm(-16, 0.5);
      builder.noiseOverlay('pink', 0.01, -30);
      const result = builder.build();
      expect(result).toContain('[0:a]');
      expect(result).toContain('[aout]');
      expect(result).toContain('loudnorm=');
      expect(result).toContain('anoisesrc=');
    });

    it('should combine video and audio chains with semicolon', () => {
      const builder = new FilterGraphBuilder();
      builder.crop(2, true);
      builder.loudnorm(-16, 0.5);
      const result = builder.build();
      expect(result).toContain('[vout]');
      expect(result).toContain('[aout]');
      expect(result).toContain(';');
    });
  });

  describe('applyVideoPreset', () => {
    it('should apply crop preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyVideoPreset({ crop: { percent: 2, randomize: true } });
      const result = builder.build();
      expect(result).toContain('crop=');
    });

    it('should apply colorJitter preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyVideoPreset({
        colorJitter: { brightness: 0.01, contrast: 0.01, saturation: 0.02, gamma: 0.02, hue: 1 },
      });
      const result = builder.build();
      expect(result).toContain('eq=');
      expect(result).toContain('brightness=0.01');
    });

    it('should apply noise preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyVideoPreset({ noise: { type: 'film', strength: 5, temporal: true } });
      const result = builder.build();
      expect(result).toContain('noisealls=');
    });

    it('should apply speed preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyVideoPreset({ speed: { factor: 1.005, pitchCorrection: true } });
      const result = builder.build();
      expect(result).toContain('setpts=');
      expect(result).toContain('atempo=');
    });

    it('should apply frameJitter preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyVideoPreset({ frameJitter: { enabled: true, dropRate: 0.001, blendRate: 0.5 } });
      const result = builder.build();
      expect(result).toContain('select=');
    });

    it('should apply watermark preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyVideoPreset({ watermark: { enabled: true, payload: 'test123', strength: 0.1 } });
      const result = builder.build();
      expect(result).toContain('geq=');
    });
  });

  describe('applyAudioPreset', () => {
    it('should apply noise overlay preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyAudioPreset({ noise: { type: 'pink', amplitude: 0.01, mixLevel: -30 } });
      const result = builder.build();
      expect(result).toContain('anoisesrc=');
      expect(result).toContain('amix=');
    });

    it('should apply spectralSmear preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyAudioPreset({ spectralSmear: { enabled: true, intensity: 0.3 } });
      const result = builder.build();
      expect(result).toContain('afftdn=');
    });

    it('should apply pitchShift preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyAudioPreset({ pitchShift: { semitones: 0.2 } });
      const result = builder.build();
      expect(result).toContain('rubberband=');
    });

    it('should apply tempoShift preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyAudioPreset({ tempoShift: { factor: 1.005 } });
      const result = builder.build();
      expect(result).toContain('atempo=');
    });

    it('should apply compand preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyAudioPreset({ compand: { attack: 5, release: 50, threshold: -20, ratio: 2 } });
      const result = builder.build();
      expect(result).toContain('compand=');
    });

    it('should apply reverb preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyAudioPreset({ reverb: { roomSize: 1000, damping: 500, wetLevel: 0.3 } });
      const result = builder.build();
      expect(result).toContain('aecho=');
    });

    it('should apply loudness preset', () => {
      const builder = new FilterGraphBuilder();
      builder.applyAudioPreset({ loudness: { target: -16, jitter: 0.5 } });
      const result = builder.build();
      expect(result).toContain('loudnorm=');
    });
  });

  describe('static buildPlaylistCrossfade', () => {
    it('should build crossfade filter for multiple videos', () => {
      const result = FilterGraphBuilder.buildPlaylistCrossfade(3, 3, [120, 120, 120]);
      expect(result).toContain('xfade=');
      expect(result).toContain('acrossfade=');
      expect(result).toContain('loop=');
      expect(result).toContain('aloop=');
    });

    it('should handle single video', () => {
      const result = FilterGraphBuilder.buildPlaylistCrossfade(1, 3, [120]);
      expect(result).toContain('loop=');
      expect(result).toContain('aloop=');
      expect(result).not.toContain('xfade=');
    });
  });
});
