# YouTube Smart Streaming Engine - Implementation Plan

## Project Overview
Build a lightweight, web-based smart streaming engine for YouTube with multi-account, multi-stream support, smart looping, anti-ghosting, scheduling, multi-platform RTMP, smart FX engine, and visualizers - all without installation (runs in browser) with optional Docker support.

---

## Architecture Decision

### Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 18 + TypeScript + Vite | Modern, fast, no-install web app |
| **Backend** | Node.js + Fastify | Lightweight, fast HTTP server |
| **Streaming Engine** | FFmpeg (via fluent-ffmpeg + ffmpeg-static) | Industry standard, hardware acceleration support |
| **RTMP Server** | Node-Media-Server (NMS) | Proven RTMP ingest + relay to multiple platforms |
| **Real-time** | Socket.io | WebSocket for live status updates |
| **Auth** | Google OAuth 2.0 (PKCE) + Refresh Token Rotation | Secure multi-account YouTube access |
| **Scheduler** | node-cron + BullMQ (Redis) | Reliable job scheduling |
| **Database** | SQLite (better-sqlite3) + Prisma ORM | Zero-config, file-based, portable |
| **Container** | Docker + Docker Compose | Optional deployment |

### Core Architecture Pattern
```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Dashboard│ │ Accounts │ │ Streams  │ │ Visualizer/FX    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/WS
┌──────────────────────────▼──────────────────────────────────────┐
│                    Fastify API Server                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │ Auth Service│ │ Stream Mgmt │ │ Scheduler   │ │ FX Engine │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Node-Media-   │  │ FFmpeg Workers│  │ YouTube API   │
│ Server (RTMP) │  │ (Stream Proc) │  │ (Broadcasts)  │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
   RTMP Ingest      Video/Audio FX      Live Broadcast
   Multi-platform   Smart Loop          Management
   Relay (tee)      Visualizers
```

---

## Phase 1: Foundation & Core Infrastructure (Week 1-2)

### 1.1 Project Setup
- [ ] Initialize monorepo with pnpm workspaces
- [ ] Configure TypeScript, ESLint, Prettier, Vitest
- [ ] Set up Docker Compose for development (Redis, SQLite persistence)
- [ ] Configure GitHub Actions CI/CD

### 1.2 Database Schema (Prisma)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      YouTubeAccount[]
  streams       Stream[]
  schedules     Schedule[]
  fxPresets     FxPreset[]
}

model YouTubeAccount {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  channelId         String   @unique
  channelName       String
  channelHandle     String?
  refreshTokenEnc   String   // Encrypted
  accessTokenEnc    String?  // Encrypted, cached
  tokenExpiry       DateTime?
  avatarUrl         String?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  streams           Stream[]
  
  @@index([userId])
}

model Stream {
  id                String        @id @default(cuid())
  userId            String
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId         String
  account           YouTubeAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  name              String
  description       String?
  
  // Source Configuration
  sourceType        SourceType    // VIDEO_FILE, PLAYLIST, RTMP_PUSH, WEBCAM, VISUALIZER
  videoFiles        String[]      // JSON array of file paths/URLs
  playlistId        String?
  rtmpPushKey       String?       // For OBS/external push
  
  // Loop & Playback
  loopMode          LoopMode      @default(INFINITE)
  shuffleEnabled    Boolean       @default(false)
  crossfadeDuration Int           @default(2) // seconds
  
  // Output Configuration
  outputPlatforms   Platform[]    // YOUTUBE, TWITCH, FACEBOOK, CUSTOM_RTMP
  customRtmpUrls    Json?         // { platform: { url, key } }
  
  // Video Settings
  resolution        String        @default("1920x1080")
  fps               Int           @default(30)
  videoBitrate      Int           @default(4000) // kbps
  audioBitrate      Int           @default(128)  // kbps
  codec             String        @default("libx264")
  preset            String        @default("veryfast")
  
  // FX Engine
  fxPresetId        String?
  fxPreset          FxPreset?     @relation(fields: [fxPresetId], references: [id])
  customFxFilters   String?       // FFmpeg filter_complex
  
  // Audio
  audioSource       AudioSource   @default(VIDEO)
  audioFiles        String[]      // Background music
  noiseProfile      NoiseProfile? // WHITE, PINK, BROWN, VELVET, CUSTOM
  noiseAmplitude    Float         @default(0.01)
  
  // Scheduling
  scheduleId        String?
  schedule          Schedule?     @relation(fields: [scheduleId], references: [id])
  maxDuration       Int?          // Max hours, null = unlimited
  autoRestart       Boolean       @default(true)
  
  // Status
  status            StreamStatus  @default(STOPPED)
  currentBroadcastId String?
  startedAt         DateTime?
  stoppedAt         DateTime?
  totalUptime       Int           @default(0) // seconds
  
  // Metadata
  titleTemplate     String?       // Smart title with variables
  descriptionTemplate String?     // Smart description
  tagsTemplate      String?       // Smart tags
  thumbnailPath     String?
  
  // Anti-ghosting
  reconnectAttempts Int           @default(0)
  maxReconnectAttempts Int       @default(10)
  reconnectDelay    Int           @default(5) // seconds
  healthCheckInterval Int        @default(30) // seconds
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([userId, status])
  @@index([accountId])
}

