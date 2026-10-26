import { describe, it, expect } from 'vitest';
import { renderMetadata, renderTemplate, createDefaultMusicTemplate, createDefaultPlaylistTemplate, createDefaultVisualizerTemplate } from './metadata-renderer.js';

describe('Metadata Template Renderer', () => {
  const baseContext = {
    date: 'October 25, 2026',
    time: '10:30 AM',
    playlistName: 'My Playlist',
    currentVideo: 'Track 1',
    videoIndex: 0,
    totalVideos: 10,
    streamNumber: 1,
    currentViewers: 100,
    genre: 'electronic',
    mood: 'energetic',
    channelName: 'My Channel',
    channelHandle: '@mychannel',
    startTime: '10:00 AM',
  };

  describe('renderTemplate', () => {
    it('should replace {date} variable', () => {
      const result = renderTemplate('Today is {date}', baseContext);
      expect(result).toBe('Today is October 25, 2026');
    });

    it('should replace {time} variable', () => {
      const result = renderTemplate('Time is {time}', baseContext);
      expect(result).toBe('Time is 10:30 AM');
    });

    it('should replace {genre} variable', () => {
      const result = renderTemplate('Genre: {genre}', baseContext);
      expect(result).toBe('Genre: electronic');
    });

    it('should replace {mood} variable', () => {
      const result = renderTemplate('Mood: {mood}', baseContext);
      expect(result).toBe('Mood: energetic');
    });

    it('should replace {channelName} variable', () => {
      const result = renderTemplate('Channel: {channelName}', baseContext);
      expect(result).toBe('Channel: My Channel');
    });

    it('should replace #{randomTag}', () => {
      const result = renderTemplate('Tag: #{randomTag}', baseContext);
      expect(result).toMatch(/^Tag: #\w+$/);
    });

    it('should replace #{music} with hashtag from music set', () => {
      const result = renderTemplate('Tags: #{music}', baseContext);
      expect(result).toMatch(/^Tags: #\w+$/);
    });

    it('should replace {?genre:has_genre:no_genre} when genre exists', () => {
      const result = renderTemplate('{?genre:has_genre:no_genre}', baseContext);
      expect(result).toBe('has_genre');
    });

    it('should replace {?date:has_date:no_date} when date is empty', () => {
      const ctx = { ...baseContext, date: '' };
      const result = renderTemplate('{?date:has_date:no_date}', ctx);
      expect(result).toBe('no_date');
    });

    it('should handle empty template', () => {
      const result = renderTemplate('', baseContext);
      expect(result).toBe('');
    });

    it('should handle undefined template', () => {
      const result = renderTemplate(undefined as any, baseContext);
      expect(result).toBe('');
    });
  });

  describe('renderMetadata', () => {
    it('should render title, description, and tags', () => {
      const template = {
        title: '🎵 {genre} Radio • {date}',
        description: 'Genre: {genre} | Mood: {mood}',
        tags: '{genre}, {mood}, live',
      };
      const result = renderMetadata(template, baseContext);

      expect(result.title).toBe('🎵 electronic Radio • October 25, 2026');
      expect(result.description).toBe('Genre: electronic | Mood: energetic');
      expect(result.tags).toContain('#electronic');
      expect(result.tags).toContain('#energetic');
      expect(result.tags).toContain('#live');
    });

    it('should limit tags to 15', () => {
      const manyTags = 'tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13, tag14, tag15, tag16';
      const template = {
        title: 'Test',
        description: 'Test',
        tags: manyTags,
      };
      const result = renderMetadata(template, baseContext);
      expect(result.tags.length).toBeLessThanOrEqual(15);
    });
  });

  describe('createDefaultMusicTemplate', () => {
    it('should create template with genre and mood', () => {
      const template = createDefaultMusicTemplate('electronic', 'energetic');
      expect(template.title).toContain('electronic');
      expect(template.tags).toContain('electronic');
      expect(template.tags).toContain('energetic');
    });

    it('should use placeholder when genre/mood not provided', () => {
      const template = createDefaultMusicTemplate();
      expect(template.title).toContain('{genre}');
      expect(template.tags).toContain('{genre}');
    });
  });

  describe('createDefaultPlaylistTemplate', () => {
    it('should create playlist template', () => {
      const template = createDefaultPlaylistTemplate();
      expect(template.title).toContain('{playlistName}');
      expect(template.title).toContain('{videoIndex}');
      expect(template.title).toContain('{totalVideos}');
    });
  });

  describe('createDefaultVisualizerTemplate', () => {
    it('should create visualizer template', () => {
      const template = createDefaultVisualizerTemplate('SPECTRUM_BARS');
      expect(template.title).toContain('SPECTRUM_BARS');
      expect(template.title).toContain('Visualizer');
    });
  });
});
