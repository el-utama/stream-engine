# Stream Engine - Core Rules (Token-Friendly)

## CRITICAL (Block on Violation)

| Rule | Description | Correct Pattern |
|------|-------------|-----------------|
| **R1** | Architecture compliance - use services, not direct access | `app.streamService.start()` not `prisma.stream.update()` in routes |
| **R2** | Token encryption - never store/log plaintext | `encryption.encrypt(token)` / `encryption.decrypt(enc)` |
| **R3** | Zod validation - all external input | `schema.parse(req.body)` in every route |
| **R4** | FFmpeg via manager - no direct spawn | `ffmpegManager.start(streamId, filterGraph)` |
| **R5** | Result pattern - no throws in services | `Result<T, E>` with `ok()`/`err()` |

## WARNING (Review Required)

| Rule | Description |
|------|-------------|
| **R6** | Real-time updates - emit Socket.io on all state changes |
| **R7** | Database indexes - every query path indexed |
| **R8** | HW accel fallback - auto-detect, never hardcode encoder |
| **R9** | YouTube quota - reuse liveStream, batch calls |
| **R10** | Music-first - audio bitrate ≥128k, video adapts |

## FORBIDDEN PATTERNS

- `any` type → use `unknown` + type guards
- `try/catch` in services → use `Result<T, E>`
- Direct `prisma` in routes → use Service layer
- `spawn('ffmpeg')` → use `FfmpegManager`
- Hardcoded ports/URLs → use Config service
- Plaintext secrets in logs → use Encryption service