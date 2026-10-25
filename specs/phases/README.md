# Stream Engine - Master Plan Index

## Project Overview
**Goal**: Lightweight, no-install web app for 24/7 YouTube music streaming
**Stack**: pnpm monorepo, Fastify, React, FFmpeg, Node-Media-Server, SQLite, Redis
**Hardware**: GPU-enabled (NVENC/QSV), 1-3 concurrent streams
**Platforms**: YouTube + Custom RTMP

---

## Phase Summary (8 Phases, ~4,650 lines total)

| Phase | Focus | Files | Est. Lines | Duration |
|-------|-------|-------|------------|----------|
| **01** | Foundation | 15 | 750 | 2 weeks |
| **02** | Streaming Core | 12 | 720 | 2 weeks |
| **03** | YouTube + Scheduling | 10 | 550 | 2 weeks |
| **04** | FX Engine | 8 | 560 | 2 weeks |
| **05** | Visualizers | 8 | 520 | 2 weeks |
| **06** | Frontend | 15 | 600 | 2 weeks |
| **07** | Docker + Production | 8 | 400 | 1 week |
| **08** | Polish & Advanced | 12 | 540 | 1 week |
| **Total** | | **88** | **~4,650** | **~14 weeks** |

---

## Micro-Phase Files (Token-Friendly)

Each phase = separate markdown file in `specs/phases/`:
- `phase-01-foundation.md`
- `phase-02-streaming-core.md`
- `phase-03-youtube-scheduling.md`
- `phase-04-fx-engine.md`
- `phase-05-visualizers.md`
- `phase-06-frontend.md`
- `phase-07-docker-production.md`
- `phase-08-polish.md`

---

## Core Specs (Reference)

| File | Purpose |
|------|---------|
| `specs/skills/stream-engine.yaml` | Complete project specification |
| `specs/rules/core-rules.md` | Enforceable rules (CRITICAL/WARNING) |
| `specs/patterns/code-patterns.md` | 12 reusable code patterns |
| `specs/architecture/overview.md` | System architecture diagram |

---

## Implementation Rules

1. **One task = one small file** (50-70 lines max)
2. **No mega-files** - Split by concern
3. **Shared types first** - All types in `@stream-engine/shared`
4. **Zod validate everything** - No raw input
5. **Result pattern** - No throws in services
6. **Token encryption** - AES-256-GCM for all secrets
7. **Real-time via Socket.io** - All state changes emit events
8. **Test filter graphs** - `ffmpeg -filter_complex '...' -f null -` before deploy

---

## Ready to Start

**Next Action**: Begin Phase 1 (Foundation)
- User confirms → I'll create todo list for Phase 1 micro-tasks
- Each micro-task = one implementation step
- Ask before each file creation

**Prerequisites** (User to provide):
- Google Cloud project with YouTube Data API v3 enabled
- OAuth 2.0 Desktop client credentials
- GPU-enabled server (or local for dev)
- Domain + SSL for production (or localhost for dev)