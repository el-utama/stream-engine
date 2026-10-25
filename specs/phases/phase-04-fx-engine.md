# Phase 4: FX Engine (Micro-Tasks)

## Goal: Video/Audio Filters, Presets, CID-Aware Profiles

### 4.1 FX Service
- [ ] `src/services/fx.service.ts` - Preset CRUD, filter graph generation
- [ ] `getPreset(id)` - Built-in or user custom
- [ ] `buildFilterGraph(stream, preset)` - Combine video + audio filters
- [ ] `testPreset(preset, sampleFile)` - Run FFmpeg test, return VMAF/quality

### 4.2 Video Filters (Fingerprint Avoidance)
- [ ] `packages/ffmpeg-worker/src/filters/video-filters.ts`
  - `crop(percent, randomize)` - 1-4% zoom, breaks geometric fingerprinting
  - `rotate(degrees, randomize)` - ±0.5°, breaks orientation
  - `colorJitter(brightness, contrast, saturation, gamma, hue)` - ±2%, breaks color histogram
  - `noise(type, strength, temporal)` - grain/digital/film, breaks compression fingerprint
  - `frameJitter(dropRate, blendRate)` - Temporal fingerprint breaking
  - `speed(factor, pitchCorrection)` - 0.99-1.01, breaks duration fingerprint
  - `watermark(payload, strength)` - Invisible, for own content tracking

### 4.3 Audio Filters (Fingerprint Avoidance)
- [ ] `packages/ffmpeg-worker/src/filters/audio-filters.ts`
  - `noiseOverlay(type, amplitude, mixDb)` - white/pink/brown/blue/violet/velvet
  - `spectralSmear(intensity)` - FFT-based, breaks audio fingerprint
  - `pitchShift(semitones)` - ±0.5, formant-preserving via rubberband
  - `tempo(factor)` - 0.99-1.01, breaks tempo fingerprint
  - `compand(attack, release, threshold, ratio)` - Dynamic range jitter
  - `reverb(roomSize, damping, wetLevel)` - Spatial variation
  - `loudnorm(target, jitter)` - EBU R128 -16 LUFS ±0.5

### 4.4 Built-in Presets (Constants)
- [ ] `packages/shared/src/constants/fx-presets.ts`
  - `soft` - Minimal, own content re-upload
  - `balanced` - General music, VMAF ≥92
  - `aggressive` - Maximum uniqueness
  - `cidAware` - Content ID divergence calibrated
  - `cidAggressive` - Stronger for strict detection
  - `musicStream` - Audio-focused
  - `gaming` - Minimal visual, audio noise only

### 4.5 FX Preset CRUD
- [ ] `src/routes/fx-presets.ts` - GET/POST/PATCH/DELETE /api/fx-presets
- [ ] `POST /api/fx-presets/:id/test` - Test on sample, return metrics

### 4.6 Filter Graph Integration
- [ ] StreamService.start() → FxService.buildFilterGraph() → FFmpegManager.start()
- [ ] Custom FX filters (user string) appended after preset

### Deliverables
- Select "balanced" preset → Stream gets unique fingerprint each run
- VMAF test shows quality >92
- Audio loudness normalized to -16 LUFS with jitter
- Video crop 2% + color jitter invisible to eye but breaks detection

### Token Estimate
~8 small files, ~70 lines each = ~560 lines total