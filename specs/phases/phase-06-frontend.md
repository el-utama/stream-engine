# Phase 6: Frontend Dashboard (Micro-Tasks)

## Goal: React SPA with Real-Time Monitoring

### 6.1 Project Setup
- [ ] `packages/client/` - Vite + React 18 + TS + Tailwind
- [ ] `src/main.tsx` - App entry, providers (QueryClient, Socket)
- [ ] `src/App.tsx` - Router, layout, auth guard

### 6.2 Shared API Client
- [ ] `src/services/api.ts` - Fetch wrapper with auth, error handling
- [ ] `src/services/ws.ts` - Socket.io connection, auto-reconnect

### 6.3 Zustand Stores
- [ ] `src/stores/auth.store.ts` - User, tokens, login/logout
- [ ] `src/stores/stream.store.ts` - Streams map, real-time updates via WS
- [ ] `src/stores/schedule.store.ts` - Schedules list
- [ ] `src/stores/fx.store.ts` - FX presets, visualizers

### 6.4 Pages (Routes)
- [ ] `/` - Dashboard (stream grid, system health)
- [ ] `/streams` - Stream list + create wizard
- [ ] `/streams/:id` - Stream detail, controls, live stats, logs
- [ ] `/accounts` - YouTube accounts (connect, list, disconnect)
- [ ] `/schedules` - Calendar view, cron builder
- [ ] `/fx-presets` - Preset library, editor, test
- [ ] `/visualizers` - Visualizer library, editor, preview
- [ ] `/settings` - App config, Docker info

### 6.5 Key Components
- [ ] `StreamCard` - Status badge, stats (bitrate, fps, dropped), controls
- [ ] `StreamWizard` - 5 steps: Source → FX → Output → Schedule → Metadata
- [ ] `FxPresetEditor` - Visual filter builder (crop, color, noise sliders)
- [ ] `VisualizerEditor` - Live preview with audio upload
- [ ] `ScheduleBuilder` - Cron expression helper + human readable
- [ ] `MetadataTemplateEditor` - Variable picker + live preview
- [ ] `LogViewer` - Real-time logs, filter by level, search
- [ ] `SystemHealth` - CPU, RAM, GPU, active streams

### 6.6 Real-Time Updates
- [ ] Socket.io: `stream:status`, `stream:stats`, `stream:log`, `stream:error`
- [ ] Optimistic UI for start/stop/restart
- [ ] Toast notifications for errors

### 6.7 Music-Focused UX
- [ ] Genre/mood selectors in StreamWizard
- [ ] Playlist manager (drag-drop, shuffle history)
- [ ] Track metadata display (title, artist, duration)
- [ ] Visualizer preview with actual audio file

### Deliverables
- Create stream in <2 minutes via wizard
- Live dashboard shows bitrate/fps/dropped updating every 2s
- One-click start/stop/restart
- Visualizer preview plays in browser
- Mobile-responsive

### Token Estimate
~15 small components, ~40 lines each = ~600 lines total