model Schedule {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  cronExpression  String   // Standard cron
  timezone        String   @default("UTC")
  startDate       DateTime?
  endDate         DateTime?
  maxDuration     Int?     // Hours
  isActive        Boolean  @default(true)
  streams         Stream[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model FxPreset {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  filterGraph     String   // FFmpeg filter_complex
  videoFilters    Json     // Structured video filters
  audioFilters    Json     // Structured audio filters
  intensity       FxIntensity @default(MEDIUM)
  isBuiltIn       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  streams         Stream[]
}

model Visualizer {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  type            VisualizerType // SPECTRUM, WAVEFORM, CIRCULAR, PARTICLES, CUSTOM
  config          Json     // Visualizer-specific configuration
  backgroundType  BackgroundType // COLOR, GRADIENT, IMAGE, VIDEO
  backgroundConfig Json
  width           Int      @default(1920)
  height          Int      @default(1080)
  fps             Int      @default(30)
  isBuiltIn       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model StreamLog {
  id          String   @id @default(cuid())
  streamId    String
  stream      Stream   @relation(fields: [streamId], references: [id], onDelete: Cascade)
  level       LogLevel
  message     String
  metadata    Json?
  createdAt   DateTime @default(now())
  
  @@index([streamId, createdAt])
}

enum SourceType { VIDEO_FILE PLAYLIST RTMP_PUSH WEBCAM VISUALIZER }
enum LoopMode { INFINITE ONCE COUNT }
enum Platform { YOUTUBE TWITCH FACEBOOK CUSTOM_RTMP }
enum StreamStatus { STOPPED STARTING LIVE ERROR RECONNECTING STOPPING }
enum AudioSource { VIDEO FILE NOISE MIX }
enum NoiseProfile { WHITE PINK BROWN BLUE VIOLET VELVET CUSTOM }
enum FxIntensity { LOW MEDIUM HIGH AGGRESSIVE }
enum VisualizerType { SPECTRUM WAVEFORM CIRCULAR PARTICLES CUSTOM }
enum BackgroundType { COLOR GRADIENT IMAGE VIDEO }
enum LogLevel { INFO WARN ERROR DEBUG }
```

### 1.3 Core Services

#### Encryption Service
- AES-256-GCM for refresh tokens
- Master key from environment variable

#### YouTube OAuth Service
- PKCE flow for browser-based auth
- Automatic token refresh (5 min buffer)
- Multi-account support with channel selection
- Handle 7-day expiry for Testing mode apps

#### FFmpeg Manager
- ffmpeg-static for zero-install binary
- Hardware acceleration detection (QSV, NVENC, AMF, VideoToolbox)
- Process pool management
- Health monitoring & auto-restart

---

## Phase 2: Streaming Engine & RTMP Server (Week 2-3)

### 2.1 Node-Media-Server Setup
```javascript
// RTMP Ingest Configuration
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './media'
  },
  relay: {
    ffmpeg: '/usr/bin/ffmpeg', // or ffmpeg-static path
    tasks: [] // Dynamically populated per stream
  },
  auth: {
    api: true,
    api_user: 'admin',
    api_pass: 'secure_password'
  }
};
```

### 2.2 Multi-Platform Relay (FFmpeg tee muxer)
```bash
# Single FFmpeg process pushes to multiple RTMP endpoints
ffmpeg -re -i <input> \
  -c:v libx264 -preset veryfast -b:v 4000k -maxrate 4000k -bufsize 8000k \
  -c:a aac -b:a 128k -ac 2 \
  -f tee -map 0:v -map 0:a \
  "[f=flv:onfail=ignore]rtmp://a.rtmp.youtube.com/live2/${YT_KEY}|[f=flv:onfail=ignore]rtmp://live-api-s.facebook.com:80/rtmp/${FB_KEY}|[f=flv:onfail=ignore]rtmp://live-rtmp.twitch.tv/app/${TWITCH_KEY}"
```

### 2.3 Stream Processor (FFmpeg Worker)
- Input: Video files, playlist, RTMP push, visualizer (canvas capture)
- Processing: Filter graph (FX, loop, crossfade, noise)
- Output: RTMP to NMS (local) → NMS relays to platforms
- Monitoring: Progress, bitrate, fps, dropped frames, reconnection

### 2.4 Smart Loop Implementation
```javascript
// FFmpeg filter for seamless looping with crossfade
const loopFilter = `
  [0:v]loop=loop=-1:size=${totalFrames}:start=0[vlooped];
  [0:a]aloop=loop=-1:size=${audioSamples}:start=0[alooped];
  [vlooped][alooped]concat=n=1:v=1:a=1[outv][outa]
`;

// Crossfade between playlist items
const crossfadeFilter = `
  [0:v][1:v]xfade=transition=fade:duration=2:offset=${duration1}[v1];
  [v1][2:v]xfade=transition=fade:duration=2:offset=${duration1+duration2-2}[v2];
  ...
  [0:a][1:a]acrossfade=d=2[a1];
  [a1][2:a]acrossfade=d=2[a2];
  ...
`;
```

### 2.5 Anti-Ghosting / Auto-Reconnect
```javascript
// FFmpeg reconnection options (placed BEFORE -i)
const reconnectOptions = [
  '-reconnect_at_eof', '1',
  '-reconnect_streamed', '1',
  '-reconnect_on_network_error', '1',
  '-reconnect_on_http_error', '1',
  '-reconnect_delay_max', '30',
  '-timeout', '30000000' // 30 seconds in microseconds
];

// Application-level health check
setInterval(async () => {
  const isHealthy = await checkStreamHealth(streamId);
  if (!isHealthy && stream.status === 'LIVE') {
    await triggerReconnect(streamId);
  }
}, 30000);
```

---

## Phase 3: YouTube Integration & Broadcast Management (Week 3-4)

### 3.1 YouTube Live Streaming API Wrapper
```typescript
class YouTubeLiveAPI {
  // Broadcast lifecycle
  async createBroadcast(params: CreateBroadcastParams): Promise<Broadcast>
  async bindBroadcast(broadcastId: string, streamId: string): Promise<void>
  async transitionBroadcast(broadcastId: string, status: 'testing' | 'live' | 'complete'): Promise<void>
  async updateBroadcast(broadcastId: string, params: UpdateBroadcastParams): Promise<void>
  async deleteBroadcast(broadcastId: string): Promise<void>
  
  // Stream management
  async createStream(params: CreateStreamParams): Promise<LiveStream>
  async listStreams(): Promise<LiveStream[]>
  async deleteStream(streamId: string): Promise<void>
  
  // Smart metadata
  async generateSmartMetadata(template: MetadataTemplate, context: StreamContext): Promise<Metadata>
}
```

### 3.2 Smart Scheduling & Duration Control
```typescript
interface ScheduleConfig {
  cronExpression: string;      // "0 20 * * *" = daily at 8 PM
  timezone: string;            // "Asia/Jakarta"
  maxDurationHours: number;    // 24 = max 24 hours
  autoStart: boolean;          // enableAutoStart
  autoStop: boolean;           // enableAutoStop
}

// Cron job with BullMQ for reliability
const scheduleJob = async (streamId: string) => {
  const stream = await getStream(streamId);
  const broadcast = await youtube.createBroadcast({
    title: renderTemplate(stream.titleTemplate, context),
    description: renderTemplate(stream.descriptionTemplate, context),
    tags: parseTags(renderTemplate(stream.tagsTemplate, context)),
    scheduledStartTime: new Date(),
    enableAutoStart: true,
    enableAutoStop: true,
    privacyStatus: 'public',
    latencyPreference: 'normal'
  });
  
  await youtube.bindBroadcast(broadcast.id, stream.rtmpStreamId);
  await startFFmpegStream(stream, broadcast);
  
  // Auto-stop after maxDuration
  if (stream.maxDuration) {
    setTimeout(() => stopStream(streamId), stream.maxDuration * 3600 * 1000);
  }
};
```

### 3.3 Smart Title, Tags, Description Generator
```typescript
interface MetadataTemplate {
  title: string;       // "🔴 LIVE: {date} | {playlistName} | #{randomTag}"
  description: string; // "Streaming {playlistName}...\n\n{hashtags}\n\n{links}"
  tags: string;        // "{genre}, {mood}, live, streaming, {date}, {randomTags}"
}

const variables = {
  date: () => new Date().toLocaleDateString('id-ID'),
  time: () => new Date().toLocaleTimeString('id-ID'),
  playlistName: (ctx) => ctx.playlist?.name,
  randomTag: () => trendingTags[Math.floor(Math.random() * trendingTags.length)],
  hashtags: (ctx) => generateHashtags(ctx),
  viewerCount: (ctx) => ctx.currentViewers || '0',
  streamNumber: (ctx) => ctx.streamCount
};
```

---

## Phase 4: Smart FX Engine (Week 4-5)

### 4.1 Video FX Filters (Re-upload Detection Avoidance)
Based on research from `yt_uniquifier` and fingerprinting analysis:

```typescript
interface VideoFxConfig {
  // Geometric transforms (break geometric fingerprinting)
  crop?: { percent: number; randomize: boolean };        // 1-4% zoom
  rotate?: { degrees: number; randomize: boolean };      // ±0.5°
  flip?: { horizontal: boolean; vertical: boolean };     // Mirror
  
  // Color transforms (break color histogram fingerprinting)
  colorJitter?: { 
    brightness: number;    // ±0.02
    contrast: number;      // ±0.02
    saturation: number;    // ±0.05
    gamma: number;         // ±0.05
    hue: number;           // ±2°
  };
  
  // Noise (break compression fingerprinting)
  noise?: {
    type: 'grain' | 'digital' | 'film';
    strength: number;      // 1-10
    temporal: boolean;     // Frame-varying
  };
  
  // Temporal (break temporal fingerprinting)
  frameJitter?: {
    enabled: boolean;
    dropRate: number;      // 0.1-1% frames
    blendRate: number;     // Frame blending
  };
  
  // Speed (break duration fingerprinting)
  speed?: { factor: number; pitchCorrection: boolean };  // 0.99-1.01
  
  // Invisible watermark (optional, for own content tracking)
  watermark?: {
    enabled: boolean;
    payload: string;       // Channel ID + timestamp
    strength: number;
  };
}

// Generate filter_complex
function buildVideoFilterGraph(config: VideoFxConfig): string {
  const filters = [];
  
  // Crop + rescale (maintain aspect)
  if (config.crop) {
    const p = config.crop.percent / 100;
    filters.push(`crop=iw*${1-p*2}:ih*${1-p*2}:iw*${p}:ih*${p},scale=1920:1080:flags=lanczos`);
  }
  
  // Color jitter
  if (config.colorJitter) {
    const { brightness, contrast, saturation, gamma } = config.colorJitter;
    filters.push(`eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}`);
  }
  
  // Noise
  if (config.noise) {
    filters.push(`noisealls=${config.noise.strength}:allf=${config.noise.temporal ? 't' : 'u'}`);
  }
  
  // Frame rate manipulation
  if (config.frameJitter?.enabled) {
    filters.push(`minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`);
  }
  
  // Speed
  if (config.speed) {
    filters.push(`setpts=${1/config.speed.factor}*PTS,atempo=${config.speed.factor}`);
  }
  
  return filters.join(',');
}
```

### 4.2 Audio FX Filters
```typescript
interface AudioFxConfig {
  // Noise overlay (multiple types)
  noise?: {
    type: 'white' | 'pink' | 'brown' | 'blue' | 'violet' | 'velvet';
    amplitude: number;     // 0.001-0.05
    mixLevel: number;      // -30dB to -10dB
  };
  
  // Spectral smear (break audio fingerprinting)
  spectralSmear?: {
    enabled: boolean;
    intensity: number;     // 0-1
  };
  
  // Pitch/Tempo (formant-preserving)
  pitchShift?: { semitones: number };  // ±0.5 semitones
  tempoShift?: { factor: number };      // 0.99-1.01
  
  // Dynamic range jitter
  compand?: { 
    attack: number; 
    release: number; 
    threshold: number; 
    ratio: number;
  };
  
  // Reverb/Haas (spatial variation)
  reverb?: { 
    roomSize: number; 
    damping: number; 
    wetLevel: number;
  };
  
  // Loudness normalization with jitter
  loudness?: { 
    target: number;    // -16 LUFS ±1
    jitter: number;    // ±0.5 LUFS
  };
}

// Generate audio filter graph
function buildAudioFilterGraph(config: AudioFxConfig): string {
  const filters = [];
  let inputLabel = '[0:a]';
  let outputLabel = 'aout';
  let filterIndex = 0;
  
  // Noise overlay
  if (config.noise) {
    const noiseSrc = `anoisesrc=c=${config.noise.type}:a=${config.noise.amplitude}[noise${filterIndex}]`;
    filters.push(noiseSrc);
    filters.push(`${inputLabel}[noise${filterIndex}]amix=inputs=2:weights=1 ${config.noise.mixLevel}[amixed${filterIndex}]`);
    inputLabel = `[amixed${filterIndex}]`;
    filterIndex++;
  }
  
  // Spectral smear (FFT-based)
  if (config.spectralSmear?.enabled) {
    filters.push(`${inputLabel}afftdn=nr=${config.spectralSmear.intensity * 20}:nf=-50[asmeared${filterIndex}]`);
    inputLabel = `[asmeared${filterIndex}]`;
    filterIndex++;
  }
  
  // Pitch/Tempo
  if (config.pitchShift || config.tempoShift) {
    const tempo = config.tempoShift?.factor || 1;
    const pitch = config.pitchShift?.semitones || 0;
    if (pitch !== 0) {
      filters.push(`${inputLabel}rubberband=pitch=${pitch}[apitch${filterIndex}]`);
      inputLabel = `[apitch${filterIndex}]`;
      filterIndex++;
    }
    if (tempo !== 1) {
      filters.push(`${inputLabel}atempo=${tempo}[atempo${filterIndex}]`);
      inputLabel = `[atempo${filterIndex}]`;
      filterIndex++;
    }
  }
  
  // Compand (dynamic range)
  if (config.compand) {
    filters.push(`${inputLabel}compand=attacks=${config.compand.attack}:decays=${config.compand.release}:points=-90/-90|-${config.compand.threshold}/-${config.compand.threshold * config.compand.ratio}|0/0[acomp${filterIndex}]`);
    inputLabel = `[acomp${filterIndex}]`;
    filterIndex++;
  }
  
  // Reverb
  if (config.reverb) {
    filters.push(`${inputLabel}aecho=0.8:0.9:1000:0.3[areverb${filterIndex}]`);
    inputLabel = `[areverb${filterIndex}]`;
    filterIndex++;
  }
  
  // Loudness
  if (config.loudness) {
    const target = config.loudness.target + (Math.random() - 0.5) * config.loudness.jitter * 2;
    filters.push(`${inputLabel}loudnorm=I=${target}:TP=-1.5:LRA=11:measured_I=-20:measured_TP=-1:measured_LRA=7:measured_thresh=-30:offset=0:linear=true:print_format=summary[aloud${filterIndex}]`);
    inputLabel = `[aloud${filterIndex}]`;
    filterIndex++;
  }
  
  filters.push(`${inputLabel}anull[${outputLabel}]`);
  
  return filters.join(';');
}
```

### 4.3 Built-in FX Presets
| Preset | Intensity | Use Case |
|--------|-----------|----------|
| `soft` | LOW | Own content re-upload, minimal quality loss |
| `balanced` | MEDIUM | General use, VMAF ≥ 92 |
| `aggressive` | HIGH | Maximum uniqueness, visible changes |
| `cid_aware` | MEDIUM | Content ID divergence calibrated |
| `cid_aggressive` | HIGH | Stronger shifts for strict detection |
| `music_stream` | MEDIUM | Audio-focused, preserves video quality |
| `gaming` | LOW | Minimal visual impact, audio noise only |

---

## Phase 5: Visualizer Engine (Week 5-6)

### 5.1 Visualizer Types (Canvas + Web Audio API → FFmpeg)

#### Option A: Server-side (Headless Chrome + Puppeteer)
- Renders visualizer in headless Chrome
- Captures canvas via CDP
- Pipes to FFmpeg
- Pros: Full browser APIs, complex visualizers
- Cons: Heavy, one Chrome per stream

#### Option B: FFmpeg Native Filters (Recommended)
```bash
# Spectrum visualizer
ffmpeg -i audio.mp3 -filter_complex \
"[0:a]showspectrum=mode=combined:color=rainbow:scale=log:saturation=1[bg]; \
 [0:a]showwaves=mode=cline:rate=30:colors=white[waves]; \
 [bg][waves]overlay[out]" \
-map "[out]" -map 0:a -c:v libx264 -c:a aac -f flv rtmp://localhost/live/stream

# Multiple visualizer types:
# showspectrum, showwaves, showfreqs, showcqt, avectorscope, astats
```

#### Option C: WebGL/Canvas → MediaRecorder → FFmpeg
- Browser renders visualizer
- MediaRecorder captures canvas stream
- WebRTC/WHIP to media server
- Pros: Rich visualizers, GPU accelerated
- Cons: Browser required

### 5.2 Implementation: Hybrid Approach
1. **Built-in visualizers**: FFmpeg native filters (lightweight, no browser)
2. **Advanced visualizers**: Pre-rendered video loops + audio reactive shaders
3. **Custom visualizers**: User provides WebM/MP4 background + FFmpeg overlay

```typescript
interface VisualizerConfig {
  type: 'spectrum_bars' | 'waveform' | 'circular' | 'particles' | 'custom';
  
  // Spectrum Bars
  bars?: {
    count: number;           // 64-256
    spacing: number;
    width: number;
    height: number;
    colors: string[];        // Gradient stops
    mirror: boolean;
    peakHold: boolean;
    smoothing: number;       // 0-1
  };
  
  // Waveform
  waveform?: {
    style: 'line' | 'filled' | 'mirror';
    thickness: number;
    color: string;
    glow: boolean;
  };
  
  // Circular
  circular?: {
    radius: number;
    bars: number;
    rotationSpeed: number;
    bassPulse: boolean;
  };
  
  // Particles
  particles?: {
    count: number;
    bassSize: boolean;
    trebleVelocity: boolean;
    midColor: boolean;
  };
  
  // Background
  background: {
    type: 'color' | 'gradient' | 'image' | 'video';
    config: any;
  };
  
  // Audio analysis
  fftSize: 2048 | 4096 | 8192;
  frequencyRange: [number, number]; // [20, 20000]
  smoothingTimeConstant: number;    // 0-1
}

// Generate FFmpeg filter for visualizer
function buildVisualizerFilter(config: VisualizerConfig, audioInput: string): string {
  switch (config.type) {
    case 'spectrum_bars':
      return `${audioInput}showspectrum=mode=separate:color=${config.bars.colors.join('|')}:scale=log:saturation=1:s=${config.width}x${config.height}[viz]`;
    case 'waveform':
      return `${audioInput}showwaves=mode=${config.waveform.style}:rate=${config.fps}:colors=${config.waveform.color}:s=${config.width}x${config.height}[viz]`;
    case 'circular':
      return `${audioInput}showcqt=size=${config.width}x${config.height}:rate=${config.fps}:count=${config.circular.bars}[viz]`;
    case 'custom':
      // Overlay custom video background
      return `[bg][0:a]amix=inputs=2[aout];[bg]format=yuv420p[viz]`;
  }
}
```

---

## Phase 6: Frontend Application (Week 6-7)

### 6.1 Pages & Components
```
/ (Dashboard)
  ├─ /accounts          # YouTube account management
  ├─ /streams           # Stream list & creation
  │   ├─ /streams/new   # Stream wizard
  │   └─ /streams/:id   # Stream detail & control
  ├─ /schedules         # Scheduling calendar
  ├─ /fx-presets        # FX preset library & editor
  ├─ /visualizers       # Visualizer library & editor
  ├─ /analytics         # Stream analytics & logs
  └─ /settings          # App settings
```

### 6.2 Key Components
- **StreamWizard**: Multi-step form (Source → FX → Output → Schedule → Metadata)
- **StreamCard**: Real-time status, controls, preview
- **FxPresetEditor**: Visual filter graph builder
- **VisualizerEditor**: Live preview with audio file upload
- **ScheduleCalendar**: Drag-drop cron builder
- **MetadataTemplateEditor**: Variable picker + preview
- **LogViewer**: Real-time streaming logs with filters
- **MultiStreamMonitor**: Grid view of all active streams

### 6.3 Real-time Updates
```typescript
// Socket.io events
socket.on('stream:status', (data) => updateStreamStatus(data));
socket.on('stream:stats', (data) => updateStreamStats(data));
socket.on('stream:log', (data) => appendLog(data));
socket.on('stream:error', (data) => showError(data));
```

---

## Phase 7: Docker & Production (Week 7-8)

### 7.1 Dockerfile
```dockerfile
FROM node:20-alpine

# Install FFmpeg with hardware acceleration support
RUN apk add --no-cache \
    ffmpeg \
    v4l-utils \
    mesa-dri-gallium \
    intel-media-driver \
    nvidia-container-toolkit

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

# Copy source
COPY . .

# Build frontend
RUN pnpm run build

# Expose ports
EXPOSE 3000 1935 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]
```

### 7.2 Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "1935:1935"
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/db.sqlite
      - REDIS_URL=redis://redis:6379
      - MASTER_KEY=${MASTER_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}
    volumes:
      - ./data:/app/data
      - ./videos:/app/videos:ro
      - ./logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### 7.3 GPU Support (Optional)
```yaml
# docker-compose.gpu.yml
services:
  app:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu, video, utility]
    environment:
      - FFMPEG_HWACCEL=nvenc
      - NVIDIA_VISIBLE_DEVICES=all
