# Phase 7: Docker + Production (Micro-Tasks)

## Goal: Multi-Arch Docker, GPU Support, Monitoring

### 7.1 Dockerfile (Multi-Stage)
- [ ] `docker/Dockerfile` - Builder → Runtime
- [ ] Base: `node:20-alpine`
- [ ] Install: ffmpeg, v4l-utils, mesa-dri, intel-media-driver, tini
- [ ] NVIDIA: `NVIDIA_VISIBLE_DEVICES=all`, `NVIDIA_DRIVER_CAPABILITIES=compute,video,utility`
- [ ] Non-root user (UID 1000)
- [ ] Health check: `wget --spider http://localhost:3000/api/health`

### 7.2 Docker Compose
- [ ] `docker/docker-compose.yml` - App, Redis
- [ ] `docker/docker-compose.gpu.yml` - NVIDIA/Intel GPU reservations
- [ ] Volumes: data, videos, music, logs, /tmp
- [ ] Env file: `.env.production`

### 7.3 GPU Detection
- [ ] `src/utils/gpu-detect.ts` - Runtime detection
- [ ] NVIDIA: `nvidia-smi` parse
- [ ] Intel: `intel_gpu_top` or `/sys/class/drm`
- [ ] AMD: `rocm-smi`
- [ ] Auto-select encoder in FFmpegManager

### 7.4 Monitoring (Optional)
- [ ] `docker/prometheus.yml` - Scrape app :9090, node-exporter, cadvisor
- [ ] `docker/grafana-dashboards/stream-engine.json` - Streams, FFmpeg, System
- [ ] Metrics: active streams, bitrate, fps, drops, reconnects, uptime

### 7.5 Reverse Proxy (Production)
- [ ] `docker/nginx.conf` - SSL termination, WebSocket proxy, rate limit
- [ ] Or Caddyfile for auto-HTTPS

### 7.6 Deployment Scripts
- [ ] `scripts/deploy.sh` - Build, push, deploy
- [ ] `scripts/backup.sh` - SQLite + tokens backup
- [ ] `scripts/restore.sh` - Restore from backup

### 7.7 Health & Logging
- [ ] Structured JSON logs (pino)
- [ ] Log rotation (daily, 30 days)
- [ ] `/api/health` detailed: DB, Redis, FFmpeg, NMS, GPU

### Deliverables
- `docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d` works
- GPU detected, NVENC/QSV used automatically
- Prometheus + Grafana shows live stream metrics
- Survives container restart (SQLite persisted)
- Backup/restore tested

### Token Estimate
~8 small files, ~50 lines each = ~400 lines total