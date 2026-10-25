# Phase 5: Visualizers (Micro-Tasks)

## Goal: FFmpeg-Native + Browser Pool, Music Presets

### 5.1 Visualizer Service
- [ ] `src/services/visualizer.service.ts` - Built-in + custom
- [ ] `generateFilter(config)` - Returns FFmpeg filter string
- [ ] `preview(config, audioFile)` - Generate 10s test clip

### 5.2 FFmpeg-Native Visualizers (Zero Overhead)
- [ ] `packages/ffmpeg-worker/src/visualizers/builtin.ts`
  - `spectrumBars(config)` - `showspectrum=mode=combined:color=rainbow:scale=log:size=1920x1080:rate=30`
  - `waveform(config)` - `showwaves=mode=cline:colors=00ff00|00ffff:size=1920x1080:rate=30`
  - `circular(config)` - `showcqt=size=1920x1080:rate=30:count=120:cscheme=rainbow`
  - `vectorscope(config)` - `avectorscope=size=1920x1080:rate=30`
  - `dualView(config)` - `vstack` spectrum + waveform (best for music)

### 5.3 Background Support
- [ ] `color` - Solid hex
- [ ] `gradient` - Direction + stops
- [ ] `image` - URL + fit/blur/darken
- [ ] `video` - URL + loop + opacity

### 5.4 Visualizer Config Schema
- [ ] `packages/shared/src/schemas/visualizer.schema.ts`
- [ ] Types: SPECTRUM_BARS, WAVEFORM, CIRCULAR, VECTORSCOPE, DUAL_VIEW, CUSTOM
- [ ] Each with typed config (bars, waveform, circular, etc.)

### 5.5 Browser Pool (Optional, Advanced)
- [ ] `packages/visualizer-worker/src/pool.ts` - Puppeteer cluster (1 Chrome per 2 streams)
- [ ] `packages/visualizer-worker/src/visualizers/custom.ts` - WebGL/Canvas shaders
- [ ] CDP canvas capture → WebRTC/WHIP → MediaMTX → FFmpeg input

### 5.6 Visualizer CRUD
- [ ] `src/routes/visualizers.ts` - GET/POST/PATCH/DELETE /api/visualizers
- [ ] `GET /api/visualizers/:id/preview` - Returns test video URL

### 5.7 Music Presets (Constants)
- [ ] `packages/shared/src/constants/visualizers.ts`
  - `spectrumBars` - Classic bars, mirror, peak hold
  - `waveformMirror` - Oscilloscope mirror
  - `circularBass` - Radial with bass pulse
  - `dualView` - Spectrum top + waveform bottom (recommended)
  - `minimal` - Clean bars for low CPU

### 5.8 Integration
- [ ] Stream.visualizerId → VisualizerService.generateFilter() → Added to filter graph
- [ ] Background rendered as base layer, visualizer overlay

### Deliverables
- Select "dualView" + gradient background → Music-reactive video
- CPU <10% for 1080p30 with NVENC
- Preview generates in <5s
- Custom visualizer via browser pool (when enabled)

### Token Estimate
~8 small files, ~65 lines each = ~520 lines total