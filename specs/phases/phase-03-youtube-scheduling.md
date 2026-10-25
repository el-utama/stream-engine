# Phase 3: YouTube + Scheduling (Micro-Tasks)

## Goal: Broadcast Management, Smart Scheduling, Metadata Templates

### 3.1 YouTube Service
- [ ] `src/services/youtube.service.ts` - Wrapper for googleapis
- [ ] `getOrCreateLiveStream(channelId)` - Reuse persistent stream (isReusable: true)
- [ ] `createBroadcast(params)` - Auto-start/stop, DVR, embed, latency
- [ ] `bindBroadcast(broadcastId, streamId)` - Link broadcast to stream
- [ ] `transitionBroadcast(id, status)` - testing → live → complete
- [ ] `updateBroadcast(id, params)` - Title, description, tags, thumbnail
- [ ] Token auto-refresh on 401 (retry once)

### 3.2 Smart Metadata Templates
- [ ] `src/services/metadata.service.ts` - Template engine
- [ ] Variables: `{date}`, `{time}`, `{genre}`, `{mood}`, `{playlistName}`, `{currentTrack}`, `{videoIndex}`, `{totalVideos}`, `{viewers}`, `{streamNumber}`, `{uptime}`
- [ ] Random: `#{randomTag}`, `#{hashtags}`, `#{genreTags}`
- [ ] Conditional: `{?condition:value}`
- [ ] Presets: `music247`, `playlist`, `gaming`

### 3.3 Scheduler Service
- [ ] `src/services/scheduler.service.ts` - Cron + BullMQ
- [ ] `getDueSchedules()` - Query active schedules, check cron match
- [ ] `triggerSchedule(schedule)` - Create jobs for each stream
- [ ] Node-cron: Check every minute `* * * * *`
- [ ] BullMQ: Reliable job queue with retry/backoff

### 3.4 Stream Jobs
- [ ] `src/jobs/stream.jobs.ts` - BullMQ processors
- [ ] `start` job: StreamService.start() + schedule auto-stop if maxDuration
- [ ] `stop` job: StreamService.stop()
- [ ] `restart` job: StreamService.restart()

### 3.5 Schedule CRUD
- [ ] `src/routes/schedules.ts` - GET/POST/PATCH/DELETE /api/schedules
- [ ] `src/routes/schedules.ts` - POST /api/schedules/:id/toggle
- [ ] Cron expression validation (cron-validator)

### 3.6 Schedule Model
- [ ] Prisma: Schedule (cronExpression, timezone, startDate, endDate, maxDuration, isActive)
- [ ] Relation: Schedule → Stream[]

### Deliverables
- Create schedule "Daily 8PM" → Cron triggers → Stream starts → YouTube broadcast auto-starts
- Stream runs 4 hours → Auto-stops → Broadcast completes
- Smart title: "🎵 Chill Vibes 24/7 • Live Now • 2026-01-15"
- Tags auto-generated from genre/mood + random music tags

### Token Estimate
~10 small files, ~55 lines each = ~550 lines total