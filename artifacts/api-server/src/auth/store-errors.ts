export class AuthEmailConflictError extends Error {
  readonly name = "AuthEmailConflictError";
  readonly code = "AUTH_EMAIL_CONFLICT";

  constructor() {
    super("AUTH_EMAIL_CONFLICT");
  }
}

export function isPostgresEmailConflict(error: unknown): boolean {
  const visited = new Set<object>();
  let candidate: unknown = error;

  while (candidate && typeof candidate === "object" && !visited.has(candidate)) {
    visited.add(candidate);
    const record = candidate as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (
      record.code === "23505" &&
      record.constraint === "users_normalized_email_uidx"
    ) {
      return true;
    }
    candidate = record.cause;
  }

  return false;
}
