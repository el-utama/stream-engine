import { z } from 'zod';
export declare function toFastifySchema(zodSchema: z.ZodTypeAny): object;
export declare function createRouteSchema(opts: {
    querystring?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
    body?: z.ZodTypeAny;
    headers?: z.ZodTypeAny;
    response?: Record<number, z.ZodTypeAny>;
}): Record<string, any>;
//# sourceMappingURL=zod-to-fastify.d.ts.map