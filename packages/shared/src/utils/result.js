// Result Pattern - Error Handling Without Exceptions
export function ok(value) {
    return { ok: true, value };
}
export function err(error) {
    return { ok: false, error };
}
export function isOk(result) {
    return result.ok;
}
export function isErr(result) {
    return !result.ok;
}
export function unwrap(result) {
    if (result.ok)
        return result.value;
    throw new Error(`Attempted to unwrap Err: ${JSON.stringify(result.error)}`);
}
export function unwrapErr(result) {
    if (!result.ok)
        return result.error;
    throw new Error(`Attempted to unwrap Ok: ${JSON.stringify(result.value)}`);
}
export async function tryCatch(fn, mapError) {
    try {
        return ok(await fn());
    }
    catch (error) {
        return err(mapError(error));
    }
}
export function tryCatchSync(fn, mapError) {
    try {
        return ok(fn());
    }
    catch (error) {
        return err(mapError(error));
    }
}
export function mapResult(result, fn) {
    if (result.ok)
        return ok(fn(result.value));
    return result;
}
export function flatMapResult(result, fn) {
    if (result.ok)
        return fn(result.value);
    return result;
}
//# sourceMappingURL=result.js.map