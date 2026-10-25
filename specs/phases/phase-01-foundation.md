# Phase 1: Foundation (Micro-Tasks)

## Goal: Monorepo, DB, Auth, Config, Shared Types

### 1.1 Monorepo Setup
- [ ] `package.json` (root) with pnpm workspaces
- [ ] `pnpm-workspace.yaml` 
- [ ] `tsconfig.base.json` (shared config)
- [ ] `.env.example` with all required vars

### 1.2 Shared Package (@stream-engine/shared)
- [ ] `src/types/index.ts` - All enums + interfaces (SourceType, StreamStatus, etc.)
- [ ] `src/constants/index.ts` - Built-in presets, defaults
- [ ] `src/utils/encryption.ts` - AES-256-GCM EncryptionService
- [ ] `src/utils/result.ts` - Result<T,E> pattern
- [ ] `src/schemas/stream.schema.ts` - Zod schemas for Stream CRUD
- [ ] `src/schemas/auth.schema.ts` - OAuth schemas
- [ ] `package.json` + `tsconfig.json`

### 1.3 Server Package (@stream-engine/server)
- [ ] `src/config/index.ts` - Zod-validated config from env
- [ ] `src/utils/encryption.ts` - Re-export shared encryption
- [ ] `src/utils/hwaccel.ts` - Auto-detect best encoder
- [ ] `prisma/schema.prisma` - Complete schema with indexes
- [ ] `package.json` + `tsconfig.json`

### 1.4 Auth Service (Google OAuth PKCE)
- [ ] `src/services/auth.service.ts` - PKCE flow, token refresh (5min buffer), multi-account
- [ ] `src/routes/auth.ts` - `/auth/youtube/url`, `/auth/youtube/callback`, `/auth/youtube/accounts`
- [ ] Token encryption using shared EncryptionService

### 1.5 Core Infrastructure
- [ ] `src/index.ts` - Fastify app, plugins (cors, helmet, rate-limit, swagger)
- [ ] `src/plugins/prisma.ts` - Prisma client decorator
- [ ] `src/plugins/socket.ts` - Socket.io decorator
- [ ] `src/plugins/redis.ts` - Redis + BullMQ decorator
- [ ] `src/plugins/nms.ts` - Node-Media-Server decorator

### 1.6 Database
- [ ] Run `pnpm db:generate` + `pnpm db:push`
- [ ] Seed built-in FX presets (soft, balanced, aggressive, cidAware)
- [ ] Seed built-in visualizers (spectrum, waveform, circular, dualView)

### Deliverables
- `pnpm dev` starts server on :3000
- OAuth flow works (test with Google Cloud Desktop app)
- SQLite database created with all tables
- Health endpoint `/api/health` returns OK

### Token Estimate
~15 small files, ~50 lines each = ~750 lines total