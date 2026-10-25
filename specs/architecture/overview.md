# Stream Engine - Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (React SPA)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  Dashboard  │ │   Streams   │ │  Schedules  │ │  FX / Visualizers   │   │
│  │  (Grid)     │ │  (Wizard)   │ │  (Calendar) │ │  (Editor + Preview) │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘   │
│         │               │               │                    │              │
│         └───────────────┼───────────────┼────────────────────┘              │
│                         ▼               ▼                                   │
│              ┌─────────────────────────────────────┐                        │
│              │         Socket.io (Real-time)       │                        │
│              │  stream:status │ stream:stats       │                        │
│              │  stream:log    │ stream:error       │                        │
│              └─────────────────────────────────────┘                        │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTPS / WS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FASTIFY API SERVER (Node.js)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Auth Service│ │Stream Service│ │Scheduler    │ │ YouTube Service     │   │
│  │ (OAuth PKCE)│ │(Lifecycle)   │ │(Cron+BullMQ)│ │(Broadcasts/Streams) │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘   │
│         │               │               │                    │              │
│         └───────────────┼───────────────┼────────────────────┘              │
│                         ▼               ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Core Infrastructure                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   Prisma    │ │   Redis     │ │   NMS       │ │  FFmpeg     │   │   │
│  │  │  (SQLite)   │ │  (BullMQ)   │ │  (RTMP)     │ │  Manager    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ Node-Media-   │        │ FFmpeg Worker │        │ YouTube API   │
│ Server        │        │ (Process Pool)│        │ (Broadcasts)  │
│ :1935 RTMP    │◄───────│ Filter Graph  │        │ Live Control  │
│ :8000 HTTP    │        │ HW Accel      │        │ Room          │
└───────┬───────┘        └───────┬───────┘        └───────────────┘
        │                        │
        │         ┌──────────────┴──────────────┐
        │         ▼                             ▼
        │  ┌─────────┐                     ┌─────────┐
        └──►│ YouTube │                     │Custom   │
           │  RTMP   │                     │  RTMP   │
           └─────────┘                     └─────────┘
```

---

## Data Flow

### Stream Creation
```
User → Dashboard → POST /api/streams → Validate (Zod) → Prisma.create()
                                                      ↓
                                              Schedule? → BullMQ job
                                                      ↓
                                              Return stream ID
```

### Stream Start (Scheduled or Manual)
```
Trigger (Cron/API) → BullMQ job → StreamService.start()
    ↓
YouTubeService.ensureBroadcast() → Create/reuse LiveStream → Create Broadcast → Bind
    ↓
FxService.buildFilterGraph(stream, preset) → Video + Audio filters
    ↓
VisualizerService.generateFilter(config) → FFmpeg visualizer filter
    ↓
FFmpegManager.start(streamId, filterGraph, rtmpUrl, streamKey)
    ↓
FFmpeg → RTMP → NMS (port 1935)
    ↓
NMS Relay (FFmpeg tee) → YouTube RTMP + Custom RTMP
    ↓
Socket.io emit stream:status → Dashboard updates
```

### Health Monitoring (Every 15s)
```
HealthMonitor.checkAll() → For each LIVE stream:
    ↓
1. FFmpeg process alive?
2. Bitrate > 80% target?
3. Frame drop rate < 5%?
4. RTMP TCP connected?
5. YouTube broadcast live?
    ↓
If any fail → Layer 1: FFmpeg native reconnect (auto)
    ↓
If persistent → Layer 2: App restart with backoff
    ↓