```

---

## Phase 8: Advanced Features (Week 8+)

### 8.1 Multi-Source Input Handling
- Video file playlist with crossfade
- RTMP push ingest (OBS → App)
- Webcam / capture card (V4L2)
- Screen capture (Chrome Extension + WebRTC → WHIP)
- Visualizer as source

### 8.2 Stream Health Monitoring
- Bitrate monitoring (target vs actual)
- Frame drop detection
- Reconnection history
- Bandwidth testing
- Alerting (Webhook, Email, Discord)

### 8.3 Analytics Dashboard
- Viewer retention (via YouTube API)
- Stream uptime/downtime
- Quality metrics (VMAF if reference available)
- Platform-specific stats

### 8.4 Plugin System
- Custom FX transforms (TypeScript plugins)
- Custom visualizers (React components)
- Webhook integrations

---

## API Endpoints

### Authentication
```
POST   /api/auth/youtube/url          # Get OAuth URL
POST   /api/auth/youtube/callback     # Handle OAuth callback
GET    /api/auth/youtube/accounts     # List connected accounts
DELETE /api/auth/youtube/accounts/:id # Disconnect account
POST   /api/auth/youtube/refresh      # Force token refresh
```

### Streams
```
GET    /api/streams                   # List streams
POST   /api/streams                   # Create stream
GET    /api/streams/:id               # Get stream detail
PATCH  /api/streams/:id               # Update stream
DELETE /api/streams/:id               # Delete stream
POST   /api/streams/:id/start         # Start stream
POST   /api/streams/:id/stop          # Stop stream
POST   /api/streams/:id/restart       # Restart stream
GET    /api/streams/:id/status        # Real-time status
GET    /api/streams/:id/logs          # Stream logs
GET    /api/streams/:id/preview       # Preview stream (HLS/WebRTC)
```

### Schedules
```
GET    /api/schedules                 # List schedules
POST   /api/schedules                 # Create schedule
PATCH  /api/schedules/:id             # Update schedule
DELETE /api/schedules/:id             # Delete schedule
POST   /api/schedules/:id/toggle      # Enable/disable
```

### FX Presets
```
GET    /api/fx-presets                # List presets
POST   /api/fx-presets                # Create preset
GET    /api/fx-presets/:id            # Get preset
PATCH  /api/fx-presets/:id            # Update preset
DELETE /api/fx-presets/:id            # Delete preset
POST   /api/fx-presets/:id/test       # Test preset on sample
```

### Visualizers
```
GET    /api/visualizers               # List visualizers
POST   /api/visualizers               # Create visualizer
GET    /api/visualizers/:id           # Get visualizer
PATCH  /api/visualizers/:id           # Update visualizer
DELETE /api/visualizers/:id           # Delete visualizer
GET    /api/visualizers/:id/preview   # Preview visualizer
```

### YouTube Broadcasts
```
POST   /api/youtube/broadcasts        # Create broadcast
GET    /api/youtube/broadcasts        # List broadcasts
GET    /api/youtube/broadcasts/:id    # Get broadcast
PATCH  /api/youtube/broadcasts/:id    # Update broadcast
POST   /api/youtube/broadcasts/:id/transition # Transition status
```

---

## Security Considerations

1. **Token Encryption**: AES-256-GCM for all OAuth tokens at rest
2. **HTTPS Only**: Enforce TLS in production
3. **Rate Limiting**: API rate limits per user
4. **Input Validation**: Zod schemas for all inputs
5. **CORS**: Restricted to configured origins
6. **Secrets**: Environment variables only, never in code
7. **Audit Logs**: All stream actions logged

---

## Testing Strategy

### Unit Tests
- FX filter graph generation
- Metadata template rendering
- Schedule cron parsing
- Token refresh logic

### Integration Tests
- YouTube API flow (mocked)
- FFmpeg process management
- RTMP relay configuration
- Database operations

### E2E Tests (Playwright)
- Account connection flow
- Stream creation wizard
- Start/stop stream
- Schedule creation
- FX preset application

### Load Testing
- 10 concurrent streams
- 24-hour stability test
- Network interruption recovery
- Memory leak detection

---

## Deployment Checklist

- [ ] Google Cloud Project with YouTube Data API v3 enabled
- [ ] OAuth Consent Screen configured (External, Test users added)
- [ ] OAuth Client ID (Desktop App type)
- [ ] Domain + SSL Certificate (Let's Encrypt / Cloudflare)
- [ ] VPS with Docker (4GB RAM minimum, 2 vCPU)
- [ ] Redis instance (local or managed)
- [ ] Environment variables configured
- [ ] Backup strategy for SQLite + tokens
- [ ] Monitoring (Uptime Kuma / Prometheus + Grafana)
- [ ] Log aggregation (Loki / ELK)

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Foundation | 2 weeks | Project setup, DB, Auth, Core services |
| 2. Streaming Engine | 2 weeks | NMS + FFmpeg worker, Multi-platform relay |
| 3. YouTube Integration | 2 weeks | Broadcast mgmt, Scheduling, Smart metadata |
| 4. FX Engine | 2 weeks | Video/Audio FX, Presets, Uniqueness |
| 5. Visualizer Engine | 2 weeks | Built-in visualizers, Custom support |
| 6. Frontend | 2 weeks | Dashboard, Stream wizard, Monitoring |
| 7. Docker & Production | 1 week | Dockerfile, Compose, GPU support |
| 8. Advanced Features | Ongoing | Analytics, Plugins, Multi-source |

**Total: ~13 weeks for MVP + Advanced**

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| YouTube API quota limits | High | High | Implement quota tracking, batch requests |
| FFmpeg hardware accel compatibility | Medium | Medium | Fallback to software encoding, detect at startup |
| OAuth token expiry (7-day testing) | High | Medium | Auto-refresh, user notification, production verification |
| RTMP connection instability | High | High | Multi-layer reconnection (FFmpeg + App + NMS) |
| Browser memory leaks (visualizers) | Medium | Medium | Offload to FFmpeg, limit concurrent |
| Copyright/Content ID issues | Low | Critical | Clear disclaimer, user responsibility, CID-aware presets |

---

## User Requirements Summary

| Requirement | Decision |
|-------------|----------|
| **Target Platforms** | YouTube + Custom RTMP |
| **Visualizers** | Hybrid (FFmpeg-native built-in + browser-based advanced) |
| **Hardware** | GPU-enabled (NVIDIA NVENC / Intel QSV) |
| **Initial Scale** | 1-3 concurrent streams |
| **Content Type** | Music / Audio-reactive (24/7 streams, visualizers critical) |

---

## Adjusted Architecture for Requirements

### Hardware Acceleration Priority
```typescript
// FFmpeg encoder selection priority
const encoderPriority = [
  { name: 'h264_nvenc', hwaccel: 'cuda', vendor: 'nvidia' },      // NVIDIA NVENC
  { name: 'h264_qsv', hwaccel: 'qsv', vendor: 'intel' },           // Intel Quick Sync
  { name: 'h264_videotoolbox', hwaccel: 'videotoolbox', vendor: 'apple' }, // macOS
  { name: 'h264_amf', hwaccel: 'amf', vendor: 'amd' },             // AMD AMF
  { name: 'libx264', hwaccel: 'none', vendor: 'cpu' }              // Software fallback
];
```

### Visualizer Strategy (Hybrid)
1. **Built-in (FFmpeg-native)**: Spectrum bars, Waveform, Circular - zero overhead
2. **Advanced (Browser)**: Custom shaders, particles - via headless Chrome pool (1 per 2 streams)
3. **User Custom**: Upload WebM/MP4 background + audio-reactive overlay

### Music Streaming Optimizations
- Audio-first filter graphs (visualizer driven by audio analysis)
- Loudness normalization (EBU R128) with per-stream jitter
- Seamless crossfade between tracks (2-5 seconds)
- Smart playlist shuffle with history avoidance
- Background noise layer (pink/brown) for fingerprint uniqueness

---

## Detailed Technical Specifications

### 1. FFmpeg Filter Graph Architecture (Music-Optimized)

#### Video Pipeline (Visualizer-Driven)
```
[Audio Input] → [FFT Analysis] → [Visualizer Filter] → [Video Output]
                    ↓
            [FX Filters] → [Encoded Video]
