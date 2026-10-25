// Result Pattern - Error Handling Without Exceptions

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw new Error(`Attempted to unwrap Err: ${JSON.stringify(result.error)}`);
}

export function unwrapErr<T, E>(result: Result<T, E>): E {
  if (!result.ok) return result.error;
  throw new Error(`Attempted to unwrap Ok: ${JSON.stringify(result.value)}`);
}

export async function tryCatch<T, E>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(mapError(error));
  }
}

export function tryCatchSync<T, E>(
  fn: () => T,
  mapError: (error: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(mapError(error));
  }
}

export function mapResult<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) return ok(fn(result.value));
  return result;
}

export function flatMapResult<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) return fn(result.value);
  return result;
}