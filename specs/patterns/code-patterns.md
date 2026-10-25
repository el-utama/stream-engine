# Stream Engine - Code Patterns (Micro-Modules)

Each pattern = one small, focused file in implementation.

## 1. Service Base (DI Pattern)
```typescript
// packages/server/src/services/base.service.ts
export abstract class BaseService {
  constructor(protected app: FastifyInstance) {}
  protected get prisma() { return this.app.prisma; }
  protected get socket() { return this.app.io; }
  protected get logger() { return this.app.log; }
  protected get config() { return this.app.config; }
}
```

## 2. Result Pattern (No Throws)
```typescript
// packages/shared/src/utils/result.ts
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(v: T) => ({ ok: true, value: v } as const);
export const err = <E>(e: E) => ({ ok: false, error: e } as const);
```

## 3. Zod Schema (Validation)
```typescript
// packages/shared/src/schemas/stream.schema.ts
export const createStreamSchema = z.object({
  name: z.string().min(1).max(100),
  accountId: z.string().cuid(),
  videoFiles: z.array(z.string()).min(1),
  outputPlatforms: z.array(z.nativeEnum(Platform)).min(1),
  // ... all fields with defaults
});
```

## 4. Filter Graph Builder (Fluent)
```typescript
// packages/ffmpeg-worker/src/filters/filter-graph.builder.ts
export class FilterGraphBuilder {
  private v: string[] = []; private a: string[] = [];
  crop(p: number) { this.v.push(`crop=iw*${1-2*p/100}:ih*${1-2*p/100}:iw*${p/100}:ih*${p/100}`); return this; }
  noiseOverlay(type: NoiseProfile, amp: number, db: number) { 
    this.a.push(`anoisesrc=c=${type}:a=${amp}[n];[0:a][n]amix=inputs=2:weights=1 ${db}[a]`); return this; 
  }
  build() { return [...this.v.map(f => `[0:v]${f}[v]`), ...this.a.map(f => `[0:a]${f}[a]`)].join(';'); }
}
```

## 5. Hardware Acceleration (Auto-Detect)
```typescript
// packages/server/src/utils/hwaccel.ts
const ENCODERS = [
  { name: 'h264_nvenc', hw: 'cuda', preset: 'p4' },
  { name: 'h264_qsv', hw: 'qsv', preset: 'medium' },
  { name: 'libx264', hw: 'none', preset: 'veryfast' }
];
export async function getBestEncoder(): Promise<Encoder> {
  const { stdout } = await execFile('ffmpeg', ['-encoders']);
  const available = new Set(stdout.match(/V\.\.\.\.\.\s+(\S+)/g)?.map(s => s.split(/\s+/)[1]) || []);
  return ENCODERS.find(e => available.has(e.name)) || ENCODERS[ENCODERS.length-1];
}
```

## 6. YouTube Broadcast (Reusable Stream)
```typescript
// packages/server/src/services/youtube.service.ts
async function ensureBroadcast(stream: Stream) {
  const liveStream = await getOrCreateLiveStream(account.channelId); // Reuse!
  const broadcast = await youtube.liveBroadcasts.insert({ 
    snippet: { title, description, scheduledStartTime: new Date().toISOString() },
    contentDetails: { enableAutoStart: true, enableAutoStop: true }
  });
  await youtube.liveBroadcasts.bind({ id: broadcast.id, streamId: liveStream.id });
  return { rtmpUrl: liveStream.cdn.ingestionInfo.ingestionAddress, streamKey: liveStream.cdn.ingestionInfo.streamName };
}
```

## 7. BullMQ Job (Stream Control)
```typescript
// packages/server/src/jobs/stream.jobs.ts
const queue = new Queue('stream-jobs', { connection: redis });
const worker = new Worker('stream-jobs', async (job) => {
  const { streamId, action } = job.data;
  if (action === 'start') await streamService.start(streamId);
  if (action === 'stop') await streamService.stop(streamId);
}, { connection: redis });
```

## 8. Socket.io Events (Real-Time)
```typescript
// packages/server/src/websocket/stream.socket.ts
io.on('connection', (socket) => {
  socket.on('stream:join', (id) => { socket.join(`stream:${id}`); emitStatus(id); });
  socket.on('stream:start', (id) => streamService.start(id));
});
export const emitStatus = (io, status) => io.to(`stream:${status.id}`).emit('stream:status', status);
```

## 9. React + Zustand (Client)
```typescript
// packages/client/src/stores/stream.store.ts
export const useStreamStore = create<StreamState>((set) => ({
  streams: new Map(),
  connect: () => { const s = io(); s.on('stream:status', (st) => set(s => ({streams: new Map(s.streams).set(st.id, st)}))); set({socket: s}); },
  startStream: (id) => fetch(`/api/streams/${id}/start`, {method: 'POST'}),
}));
```

## 10. Prisma Model (Indexed)
```prisma
// packages/server/prisma/schema.prisma
model Stream {
  id        String   @id @default(cuid())
  userId    String
  accountId String
  status    StreamStatus @default(STOPPED)
  // ... all fields
  @@index([userId, status])
  @@index([accountId, status])
  @@index([status, startedAt])
}
```

## 11. Encryption (AES-256-GCM)
```typescript
// packages/shared/src/utils/encryption.ts
export class EncryptionService {
  constructor(private masterKey: Buffer) {}
  async encrypt(t: string) { /* salt:iv:tag:ciphertext base64 */ }
  async decrypt(e: string) { /* parse and decrypt */ }
}
```

## 12. Config (Zod + Env)
```typescript
// packages/server/src/config/index.ts
export const config = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  MASTER_KEY: z.string().length(44),
  FFMPEG_HWACCEL: z.enum(['auto','nvenc','qsv','none']).default('auto'),
}).parse(process.env);
```

## File-per-Pattern Rule
Each pattern above = ONE implementation file. No mega-files. Import from shared.