```

**Built-in Visualizer Filters (FFmpeg Native):**
```bash
# Spectrum Bars (Logarithmic, Color Gradient)
[0:a]showspectrum=mode=combined:color=rainbow:scale=log:saturation=1:size=1920x1080:rate=30[viz]

# Waveform (Oscilloscope style)
[0:a]showwaves=mode=cline:rate=30:colors=0x00ff00|0x00ffff:size=1920x1080[viz]

# Circular Spectrum (CQT)
[0:a]showcqt=size=1920x1080:rate=30:count=120:fcount=200:cscheme=rainbow[viz]

# Combined: Spectrum + Waveform Overlay
[0:a]showspectrum=mode=separate:color=rainbow:scale=log:size=1920x540:rate=30[spec];
[0:a]showwaves=mode=line:colors=white:size=1920x540:rate=30[wave];
[spec][wave]vstack[viz]
```

#### Audio Pipeline (Fingerprint Avoidance)
```
[Video Audio] → [Crossfade] → [Noise Overlay] → [Spectral Smear] 
                → [Pitch/Tempo Jitter] → [Compand] → [Loudnorm] → [Output]
[Background Music] ────────────────────────────────────────────────→ [Amix]
```

### 2. Smart Loop with Crossfade (Playlist)

```typescript
// For N videos, generate filter graph:
const filterGraph = `
  # Video crossfade chain
  [0:v][1:v]xfade=transition=fade:duration=3:offset=${d0}[v01];
  [v01][2:v]xfade=transition=fade:duration=3:offset=${d0+d1-3}[v02];
  ...
  
  # Audio crossfade chain
  [0:a][1:a]acrossfade=d=3[a01];
  [a01][2:a]acrossfade=d=3[a02];
  ...
  
  # Loop infinitely
  [v_final]loop=loop=-1:size=${totalFrames}[vlooped];
  [a_final]aloop=loop=-1:size=${totalSamples}[alooped];
`;

