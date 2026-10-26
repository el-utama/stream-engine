// Smart Metadata Template Renderer
// Renders title, description, tags templates with dynamic variables

export interface StreamContext {
  date: string;
  time: string;
  playlistName?: string;
  currentVideo?: string;
  videoIndex: number;
  totalVideos: number;
  streamNumber: number;
  currentViewers?: number;
  genre?: string;
  mood?: string;
  channelName?: string;
  channelHandle?: string;
  startTime?: string;
}

export interface MetadataTemplate {
  title: string;
  description: string;
  tags: string;
}

export interface RenderedMetadata {
  title: string;
  description: string;
  tags: string[];
}

// Predefined hashtag sets for music streaming
const HASHTAG_SETS: Record<string, string[]> = {
  music: ['music', 'livestream', 'streaming', 'live', 'musicstream', '247'],
  electronic: ['electronic', 'edm', 'house', 'techno', 'ambient', 'chill'],
  lofi: ['lofi', 'lofibeats', 'chillhop', 'studybeats', 'relax', 'focus'],
  gaming: ['gaming', 'gamer', 'twitch', 'streamer', 'gameplay'],
  ambient: ['ambient', 'ambientmusic', 'meditation', 'sleep', 'relaxation'],
  pop: ['pop', 'popmusic', 'hits', 'charts', 'radio'],
  rock: ['rock', 'rockmusic', 'metal', 'alternative', 'indie'],
  jazz: ['jazz', 'jazzmusic', 'smoothjazz', 'blues'],
  classical: ['classical', 'classicalmusic', 'orchestra', 'piano'],
  hiphop: ['hiphop', 'rap', 'beats', 'instrumental'],
  rnb: ['rnb', 'soul', 'funk', 'groove'],
  country: ['country', 'countrymusic', 'folk', 'acoustic'],
  trending: ['fyp', 'viral', 'trending', 'foryou', 'explore'],
};

const RANDOM_TAGS = [
  'vibes', 'mood', 'chill', 'energy', 'flow', 'groove', 'rhythm', 'beat',
  'melody', 'harmony', 'sound', 'audio', 'listen', 'nowplaying', 'musiclife',
  'soundtrack', 'playlist', 'radio', 'stream', 'live', 'online', 'radio247',
  'musician', 'producer', 'composer', 'artist', 'creator', 'content',
];

// Template variable resolvers
const VARIABLE_RESOLVERS: Record<string, (ctx: StreamContext) => string> = {
  date: (ctx) => ctx.date,
  time: (ctx) => ctx.time,
  playlistName: (ctx) => ctx.playlistName || 'Playlist',
  currentVideo: (ctx) => ctx.currentVideo || 'Unknown',
  videoIndex: (ctx) => String(ctx.videoIndex + 1),
  totalVideos: (ctx) => String(ctx.totalVideos),
  streamNumber: (ctx) => String(ctx.streamNumber),
  currentViewers: (ctx) => String(ctx.currentViewers || 0),
  genre: (ctx) => ctx.genre || 'music',
  mood: (ctx) => ctx.mood || 'chill',
  channelName: (ctx) => ctx.channelName || 'Channel',
  channelHandle: (ctx) => ctx.channelHandle || 'channel',
  startTime: (ctx) => ctx.startTime || new Date().toLocaleTimeString(),
  dateTime: (ctx) => new Date().toLocaleString(),
  isoDate: (ctx) => new Date().toISOString().split('T')[0],
  isoTime: (ctx) => new Date().toISOString().split('T')[1].split('.')[0],
  timestamp: (ctx) => String(Date.now()),
  randomTag: () => RANDOM_TAGS[Math.floor(Math.random() * RANDOM_TAGS.length)],
  hashtags: (ctx) => generateHashtags(ctx),
  genreTags: (ctx) => generateGenreTags(ctx.genre),
  moodTags: (ctx) => generateMoodTags(ctx.mood),
};

function generateHashtags(ctx: StreamContext): string {
  const tags = new Set<string>();
  
  // Add genre-specific tags
  if (ctx.genre && HASHTAG_SETS[ctx.genre.toLowerCase()]) {
    HASHTAG_SETS[ctx.genre.toLowerCase()].forEach(t => tags.add(t));
  }
  
  // Add mood tags
  if (ctx.mood) {
    const moodTags = generateMoodTags(ctx.mood).split(' ');
    moodTags.forEach(t => tags.add(t.replace('#', '')));
  }
  
  // Add base music tags
  HASHTAG_SETS.music.forEach(t => tags.add(t));
  
  // Add random trending tags (2-3)
  const trendingCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < trendingCount; i++) {
    tags.add(HASHTAG_SETS.trending[Math.floor(Math.random() * HASHTAG_SETS.trending.length)]);
  }
  
  // Add random tags (1-2)
  for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
    tags.add(RANDOM_TAGS[Math.floor(Math.random() * RANDOM_TAGS.length)]);
  }
  
  return Array.from(tags).map(t => `#${t}`).join(' ');
}

