export type Result<T, E> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};
export declare function ok<T>(value: T): Result<T, never>;
export declare function err<E>(error: E): Result<never, E>;
export declare function isOk<T, E>(result: Result<T, E>): result is {
    ok: true;
    value: T;
};
export declare function isErr<T, E>(result: Result<T, E>): result is {
    ok: false;
    error: E;
};
export declare function unwrap<T, E>(result: Result<T, E>): T;
export declare function unwrapErr<T, E>(result: Result<T, E>): E;
export declare function tryCatch<T, E>(fn: () => Promise<T>, mapError: (error: unknown) => E): Promise<Result<T, E>>;
export declare function tryCatchSync<T, E>(fn: () => T, mapError: (error: unknown) => E): Result<T, E>;
export declare function mapResult<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
export declare function flatMapResult<T, E, U>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>;
//# sourceMappingURL=result.d.ts.map