// Shuffle with history avoidance (last 20% not repeated)
function smartShuffle<T>(array: T[], historySize: number): T[] {
  const result = [...array];
  const history = new Set<T>();
  
  for (let i = result.length - 1; i > 0; i--) {
    // Don't pick from recent history
    const validIndices = Array.from({length: i + 1}, (_, k) => k)
      .filter(k => !history.has(result[k]));
    
    if (validIndices.length === 0) break;
    
    const j = validIndices[Math.floor(Math.random() * validIndices.length)];
    [result[i], result[j]] = [result[j], result[i]];
    
    if (history.size >= historySize) {
      history.delete(result[i]); // oldest
    }
    history.add(result[i]);
  }
  
  return result;
}
```

### 3. Anti-Ghosting / Auto-Reconnect (Multi-Layer)

```typescript
// Layer 1: FFmpeg Native (fastest, <1s)
const ffmpegReconnectOpts = [
  '-reconnect_at_eof', '1',
  '-reconnect_streamed', '1',
  '-reconnect_on_network_error', '1',
  '-reconnect_on_http_error', '1',
  '-reconnect_delay_max', '5',
  '-timeout', '10000000',  // 10s TCP timeout
];

// Layer 2: Application Health Check (every 15s)
interface HealthCheck {
  checkFFmpegProcess: () => boolean;        // Process alive?
  checkOutputBitrate: () => boolean;        // Bitrate > threshold?
  checkFrameDrops: () => boolean;           // Drop rate < 5%?
  checkRTMPConnection: () => boolean;       // TCP connected?
  checkYouTubeStatus: () => boolean;        // Broadcast live?
}