function generateGenreTags(genre?: string): string {
  if (!genre) return '#music';
  const tags = HASHTAG_SETS[genre.toLowerCase()] || HASHTAG_SETS.music;
  return tags.map(t => `#${t}`).join(' ');
}

function generateMoodTags(mood?: string): string {
  const moodMap: Record<string, string[]> = {
    relaxing: ['relaxing', 'calm', 'peaceful', 'soothing'],
    energetic: ['energetic', 'upbeat', 'highenergy', 'motivation'],
    focus: ['focus', 'concentration', 'study', 'productivity'],
    sleep: ['sleep', 'insomnia', 'deepsleep', 'whitenoise'],
    happy: ['happy', 'joy', 'positive', 'goodvibes'],
    sad: ['sad', 'melancholy', 'emotional', 'feelings'],
    party: ['party', 'celebration', 'dance', 'fun'],
    workout: ['workout', 'fitness', 'gym', 'exercise'],
    romantic: ['romantic', 'love', 'date', 'couple'],
    nostalgic: ['nostalgic', 'throwback', 'retro', 'memories'],
  };
  
  const tags = moodMap[mood?.toLowerCase() || ''] || ['music'];
  return tags.map(t => `#${t}`).join(' ');
}

/**
 * Render a template string with variables
 * Supports: {var}, #{randomTag}, #{hashtags}, conditional {?var:value}
 */
export function renderTemplate(template: string, context: StreamContext): string {
  if (!template) return '';
  
  let result = template;
  
  // Replace standard variables
  for (const [key, resolver] of Object.entries(VARIABLE_RESOLVERS)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, resolver(context));
  }
  
  // Replace conditional variables: {?var:value_if_true:value_if_false}
  result = result.replace(/\{\?(\w+):([^:}]+):?([^}]*)\}/g, (_match, key, trueVal, falseVal = '') => {
    const value = VARIABLE_RESOLVERS[key]?.(context) || '';
    return value ? trueVal : falseVal;
  });
  
  // Replace #{setName} with random tag from set
  result = result.replace(/#\{(\w+)\}/g, (_match, setName) => {
    const set = HASHTAG_SETS[setName.toLowerCase()];
    if (set) {
      return `#${set[Math.floor(Math.random() * set.length)]}`;
    }
    return `#${RANDOM_TAGS[Math.floor(Math.random() * RANDOM_TAGS.length)]}`;
  });
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Render complete metadata template
 */
export function renderMetadata(template: MetadataTemplate, context: StreamContext): RenderedMetadata {
  const title = renderTemplate(template.title, context);
  const description = renderTemplate(template.description, context);
  const tagsStr = renderTemplate(template.tags, context);
  
  // Parse tags: split by comma, clean up, ensure they start with #
  const tags = tagsStr
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(t => t.startsWith('#') ? t : `#${t}`)
    .slice(0, 15); // YouTube max 15 tags
  
  return { title, description, tags };
}

/**
 * Create default metadata template for music streaming
 */
export function createDefaultMusicTemplate(genre?: string, mood?: string): MetadataTemplate {
  const genreTag = genre || '{genre}';
  const moodTag = mood || '{mood}';
  
  return {
    title: `🎵 ${genreTag} Radio 24/7 • Live Now • {date} • #{trending}`,
    description: `🎵 Welcome to {channelName}!

Now Playing: {currentVideo}
Genre: {genre} | Mood: {mood}

🎧 Listen 24/7 - No ads, no interruptions
🔔 Subscribe for more: https://youtube.com/@{channelHandle}
💬 Chat with us: https://youtube.com/live_chat

#{hashtags}

#Music #LiveStream #247 #Radio ${generateGenreTags(genre).replace(/#/g, ' #')}`,
    tags: `${genreTag}, ${moodTag}, live, streaming, 24/7, radio, music, {date}, #{music}`,
  };
}

/**
 * Create default metadata template for playlist streaming
 */
export function createDefaultPlaylistTemplate(): MetadataTemplate {
  return {
    title: '📻 {playlistName} • {videoIndex}/{totalVideos} • {date}',
    description: `Playlist: {playlistName}
Now: {currentVideo}

#{hashtags}`,
    tags: 'playlist, {genre}, {mood}, music, #{music}',
  };
}

/**
 * Create default metadata template for visualizer streaming
 */
export function createDefaultVisualizerTemplate(visualizerType: string): MetadataTemplate {
  return {
    title: `🎨 ${visualizerType} Visualizer • {genre} Vibes • {date} • #{trending}`,
    description: `🎨 Audio-reactive ${visualizerType.toLowerCase()} visualizer
Genre: {genre} | Mood: {mood}

🎧 Music + Visuals 24/7
🔔 Subscribe: https://youtube.com/@{channelHandle}

#{hashtags}

#Visualizer #MusicVisualizer #${visualizerType} #Music #LiveStream`,
    tags: `visualizer, ${visualizerType.toLowerCase()}, {genre}, {mood}, music, live, streaming, {date}, #{music}`,
  };
}