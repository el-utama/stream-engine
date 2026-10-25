# Phase 8: Polish & Advanced (Micro-Tasks)

## Goal: Tests, CI/CD, Docs, Advanced Features

### 8.1 Testing
- [ ] `vitest.config.ts` - Unit + integration config
- [ ] Unit: Filter graphs, metadata templates, encryption, hwaccel
- [ ] Integration: Auth flow, stream CRUD, schedule trigger (testcontainers)
- [ ] E2E: Playwright - Create stream → Start → Verify YouTube → Stop
- [ ] Load: k6 - 3 concurrent streams, 1 hour, network interruption

### 8.2 CI/CD
- [ ] `.github/workflows/ci.yml` - Lint, typecheck, test, build
- [ ] `.github/workflows/docker.yml` - Multi-arch build (amd64, arm64)
- [ ] `.github/workflows/deploy.yml` - Deploy to VPS on tag

### 8.3 Documentation
- [ ] `docs/ARCHITECTURE.md` - System diagram, data flow
- [ ] `docs/API.md` - OpenAPI spec (auto-generated from Fastify)
- [ ] `docs/DEPLOYMENT.md` - VPS setup, Docker, SSL, monitoring
- [ ] `docs/TROUBLESHOOTING.md` - Common issues, debug commands
- [ ] `docs/GOOGLE_CLOUD_SETUP.md` - OAuth, API enable, verification

### 8.4 Advanced Features (Optional)
- [ ] **Multi-source input**: RTMP push ingest (OBS → App), Webcam (V4L2), Screen capture (Chrome ext + WHIP)
- [ ] **Analytics dashboard**: YouTube API viewer stats, retention, peak viewers
- [ ] **Webhook integrations**: Discord/Slack/Telegram on stream start/stop/error
- [ ] **Plugin system**: Custom FX transforms (TS), Custom visualizers (React)
- [ ] **Stream cloning**: Duplicate stream config for new channel
- [ ] **Bulk operations**: Start/stop all, apply preset to multiple

### 8.5 Quality of Life
- [ ] Keyboard shortcuts (Space=play/pause, R=restart)
- [ ] Dark/light theme (persisted)
- [ ] Stream templates (save/load full config)
- [ ] Import/export streams (JSON)
- [ ] Keyboard-accessible UI (WCAG AA)

### 8.6 Performance Tuning
- [ ] FFmpeg preset tuning guide (p4 vs p3 vs p5)
- [ ] Bitrate ladder for adaptive (if HLS output added)
- [ ] Memory leak detection (heap snapshots)
- [ ] Connection pooling (Prisma, Redis)

### Deliverables
- All tests pass in CI
- Docker images on GHCR
- Docs complete for self-deployment
- 3 streams stable for 24h+
- Easy to extend with plugins

### Token Estimate
~12 small files, ~45 lines each = ~540 lines total