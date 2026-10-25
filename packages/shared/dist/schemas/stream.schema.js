// Zod Schemas for Stream CRUD
import { z } from 'zod';
import { SourceType, LoopMode, Platform, AudioSource, NoiseProfile } from '../enums.js';
export const createStreamSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    accountId: z.string().cuid(),
    sourceType: z.nativeEnum(SourceType),
    videoFiles: z.array(z.string().min(1)).min(1).optional(),
    playlistId: z.string().cuid().optional(),
    rtmpPushKey: z.string().optional(),
    outputPlatforms: z.array(z.nativeEnum(Platform)).min(1),
    customRtmpUrls: z.record(z.object({
        url: z.string().url(),
        key: z.string().min(1),
    })).optional(),
    resolution: z.string().regex(/^\d+x\d+$/).default('1920x1080'),
    fps: z.number().int().min(15).max(60).default(30),
    videoBitrate: z.number().int().min(500).max(20000).default(4000),
    audioBitrate: z.number().int().min(64).max(320).default(128),
    codec: z.string().default('libx264'),
    preset: z.string().default('veryfast'),
    loopMode: z.nativeEnum(LoopMode).default(LoopMode.INFINITE),
    shuffleEnabled: z.boolean().default(false),
    crossfadeDuration: z.number().int().min(0).max(10).default(3),
    fxPresetId: z.string().cuid().optional(),
    customFxFilters: z.string().optional(),
    audioSource: z.nativeEnum(AudioSource).default(AudioSource.VIDEO),
    audioFiles: z.array(z.string()).default([]),
    noiseProfile: z.nativeEnum(NoiseProfile).optional(),
    noiseAmplitude: z.number().min(0).max(1).default(0.01),
    scheduleId: z.string().cuid().optional(),
    maxDuration: z.number().int().min(1).max(168).optional(),
    autoRestart: z.boolean().default(true),
    titleTemplate: z.string().max(200).optional(),
    descriptionTemplate: z.string().max(5000).optional(),
    tagsTemplate: z.string().max(500).optional(),
    thumbnailPath: z.string().optional(),
});
export const updateStreamSchema = createStreamSchema.partial().extend({
    id: z.string().cuid(),
});
export const streamQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.string().optional(),
    accountId: z.string().cuid().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export const streamIdParamSchema = z.object({
    id: z.string().cuid(),
});
//# sourceMappingURL=stream.schema.js.map