Socket.io emit stream:error → Dashboard alert
```

---

## Key Technical Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Video Pipeline** | Single FFmpeg filter_graph | Single encode, HW accel, deterministic |
| **Audio Pipeline** | Mixed in same FFmpeg process | Sync guaranteed, efficient |
| **Loop/Crossfade** | FFmpeg `loop` + `xfade`/`acrossfade` | Seamless, no gap |
| **Anti-Ghosting** | 3-layer (FFmpeg + App + Backoff) | <1s → 15s → 5min recovery |
| **YouTube Streams** | Reusable LiveStream (isReusable) | Quota efficient, stable ingest URL |
| **Scheduling** | Node-cron + BullMQ | Reliable, persistent, retryable |
| **Visualizers** | FFmpeg-native primary | Zero overhead, GPU accelerated |
| **FX Presets** | CID-aware calibrated | Balance uniqueness vs quality |
| **Tokens** | AES-256-GCM encrypted in SQLite | Secure at rest, auto-refresh |
| **Config** | Zod + env vars | Type-safe, validated, documented |

---

## Package Structure

```
packages/
├── shared/           # Types, constants, utils, schemas (PUBLISHED)
│   └── src/
│       ├── types/        # All TypeScript interfaces
│       ├── constants/    # Built-in presets, defaults
│       ├── utils/        # encryption, result, helpers
│       └── schemas/      # Zod validation schemas
│
├── server/           # Fastify API (PRIVATE)
│   └── src/
│       ├── config/       # Zod-validated config
│       ├── services/     # Business logic (7 core services)
│       ├── jobs/         # BullMQ processors
│       ├── routes/       # API endpoints
│       ├── websocket/    # Socket.io handlers
│       └── utils/        # hwaccel, gpu-detect
│       └── prisma/       # Schema + migrations
│
├── client/           # React SPA (PRIVATE)
│   └── src/
│       ├── components/   # Reusable UI
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       ├── stores/       # Zustand state
│       └── services/     # API + WS clients
│
├── ffmpeg-worker/    # Filter graphs, visualizers (PRIVATE)
│   └── src/
│       ├── filters/      # Video/Audio filter builders
│       ├── visualizers/  # FFmpeg-native visualizer templates
│       └── processor.ts  # Worker entry
│
└── visualizer-worker/ # Browser pool (PRIVATE, optional)
    └── src/
        ├── visualizers/  # WebGL/Canvas shaders
        └── pool.ts       # Puppeteer cluster
```

---

## Ports & Endpoints

| Port | Service | Purpose |
|------|---------|---------|
| 3000 | Fastify | Web UI + REST API |
| 1935 | NMS | RTMP Ingest |
| 8000 | NMS | HTTP-FLV / HLS Playback |
| 6379 | Redis | BullMQ + Socket.io adapter |
| 9090 | Prometheus | Metrics (optional) |
| 3001 | Grafana | Dashboards (optional) |

---

## Security Boundaries

```
┌────────────────────────────────────────────────────────────┐
│                    TRUST ZONES                              │
├────────────────────────────────────────────────────────────┤
│  PUBLIC (Internet)                                          │
│  ├── HTTPS (3000) → Fastify (rate limited, helmet)         │
│  ├── RTMP (1935) → NMS (auth optional)                     │
│  └── HTTP-FLV (8000) → NMS (public playback)               │
├────────────────────────────────────────────────────────────┤
│  PRIVATE (Docker Network)                                   │
│  ├── Fastify ↔ Redis (no auth, internal)                   │
│  ├── Fastify ↔ SQLite (file, local only)                   │
│  ├── Fastify ↔ NMS (local, admin API)                      │
│  └── FFmpeg → NMS (local RTMP)                             │
├────────────────────────────────────────────────────────────┤
│  SECRETS (Encrypted)                                        │
│  ├── OAuth Refresh Tokens → AES-256-GCM in SQLite          │
│  ├── MASTER_KEY → Env var only (32 bytes base64)           │
│  ├── Google Client Secret → Env var only                   │
│  └── Custom RTMP Keys → Encrypted in DB                    │
└────────────────────────────────────────────────────────────┘
```

---

## Scalability Notes

| Current (1-3 streams) | Future (10+) | Future (50+) |
|----------------------|--------------|--------------|
| Single VPS | Multiple workers | Kubernetes |
| SQLite | PostgreSQL | PostgreSQL + Read Replicas |
| Local Redis | Redis Cluster | Redis Cluster |
| Single NMS | NMS per worker | MediaMTX cluster |
| In-process FFmpeg | Worker pool | Separate FFmpeg fleet |
| Browser pool (1:2) | Dedicated visualizer nodes | GPU cluster |

**Current design supports horizontal scaling** by:
- Stateless Fastify (add replicas behind LB)
- BullMQ workers (add consumers)
- FFmpeg workers (isolated processes)
- Shared Redis + PostgreSQL