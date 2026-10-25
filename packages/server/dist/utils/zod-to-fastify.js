// Zod to Fastify JSON Schema Converter
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
function cleanSchema(schema) {
    // Remove $schema property which Fastify doesn't like
    if (schema && typeof schema === 'object') {
        const { $schema, ...rest } = schema;
        // Recursively clean nested objects
        for (const key of Object.keys(rest)) {
            if (typeof rest[key] === 'object' && rest[key] !== null) {
                rest[key] = cleanSchema(rest[key]);
            }
        }
        return rest;
    }
    return schema;
}
export function toFastifySchema(zodSchema) {
    // Handle z.any() by converting to empty object with passthrough
    if (zodSchema instanceof z.ZodAny) {
        return { type: 'object', additionalProperties: true };
    }
    const schema = zodToJsonSchema(zodSchema, {
        target: 'jsonSchema7',
        basePath: '',
        definitions: {},
        $refStrategy: 'none',
    });
    return cleanSchema(schema);
}
// Helper for route schemas
export function createRouteSchema(opts) {
    const schema = {};
    if (opts.querystring)
        schema.querystring = toFastifySchema(opts.querystring);
    if (opts.params)
        schema.params = toFastifySchema(opts.params);
    if (opts.body)
        schema.body = toFastifySchema(opts.body);
    if (opts.headers)
        schema.headers = toFastifySchema(opts.headers);
    if (opts.response) {
        schema.response = {};
        for (const [code, zodSchema] of Object.entries(opts.response)) {
            const codeNum = Number(code);
            if (!isNaN(codeNum)) {
                schema.response[codeNum] = toFastifySchema(zodSchema);
            }
        }
    }
    return schema;
}
//# sourceMappingURL=zod-to-fastify.js.map