import type { AuthStore } from "./types";

export class AuthStoreTimeoutError extends Error {
  readonly name = "AuthStoreTimeoutError";

  constructor(operation: PropertyKey) {
    super(`Authentication storage operation timed out: ${String(operation)}`);
  }
}

function runWithTimeout<T>(
  operation: () => Promise<T>,
  operationName: PropertyKey,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new AuthStoreTimeoutError(operationName)),
      timeoutMs,
    );
    timer.unref?.();
  });

  return Promise.race([Promise.resolve().then(operation), timeout]).finally(
    () => {
      if (timer) clearTimeout(timer);
    },
  );
}

export function withAuthStoreTimeout(
  store: AuthStore,
  timeoutMs: number,
): AuthStore {
  return new Proxy(store, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) =>
        runWithTimeout(
          () => Reflect.apply(value, target, args) as Promise<unknown>,
          property,
          timeoutMs,
        );
    },
  });
}