// Layer 3: Full Restart with Backoff
async function restartWithBackoff(streamId: string, attempt: number) {
  const delay = Math.min(5 * Math.pow(2, attempt), 300); // 5s, 10s, 20s... max 5min
  await sleep(delay * 1000);
  await stopStream(streamId);
  await startStream(streamId);
}
```

### 4. YouTube Broadcast Management (Smart Scheduling)

```typescript
// Schedule triggers broadcast creation + stream start
interface ScheduledStreamJob {
  streamId: string;
  scheduledStart: Date;
  maxDurationHours: number;
  cronExpression: string;
  
  // Auto-generated metadata
  title: string;       // "🎵 Chill Vibes 24/7 • {date} • #{random}"
  description: string; // Template with hashtags, links
  tags: string[];      // Generated from genre/mood
  thumbnail: string;   // Auto-generated or uploaded
}

// YouTube API Flow:
async function createAndStartBroadcast(stream: Stream) {
  // 1. Create/Reuse LiveStream (ingestion endpoint)
  const liveStream = await youtube.liveStreams.insert({
    snippet: { title: `${stream.name} Stream` },
    cdn: { 
      format: '1080p', 
      ingestionType: 'rtmp',
      resolution: stream.resolution,
      frameRate: `${stream.fps}fps`,
      bitrateRange: `${stream.videoBitrate}-${stream.videoBitrate * 2}`
    }
  });
  
  // 2. Create Broadcast with auto-start/stop
  const broadcast = await youtube.liveBroadcasts.insert({
    snippet: {
      title: renderTemplate(stream.titleTemplate, context),
      description: renderTemplate(stream.descriptionTemplate, context),
      scheduledStartTime: new Date().toISOString(),
      categoryId: '10' // Music
    },
    status: { privacyStatus: 'public' },
    contentDetails: {
      enableAutoStart: true,
      enableAutoStop: true,
      enableDvr: true,
      enableEmbed: true,
      recordFromStart: true,
      latencyPreference: 'normal'
    }
  });
  
  // 3. Bind broadcast to stream
  await youtube.liveBroadcasts.bind({
    id: broadcast.id,
    streamId: liveStream.id
  });
  
  // 4. Start FFmpeg → RTMP to liveStream.cdn.ingestionInfo.ingestionAddress
  await startFFmpeg(stream, liveStream.cdn.ingestionInfo);
  
  // 5. Schedule auto-stop
  if (stream.maxDuration) {
    setTimeout(() => stopStream(stream.id), stream.maxDuration * 3600 * 1000);
  }
}
```

### 5. Smart Metadata Generation

```typescript
const metadataTemplates = {
  music247: {
    title: [
      "🎵 {genre} Radio 24/7 • Live Now • {date}",
      "🔴 LIVE: {mood} {genre} Mix • {time} • #{randomTag}",
      "🎧 {genre} Vibes • Streaming since {startTime} • {viewers} listeners"
    ],
    description: `🎵 Welcome to {channelName}!
    
Now Playing: {currentTrack}
Genre: {genre} | Mood: {mood}
    
🎧 Listen 24/7 - No ads, no interruptions
🔔 Subscribe for more: {channelUrl}
💬 Chat with us: {chatUrl}
    
#{hashtags}
    
#Music #LiveStream #247 #Radio #{genreTags}`,
    tags: [
      '{genre}', '{mood}', 'live', 'streaming', '24/7', 'radio',
      'music', '{date}', '#{randomMusicTags}'
    ]
  },
  playlist: {
    title: "📻 {playlistName} • {videoIndex}/{totalVideos} • {date}",
    description: "Playlist: {playlistName}\nNow: {currentVideo}\n\n#{hashtags}",
    tags: ['playlist', '{genre}', '{mood}', 'music']
  }
};

