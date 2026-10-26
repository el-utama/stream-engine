# YouTube Smart Streaming Engine

> A lightweight, web-based smart streaming engine for YouTube and multi-platform streaming with smart FX engine, visualizers, scheduling, and VMAF quality testing - all without installation (runs in browser) with optional Docker support.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black.svg)](https://www.fastify.io/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-6.x-orange.svg)](https://ffmpeg.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🎬 Streaming Engine
- **Multi-source input**: Video files, playlists, RTMP push (OBS), webcam, visualizer-only
- **Smart looping**: Infinite, once, count-based with shuffle and crossfade
- **Multi-platform output**: YouTube, Twitch, Facebook, Custom RTMP simultaneously
- **FFmpeg tee muxer**: Single process pushes to multiple RTMP endpoints
- **Hardware acceleration**: Auto-detect QSV (Intel), NVENC (NVIDIA), AMF (AMD), VideoToolbox (Apple Silicon)
- **Health monitoring**: Auto-reconnect, bitrate/FPS tracking, uptime tracking

### 🎨 Smart FX Engine (Phase 4)
- **VMAF Quality Testing**: Built-in libvmaf integration for objective quality assessment
- **Custom Filter Chains**: Export/import/duplicate/diff filter configurations
- **Built-in Presets**: soft, balanced, aggressive, cid_aware, cid_aggressive, music_stream, gaming
- **Visual Filters**: crop/jitter, color jitter, noise overlay, speed jitter, watermark, letterbox
- **Audio Filters**: pink/white noise, loudness normalization, high/low pass, dynamic range
- **Preset Versioning**: Track changes with version history and tags

### 📊 Visualizers (Built-in)
- **Spectrum Bars**: FFT frequency visualization with configurable smoothing
- **Waveform**: Mirror/line waveform with glow effects
- **Circular**: Radial frequency display
- **Dual View**: Combined spectrum + waveform
- **Minimal**: Clean single-line display

### 🤖 Automation & Scheduling
- **Cron-based scheduling**: Full cron expression support with timezone
- **Smart metadata templates**: Variables for title, description, tags (date, stream name, random, etc.)
- **Auto-restart**: Configurable reconnect with exponential backoff
- **Max duration limits**: Per-stream or per-schedule

### 🔐 Multi-Account YouTube Integration
- **Google OAuth 2.0 (PKCE)**: Browser-based auth flow
- **Refresh token rotation**: AES-256-GCM encrypted storage
- **Multi-channel support**: Manage multiple YouTube channels per user
- **Auto token refresh**: 5-minute buffer before expiry

---

## 🎯 Tujuan Pembuatan Repo Ini

**Mengapa repo ini dibuat?**

Sebagai creator/streamer yang ingin menjalankan **stream 24/7 otomatis** ke YouTube (dan platform lain) tanpa harus:
- Menyala laptop/PC 24 jam
- Manual klik "Go Live" setiap hari
- Repot atur OBS + atur jadwal manual
- Khawatir stream putus di tengah malam

**Target utama:**
1. **Stream 24/7 "set and forget"** - Buat jadwal sekali, jalan otomatis bulan-bulan
2. **Anti-Content ID / Anti-Ghosting** - Filter video/audio otomatis biar aman dari claim
3. **Multi-platform sekaligus** - Satu stream, langsung ke YouTube + Twitch + Facebook + Custom RTMP
4. **Tanpa install software berat** - Cukup buka browser, sudah bisa atur semua (OBS opsional untuk push RTMP)
5. **Quality control otomatis** - VMAF testing biar tahu filter yang dipake tidak merusak kualitas video

**Use case nyata:**
- Radio musik 24/7 dengan visualizer audio-reactive
- Re-stream konten evergreen (podcast, kuliah, webinar) berulang
- Backup stream otomatis ke platform kedua
- Jual jasa "managed streaming" ke client tanpa perlu server sendiri

---

## 📈 Progres Saat Ini

### ✅ **Sudah Selesai (Production Ready)**

| Fase | Komponen | Status | Catatan |
|------|----------|--------|---------|
| **Phase 1** | Foundation: Monorepo, TypeScript, Prisma, SQLite, Fastify | ✅ | Base solid |
| **Phase 2** | Streaming Engine: FFmpeg + Node-Media-Server, tee muxer | ✅ | Multi-target streaming work |
| **Phase 2.5** | YouTube OAuth PKCE, Multi-account, Encryption AES-256-GCM | ✅ | Auth production-ready |
| **Phase 3** | Scheduling (BullMQ v6), Smart Metadata Templates, YouTube Broadcast API | ✅ | Cron + auto-stop work |
| **Phase 4 Week 1** | **VMAF Quality Testing** (libvmaf), **Custom Filter Chains** (export/import/duplicate/diff), **Tee Muxer Direct** (bypass NMS relay) | ✅ | Core FX Engine done |

### 🔧 **Built-in Presets Tersedia (7 preset)**
| Preset | Cocok Untuk | VMAF Est. | Intensitas |
|--------|-------------|-----------|------------|
| `soft` | Minimal processing, archival | 98+ | LOW |
| `balanced` | General purpose, daily driver | 95+ | MEDIUM |
| `aggressive` | Max anti-ghosting | 90+ | HIGH |
| `cid_aware` | Content ID evasion moderat | 92+ | MEDIUM |
| `cid_aggressive` | Max CID evasion | 85+ | HIGH |
| `music_stream` | Audio-reactive + visualizer | 93+ | MEDIUM |
| `gaming` | High motion (FPS, battle royale) | 94+ | MEDIUM |

### 🎨 Visualizers Built-in (5)
- **Spectrum Bars** - FFT bars klasik
- **Waveform** - Mirror/line waveform dengan glow
- **Circular** - Radial frequency display
- **Dual View** - Spectrum + Waveform combined
- **Minimal** - Clean single line

---

## ⚠️ Kendala & Blocker Saat Ini

### 🔴 **Critical (Harus diselesaikan dulu)**
| Kendala | Dampak | Solusi / Workaround |
|---------|--------|---------------------|
| **YouTube Live Streaming belum aktif** di channel test | Tidak bisa test `POST /api/streams/:id/start` end-to-end ke YouTube | Enable di [YouTube Studio](https://studio.youtube.com) → Create → Go Live → verifikasi nomor HP → tunggu 24 jam |
| **Frontend (React SPA) belum ada** | Harus pakai `curl`/Postman untuk test API | Prioritas Phase 6: Build React SPA dengan Vite |

### 🟡 **Medium (Bisa di-defer)**
| Kendala | Dampak | Rencana |
|---------|--------|---------|
| **Visualizer Preview API** belum ada | Tidak bisa preview visualizer sebelum dipakai | Phase 4 Week 2: `GET /api/visualizers/:id/preview` return MP4/GIF |
| **FX Preset Editor UI** belum ada | Harus manual JSON untuk custom preset | Phase 4 Week 2: React component editor dengan live preview |
| **Batch VMAF Testing** belum ada | Harus test preset satu-satu | Phase 4 Week 3: `POST /api/fx-presets/batch-test-vmaf` |
| **Docker GPU Support** belum tested | Hardware acceleration (NVENC/QSV) belum diverifikasi di container | Butuh host dengan GPU + nvidia-container-toolkit |

### 🟢 **Low / Nice to Have**
- Prometheus metrics + Grafana dashboard
- Multi-region RTMP ingest (untuk latency rendah global)
- Kubernetes deployment configs
- Stream analytics & retention dashboard

---

## ⏱ Waktu Realisasi Logis (Estimasi Realistis)

> **Catatan:** Estimasi ini untuk **1 developer full-time** (8 jam/hari) dengan asumsi environment sudah siap (Node.js, FFmpeg, Redis, Google Cloud Console project sudah dibuat).

| Fase | Scope | Estimasi | Ketergantungan |
|------|-------|----------|----------------|
| **Phase 4 Week 2** | Visualizer Preview API + FX Preset Editor UI + Preset Tagging/Search | **1 minggu** | Butuh React SPA (Phase 6) untuk UI |
| **Phase 4 Week 3** | Batch VMAF, Preset Versioning UI, Smart Metadata Builder, Advanced Scheduling | **1 minggu** | Butuh React SPA |
| **Phase 5** | Frontend (React SPA): Dashboard, Accounts, Stream Wizard, FX Editor, Visualizer Config, Real-time WS | **2-3 minggu** | Besar, butuh desain UI dulu |
| **Phase 6** | Production Hardening: Docker GPU, Prometheus/Grafana, Multi-region, K8s, CI/CD | **1-2 minggu** | Butuh akses cloud/GPU |
| **Total ke MVP Production** | **5-6 minggu** | | |

### Breakdown Harian (Contoh Phase 5 - Frontend 2 minggu):
| Hari | Fokus |
|------|-------|
| 1-2 | Setup Vite + React + Tailwind + Router + Socket.io client |
| 3-4 | Auth Flow (OAuth PKCE), Account Management Page |
| 5-6 | Dashboard (Stream List, Status Cards, Quick Actions) |
| 7-8 | Stream Creation Wizard (Multi-step: Source → Output → FX → Visualizer → Schedule) |
| 9-10 | FX Preset Editor (Live Preview Canvas, JSON ↔ Form sync, VMAF Test button) |
| 11-12 | Visualizer Config UI (Color picker, FFT controls, Background picker) |
| 13-13 | Schedule Calendar UI (Cron builder visual, Timezone picker) |
| 14 | Polish, Bugfix, E2E Test |

---

## 🚀 Quick Start (Ringkas)

```bash
# 1. Clone & Install
git clone https://github.com/el-utama/stream-engine.git
cd stream-engine
pnpm install

# 2. Setup Environment
cp packages/server/.env.example packages/server/.env
# Edit .env → isi GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ENCRYPTION_MASTER_KEY

# 3. Build & Run
pnpm run build
pnpm run dev

# Server: http://localhost:3000
# NMS RTMP: rtmp://localhost:1935
# NMS HTTP: http://localhost:8000
```

---

## 📚 Dokumentasi Lengkap

Lihat sections di bawah:
- [API Reference](#-api-reference) - Semua endpoint lengkap
- [VMAF Quality Testing](#-vmaf-quality-testing) - Cara test preset
- [Docker Deployment](#-docker-deployment) - Production deploy
- [Configuration](#-configuration) - Built-in preset & custom filter

---

## 🤝 Butuh Bantuan?

- **Issue/Bug**: [GitHub Issues](https://github.com/el-utama/stream-engine/issues)
- **Diskusi**: [GitHub Discussions](https://github.com/el-utama/stream-engine/discussions)
- **Roadmap**: Lihat [Projects](https://github.com/el-utama/stream-engine/projects)

---

**Made with ❤️ untuk komunitas streaming Indonesia** 🇮🇩

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

### Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Node.js 20+ + Fastify |
| **Streaming** | FFmpeg (fluent-ffmpeg + ffmpeg-static) |
| **RTMP Server** | Node-Media-Server |
| **Real-time** | Socket.io |
| **Auth** | Google OAuth 2.0 (PKCE) |
| **Scheduler** | node-cron + BullMQ (Redis) |
| **Database** | SQLite + Prisma ORM |
| **Container** | Docker + Docker Compose |

---

## 📦 Project Structure

```
stream-engine/
├── packages/
│   ├── shared/                 # Shared types, utilities, constants
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces (VMAF, Stream, FX, etc.)
│   │   │   ├── utils/          # encryption, result, hwaccel, metadata-renderer
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   └── constants/      # Built-in FX presets, visualizers
│   │   └── vitest.config.ts
│   │
│   ├── ffmpeg-worker/          # FFmpeg stream processor
│   │   ├── src/
│   │   │   ├── processor.ts    # Main FFmpeg processor with tee muxer
│   │   │   ├── filters/        # Filter graph builder (36 filters)
│   │   │   └── visualizers/    # Built-in visualizer filters
│   │   └── vitest.config.ts
│   │
│   └── server/                 # Fastify API server
│       ├── src/
│       │   ├── routes/         # REST API endpoints
│       │   │   ├── auth.ts         # OAuth, accounts
│       │   │   ├── streams.ts      # Stream CRUD, start/stop/status
│       │   │   ├── fx-presets.ts   # FX preset CRUD + VMAF endpoints
│       │   │   ├── schedules.ts    # Cron scheduling
│       │   │   └── visualizers.ts  # Visualizer CRUD
│       │   ├── services/
│       │   │   ├── stream.service.ts      # Stream lifecycle + tee muxer
│       │   │   ├── fx-preset.service.ts   # FX presets + VMAF testing
│       │   │   ├── vmaf.service.ts        # libvmaf quality assessment
│       │   │   ├── rtmp-relay.service.ts  # Legacy relay (deprecated)
│       │   │   ├── schedule.service.ts    # Cron + BullMQ scheduler
│       │   │   ├── youtube.service.ts     # YouTube API + OAuth
│       │   │   └── visualizer.service.ts  # Visualizer management
│       │   └── workers/
│       │       └── scheduler.worker.ts    # BullMQ job processor
│       └── prisma/
│           └── schema.prisma
│
├── docker-compose.yml
├── Dockerfile
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** (for native FFmpeg support)
- **pnpm 9+** (`npm install -g pnpm`)
- **FFmpeg** with libvmaf (`brew install ffmpeg` on macOS, `apt install ffmpeg` on Ubuntu)
- **Redis** (for BullMQ scheduler - optional, runs in Docker)

### Development Setup

```bash
# Clone and install
git clone https://github.com/el-utama/stream-engine.git
cd stream-engine
pnpm install

# Build shared packages
pnpm run build

# Start all services (server + worker + frontend)
pnpm run dev

# Or run individually
pnpm --filter=server run dev    # API server on :3000
pnpm --filter=ffmpeg-worker run dev
pnpm --filter=web run dev       # Frontend on :5173
```

### Docker (Production)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables

```bash
# packages/server/.env
DATABASE_URL="file:./prisma/data/db.sqlite"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
ENCRYPTION_MASTER_KEY="32-byte-base64-encoded-key"
NMS_RTMP_PORT=1935
NMS_HTTP_PORT=8000
MAX_CONCURRENT_STREAMS=3
```

---

## 📚 API Reference

### Authentication
```bash
# Get Google OAuth URL
GET /api/auth/google/url

# Handle callback
GET /api/auth/google/callback?code=xxx&state=xxx

# Get current user
GET /api/auth/me
```

### YouTube Accounts
```bash
# List connected accounts
GET /api/accounts

# Disconnect account
DELETE /api/accounts/:id
```

### Streams
```bash
# List streams
GET /api/streams

# Create stream
POST /api/streams
{
  "name": "My 24/7 Stream",
  "sourceType": "VIDEO_FILE",
  "videoFiles": ["/path/video1.mp4", "/path/video2.mp4"],
  "outputPlatforms": ["YOUTUBE", "TWITCH"],
  "customRtmpUrls": {
    "CUSTOM_RTMP": { "url": "rtmp://server/app", "key": "stream-key" }
  },
  "fxPresetId": "builtin-balanced",
  "visualizerId": "builtin-waveform"
}

# Get stream
GET /api/streams/:id

# Start stream
POST /api/streams/:id/start

# Stop stream
POST /api/streams/:id/stop

# Get status (real-time)
GET /api/streams/:id/status
```

### FX Presets
```bash
# List presets (includes built-in)
GET /api/fx-presets?includeBuiltIn=true

# Create custom preset
POST /api/fx-presets
{
  "name": "My Custom Preset",
  "description": "Balanced for music streams",
  "videoFilters": { "crop": { "percent": 2 }, "colorJitter": { "brightness": 0.01 } },
  "audioFilters": { "noise": { "type": "pink", "amplitude": 0.01 }, "loudnorm": { "target": -16 } },
  "intensity": "MEDIUM"
}

# Test preset with VMAF
POST /api/fx-presets/:id/test-vmaf
{ "sampleFile": "/path/to/reference.mp4" }

# Compare two presets
GET /api/fx-presets/:id/diff/:id2

# Duplicate preset
POST /api/fx-presets/:id/duplicate { "newName": "Copy" }

# Export preset (JSON)
GET /api/fx-presets/:id/export

# Import preset
POST /api/fx-presets/import
{
  "filterGraph": "[0:v]crop=...",
  "metadata": { "name": "Imported", "videoFilters": {...}, "audioFilters": {...} }
}
```

### Scheduling
```bash
# Create schedule
POST /api/schedules
{
  "name": "Daily 8AM Stream",
  "cronExpression": "0 8 * * *",
  "timezone": "America/New_York",
  "streamId": "stream-id",
  "maxDuration": 4
}

# List schedules
GET /api/schedules
```

### Visualizers
```bash
# List visualizers
GET /api/visualizers?includeBuiltIn=true

# Create custom
POST /api/visualizers
{
  "name": "Custom Spectrum",
  "type": "SPECTRUM",
  "config": { "fftSize": 2048, "color": "#00ff00" },
  "backgroundType": "COLOR",
  "backgroundConfig": { "color": "#000000" }
}
```

---

## 🎯 VMAF Quality Testing

The engine integrates **FFmpeg's libvmaf** for objective video quality assessment:

```bash
# Test a preset against reference video
POST /api/fx-presets/:id/test-vmaf
{
  "sampleFile": "/path/to/reference.mp4"
}

# Response
{
  "success": true,
  "vmafScore": 95.2,
  "details": {
    "perFrame": [94.1, 95.5, 96.0, ...],
    "stats": { "mean": 95.2, "stddev": 0.8, "min": 93.1, "max": 97.2 }
  }
}

# Compare two presets
GET /api/fx-presets/presetA/diff/presetB
{
  "videoFilters": { "added": ["colorJitter"], "removed": [], "modified": [...] },
  "audioFilters": { "added": [], "removed": ["noise"], "modified": [] },
  "vmafDifference": -2.3
}
```

### Built-in Presets with VMAF Scores
| Preset | Target Use | VMAF (est.) | Intensity |
|--------|------------|-------------|-----------|
| `soft` | Minimal processing | 98+ | LOW |
| `balanced` | General purpose | 95+ | MEDIUM |
| `aggressive` | Maximum anti-ghosting | 90+ | HIGH |
| `cid_aware` | Content ID evasion | 92+ | MEDIUM |
| `cid_aggressive` | Maximum CID evasion | 85+ | HIGH |
| `music_stream` | Audio-reactive | 93+ | MEDIUM |
| `gaming` | High motion content | 94+ | MEDIUM |

---

## 🐳 Docker Deployment

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    volumes: [redis-data:/data]

  server:
    build: ./packages/server
    ports: ["3000:3000", "1935:1935", "8000:8000"]
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=file:/data/db.sqlite
    volumes:
      - server-data:/app/prisma/data
      - ./media:/app/media
    depends_on: [redis]

  web:
    build: ./packages/web
    ports: ["5173:5173"]
    depends_on: [server]

volumes:
  redis-data:
  server-data:
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Per package
pnpm --filter=shared run test        # 17 tests (metadata-renderer)
pnpm --filter=ffmpeg-worker run test # 19 tests (filter-graph builder)

# Build verification
pnpm run build
```

---

## 🔧 Configuration

### Built-in FX Presets
```typescript
// packages/shared/src/constants/index.ts
export const BUILTIN_FX_PRESETS = {
  soft: { intensity: 'LOW', videoFilters: { crop: { percent: 1 } }, ... },
  balanced: { intensity: 'MEDIUM', videoFilters: { crop: { percent: 2 }, colorJitter: { brightness: 0.01 } }, ... },
  aggressive: { intensity: 'HIGH', videoFilters: { crop: { percent: 5 }, colorJitter: { brightness: 0.05 } }, ... },
  cid_aware: { intensity: 'MEDIUM', videoFilters: { crop: { percent: 3, randomize: true }, speed: { min: 0.98, max: 1.02 } }, ... },
  cid_aggressive: { intensity: 'HIGH', videoFilters: { crop: { percent: 5, randomize: true }, speed: { min: 0.95, max: 1.05 } }, ... },
  music_stream: { intensity: 'MEDIUM', visualizerId: 'builtin-waveform', ... },
  gaming: { intensity: 'MEDIUM', videoFilters: { crop: { percent: 2 }, noise: { type: 'velvet', amplitude: 0.005 } }, ... },
};
```

### Custom Filter Graph Example
```json
{
  "videoFilters": {
    "crop": { "percent": 2, "randomize": true },
    "colorJitter": { "brightness": 0.02, "contrast": 0.02, "saturation": 0.03 },
    "speed": { "min": 0.98, "max": 1.02, "pitchCorrection": true },
    "noise": { "type": "velvet", "amplitude": 0.005, "mixLevel": -30 }
  },
  "audioFilters": {
    "noise": { "type": "pink", "amplitude": 0.01, "mixLevel": -25 },
    "loudnorm": { "target": -16, "jitter": 0.5 }
  }
}
```

---

## 📊 Monitoring

### Stream Status Fields
```json
{
  "status": "LIVE",
  "uptime": 3600,
  "stats": {
    "bitrate": 3850,
    "fps": 30.0,
    "droppedFrames": 0,
    "totalFrames": 108000,
    "speed": 1.0,
    "audioLevel": -12.5
  },
  "health": {
    "isHealthy": true,
    "lastCheck": "2024-01-15T10:30:00Z",
    "reconnectCount": 0,
    "lastError": null
  }
}
```

### WebSocket Events
```javascript
// Connect to /ws
socket.on('stream:status', (data) => { /* real-time updates */ });
socket.on('stream:error', (error) => { /* error notifications */ });
socket.on('relay:status', (data) => { /* relay health */ });
```

---

## 🛣 Roadmap

### Phase 4 Week 2 (Visualizer & Frontend)
- [ ] Visualizer preview generation API
- [ ] Frontend FX preset editor with live preview
- [ ] Visualizer configuration UI
- [ ] Preset tagging & search

### Phase 4 Week 3 (Advanced Features)
- [ ] Batch VMAF testing for multiple presets
- [ ] Preset versioning UI with diff viewer
- [ ] Smart metadata template builder
- [ ] Advanced scheduling (recurring, chained)

### Phase 5 (Production Hardening)
- [ ] Prometheus metrics + Grafana dashboards
- [ ] Multi-region RTMP ingest
- [ ] Stream analytics & retention
- [ ] Kubernetes deployment configs

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- TypeScript strict mode
- ESLint + Prettier configured
- Vitest for unit tests
- Conventional commits

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **FFmpeg** - The backbone of all video processing
- **Node-Media-Server** - RTMP ingest & relay
- **libvmaf** - Netflix's video quality metric
- **Prisma** - Type-safe database ORM
- **Fastify** - Fast, low-overhead web framework

---

**Made with ❤️ for the streaming community**
