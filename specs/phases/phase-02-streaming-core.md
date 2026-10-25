# Phase 2: Streaming Core (Micro-Tasks)

## Goal: NMS, FFmpeg Worker, RTMP Relay, Health Checks

### 2.1 Node-Media-Server Integration
- [ ] `src/services/nms.service.ts` - Start/stop NMS, config reload
- [ ] NMS config: RTMP :1935, HTTP-FLV :8000, auth API
- [ ] Event handlers: `prePublish`, `postPublish`, `donePublish`

### 2.2 FFmpeg Manager
- [ ] `src/services/ffmpeg-manager.ts` - Process pool, spawn, track, health
- [ ] `src/services/ffmpeg-manager.ts#start()` - Build args, spawn, return handle
- [ ] `src/services/ffmpeg-manager.ts#stop()` - SIGTERM → wait 5s → SIGKILL
- [ ] `src/services/ffmpeg-manager.ts#healthCheck()` - Parse stderr, check bitrate/fps

### 2.3 Filter Graph Builder (FFmpeg Worker)
- [ ] `packages/ffmpeg-worker/src/filters/filter-graph.builder.ts` - Fluent API
- [ ] `packages/ffmpeg-worker/src/filters/video-filters.ts` - crop, colorJitter, noise, speed, loop
- [ ] `packages/ffmpeg-worker/src/filters/audio-filters.ts` - noiseOverlay, loudnorm, pitchShift, tempo, compand
- [ ] `packages/ffmpeg-worker/src/filters/playlist.ts` - crossfade chain generator

### 2.4 Stream Service (Lifecycle)
- [ ] `src/services/stream.service.ts` - CRUD + start/stop/restart
- [ ] `start()`: Validate → YouTube broadcast → Filter graph → FFmpeg → Update status
- [ ] `stop()`: FFmpeg stop → YouTube transition complete → Update status
- [ ] `restart()`: Stop → wait 2s → Start

### 2.5 RTMP Relay (Multi-Platform)
- [ ] `src/services/rtmp-relay.service.ts` - Dynamic relay tasks for NMS
- [ ] FFmpeg tee muxer: Single input → YouTube + Custom RTMP
- [ ] `onfail=ignore` per output so one failure doesn't kill others

### 2.6 Health Monitoring
- [ ] `src/services/health-monitor.ts` - Interval 15s check all live streams
- [ ] Checks: process alive, bitrate > 80% target, drop rate < 5%, RTMP connected
- [ ] Auto-reconnect: FFmpeg native → App restart with backoff (5s, 10s, 20s... max 5min)

### 2.7 API Routes
- [ ] `src/routes/streams.ts` - GET/POST/PATCH/DELETE /api/streams
- [ ] `src/routes/streams.ts` - POST /api/streams/:id/start|stop|restart
- [ ] `src/routes/streams.ts` - GET /api/streams/:id/status|logs|preview

### 2.8 WebSocket Events
- [ ] `src/websocket/stream.socket.ts` - join/leave, start/stop, real-time stats

### Deliverables
- Start stream → FFmpeg runs → NMS receives → Relays to YouTube RTMP
- Dashboard shows real-time bitrate, fps, dropped frames
- Pull network cable → Auto-reconnect within 30s
- Stop stream → Clean shutdown, YouTube broadcast completes

### Token Estimate
~12 small files, ~60 lines each = ~720 lines total