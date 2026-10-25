// Zod Schemas for Auth

import { z } from 'zod';

export const authUrlQuerySchema = z.object({
  state: z.string().optional(),
});

export const authCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
  scope: z.string().optional(),
  authuser: z.string().optional(),
  prompt: z.string().optional(),
});

export const accountResponseSchema = z.object({
  id: z.string().cuid(),
  channelId: z.string(),
  channelName: z.string(),
  channelHandle: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const refreshTokenSchema = z.object({
  accountId: z.string().cuid(),
});

export type AuthUrlQuery = z.infer<typeof authUrlQuerySchema>;
export type AuthCallback = z.infer<typeof authCallbackSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;