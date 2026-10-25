import { z } from 'zod';
export declare const authUrlQuerySchema: z.ZodObject<{
    state: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    state?: string | undefined;
}, {
    state?: string | undefined;
}>;
export declare const authCallbackSchema: z.ZodObject<{
    code: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    authuser: z.ZodOptional<z.ZodString>;
    prompt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    state?: string | undefined;
    scope?: string | undefined;
    authuser?: string | undefined;
    prompt?: string | undefined;
}, {
    code: string;
    state?: string | undefined;
    scope?: string | undefined;
    authuser?: string | undefined;
    prompt?: string | undefined;
}>;
export declare const accountResponseSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    channelName: z.ZodString;
    channelHandle: z.ZodNullable<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    channelId: string;
    channelName: string;
    channelHandle: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
}, {
    id: string;
    channelId: string;
    channelName: string;
    channelHandle: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    accountId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accountId: string;
}, {
    accountId: string;
}>;
export type AuthUrlQuery = z.infer<typeof authUrlQuerySchema>;
export type AuthCallback = z.infer<typeof authCallbackSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
//# sourceMappingURL=auth.schema.d.ts.map