function renderTemplate(template: string, context: StreamContext): string {
  // Support: {var}, #{randomTag}, #{hashtags}, conditional {?var:value}
  return template
    .replace(/{date}/g, context.date)
    .replace(/{time}/g, context.time)
    .replace(/{randomTag}/g, () => randomTag())
    .replace(/{hashtags}/g, () => generateHashtags(context))
    // ... more replacements
    .replace(/{#(\w+)}/g, (_, tagSet) => randomFromSet(tagSets[tagSet]));
}
```

### 6. FX Engine Presets (Music-Optimized)

```typescript
const builtInFxPresets = {
  // Minimal - Own content re-upload
  soft: {
    video: { crop: { percent: 1, randomize: true } },
    audio: { noise: { type: 'pink', amplitude: 0.005, mixLevel: -30 } },
    intensity: 'LOW'
  },
  
  // Balanced - General music streaming
  balanced: {
    video: { 
      crop: { percent: 2, randomize: true },
      colorJitter: { brightness: 0.01, contrast: 0.01, saturation: 0.02, gamma: 0.02, hue: 1 }
    },
    audio: { 
      noise: { type: 'brown', amplitude: 0.01, mixLevel: -25 },
      loudness: { target: -16, jitter: 0.5 }
    },
    intensity: 'MEDIUM'
  },
  
  // Aggressive - Maximum uniqueness
  aggressive: {
    video: {
      crop: { percent: 3, randomize: true },
      rotate: { degrees: 0.3, randomize: true },
      colorJitter: { brightness: 0.02, contrast: 0.02, saturation: 0.05, gamma: 0.05, hue: 2 },
      noise: { type: 'film', strength: 5, temporal: true },
      speed: { factor: 1.005, pitchCorrection: true }
    },
    audio: {
      noise: { type: 'pink', amplitude: 0.02, mixLevel: -20 },
      spectralSmear: { enabled: true, intensity: 0.3 },
      pitchShift: { semitones: 0.2 },
      tempoShift: { factor: 1.005 },
      loudness: { target: -16, jitter: 1 }
    },
    intensity: 'HIGH'
  },
  
  // Content ID Aware - Calibrated for YouTube CID
  cidAware: {
    video: {
      crop: { percent: 2, randomize: false },
      colorJitter: { brightness: 0.015, contrast: 0.015, saturation: 0.03, gamma: 0.03 },
      frameJitter: { enabled: true, dropRate: 0.001, blendRate: 0.5 }
    },
    audio: {
      spectralSmear: { enabled: true, intensity: 0.2 },
      compand: { attack: 5, release: 50, threshold: -20, ratio: 2 },
      loudness: { target: -14, jitter: 0.3 }
    },
    intensity: 'MEDIUM'
  }
};
```

### 7. Visualizer Configurations (Music Presets)

```typescript
const musicVisualizers = {
  // Spectrum Bars - Classic music visualizer
  spectrumBars: {
    type: 'SPECTRUM_BARS',
    config: {
      bars: { count: 128, spacing: 2, width: 8, height: 800, 
              colors: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'],
              mirror: true, peakHold: true, smoothing: 0.8 },
      fftSize: 4096,
      frequencyRange: [20, 20000],
      smoothingTimeConstant: 0.8
    }
  },
  
  // Waveform - Oscilloscope
  waveform: {
    type: 'WAVEFORM',
    config: {
      waveform: { style: 'mirror', thickness: 2, color: '#00ff00', glow: true },
      fftSize: 2048,
      frequencyRange: [20, 20000],
      smoothingTimeConstant: 0.3
    }
  },
  
  // Circular - Radial spectrum
  circular: {
    type: 'CIRCULAR',
    config: {
      circular: { radius: 400, bars: 180, rotationSpeed: 0.5, bassPulse: true },
      fftSize: 4096,
      frequencyRange: [20, 20000],
      smoothingTimeConstant: 0.6
    }
  },
  
  // Dual Spectrum + Waveform (Best for music)
  dualView: {
    type: 'CUSTOM',
    config: {
      // Custom FFmpeg filter combining both
      customFilter: `
        [0:a]showspectrum=mode=separate:color=rainbow:scale=log:size=1920x720:rate=30[spec];
        [0:a]showwaves=mode=cline:colors=white:size=1920x360:rate=30[wave];
        [spec][wave]vstack[viz]
      `
    }
  }
};
```

### 8. Database Schema (Prisma) - Optimized for Music

```prisma
model Stream {
  // ... existing fields
  
  // Music-specific
  genre           String?     // electronic, lofi, chill, ambient, etc.
  mood            String?     // relaxing, energetic, focus, sleep
  playlistData    Json?       // { tracks: [{title, artist, duration, url}], currentIndex }
  shuffleHistory  String[]    // Recently played track IDs (avoid repeats)
  
  // Visualizer
  visualizerId    String?
  visualizer      Visualizer? @relation(fields: [visualizerId], references: [id])
  
  @@index([userId, status, genre])
}

model Track {
  id          String   @id @default(cuid())
  streamId    String
  stream      Stream   @relation(fields: [streamId], references: [id], onDelete: Cascade)
  title       String
  artist      String
  duration    Int      // seconds
  url         String   // Local path or URL
  order       Int
  playCount   Int      @default(0)
  lastPlayed  DateTime?
  createdAt   DateTime @default(now())
  
  @@index([streamId, order])
}
```

### 9. Docker Configuration (GPU-Enabled)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - TARGETARCH=${TARGETARCH}
    ports:
      - "3000:3000"   # Web UI
      - "1935:1935"   # RTMP Ingest
      - "8000:8000"   # HTTP-FLV/HLS
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/db.sqlite
      - REDIS_URL=redis://redis:6379
      - MASTER_KEY=${MASTER_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}
      # FFmpeg Hardware Acceleration
      - FFMPEG_HWACCEL=auto        # auto-detect: nvenc, qsv, videotoolbox, amf
      - FFMPEG_NVENC_PRESET=p4     # NVENC preset (p1-p7, p4=balanced)
      - FFMPEG_QSV_PRESET=medium   # QSV preset
    volumes:
      - ./data:/app/data
      - ./videos:/app/videos:ro
      - ./music:/app/music:ro
      - ./logs:/app/logs
      - /tmp:/tmp  # For FFmpeg temp files
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu, video, utility]
            - driver: intel
              count: 1
              capabilities: [video]
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Optional: Prometheus + Grafana for monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  redis_data:
  prometheus_data:
  grafana_data:
```

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    v4l-utils \
    mesa-dri-gallium \
    intel-media-driver \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# NVIDIA Container Toolkit (for NVENC)
ENV NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,video,utility

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
COPY packages/client ./packages/client

# Build shared first
RUN pnpm --filter=@stream-engine/shared build

# Build server
RUN pnpm --filter=server build

# Build client
RUN pnpm --filter=client build

# Clean dev dependencies
RUN pnpm prune --prod

# Runtime stage
FROM node:20-alpine AS runtime

# Runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    v4l-utils \
    mesa-dri-gallium \
    intel-media-driver \
    tini \
    && rm -rf /var/cache/apk/*

ENV NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,video,utility \
    NODE_ENV=production

WORKDIR /app

# Copy built artifacts
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/server/dist ./packages/server/dist
COPY --from=base /app/packages/client/dist ./packages/client/dist
COPY --from=base /app/package.json ./

# Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000 1935 8000

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/server/dist/index.js"]
```

---

## Implementation Phases (Adjusted)

| Phase | Duration | Focus |
|-------|----------|-------|
| **1. Foundation** | 2 weeks | Monorepo, DB, Auth, Config, Types |
| **2. Streaming Core** | 2 weeks | NMS, FFmpeg Worker, RTMP Relay, Health Checks |
| **3. YouTube + Scheduling** | 2 weeks | Broadcast API, Smart Scheduling, Metadata Templates |
| **4. FX Engine** | 2 weeks | Video/Audio Filters, Presets, CID-Aware |
| **5. Visualizers** | 2 weeks | FFmpeg-native + Browser pool, Music presets |
| **6. Frontend** | 2 weeks | Dashboard, Stream Wizard, Music Library, Visualizer Editor |
| **7. Docker + GPU** | 1 week | Multi-arch Docker, NVENC/QSV, Monitoring |
| **8. Polish** | 1 week | Tests, Docs, CI/CD, Examples |

---

## Next Steps (Ready to Execute)

### Immediate (This Session):
1. **Google Cloud Setup** - Create project, enable YouTube Data API v3, OAuth consent, Desktop client
2. **Environment Variables** - Create `.env.example` with all required vars
3. **Initialize Monorepo** - pnpm workspace with shared/server/client packages

### Phase 1 Start:
4. **Database Schema** - Prisma with music-optimized models
5. **Auth Service** - PKCE OAuth, token encryption, auto-refresh
6. **Config System** - Zod-validated config with hardware detection
7. **Core Types** - Already defined in shared package

---

## Questions Before Starting Code

1. **Google Cloud**: Do you have a project ready, or need guidance on setup?
2. **VPS/Server**: Do you have a GPU-enabled server (NVIDIA/Intel), or start local?
3. **Music Library**: Local files, or also YouTube/SoundCloud URLs (via yt-dlp)?
4. **Domain/SSL**: For production OAuth redirect, need domain + cert (or use localhost for dev)?
5. **Monitoring**: Want Prometheus/Grafana included from start?

---

## Questions for Clarification

Before starting implementation, I need your input on:

1. **Target Platform Priority**: YouTube first, then Twitch/Facebook? Or all simultaneously?
2. **Visualizer Complexity**: FFmpeg-native (lightweight) vs Browser-based (richer)?
3. **Hardware**: Will this run on CPU-only VPS, or GPU-enabled (NVENC/QSV)?
4. **Scale**: How many concurrent streams initially? (5, 10, 50+)
5. **Content Type**: Music, gaming, talk shows, 24/7 loops?
6. **Budget**: VPS specs preference? Managed services vs self-hosted?
7. **Compliance**: Is this for your own content only, or re-uploading others' content?