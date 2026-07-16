export type AuthSessionKind = "guest" | "authenticated";
export type AuthAuditOutcome = "success" | "failure" | "blocked";

export interface AuthUserRecord {
  id: string;
  email: string;
  normalizedEmail: string;
  displayName: string | null;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  disabledAt: Date | null;
  authVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionRecord {
  id: string;
  userId: string | null;
  kind: AuthSessionKind;
  authVersion: number | null;
  tokenHmac: string;
  csrfTokenHmac: string;
  rotatedFromSessionId: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
  revocationReason: string | null;
}

export interface AuthTokenRecord {
  id: string;
  userId: string;
  tokenHmac: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface AuthRateLimitAttempt {
  id: string;
  scope: string;
  subjectHmac: string;
  windowStartedAt: Date;
  now: Date;
  limit: number;
  blockMs: number;
}

export interface AuthRateLimitResult {
  allowed: boolean;
  attempts: number;
  retryAt: Date | null;
}

export interface AuthAuditEvent {
  id: string;
  event: string;
  outcome: AuthAuditOutcome;
  code: string;
  userId: string | null;
  sessionId: string | null;
  subjectHmac: string | null;
  requestId: string | null;
  occurredAt: Date;
}

export interface AuthStore {
  checkAvailability(): Promise<boolean>;
  createUser(user: AuthUserRecord): Promise<AuthUserRecord>;
  findUserByNormalizedEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(id: string): Promise<AuthUserRecord | null>;
  updateUserPassword(userId: string, passwordHash: string, now: Date): Promise<void>;
  incrementUserAuthVersion(userId: string, now: Date): Promise<number>;
  markUserEmailVerified(userId: string, now: Date): Promise<AuthUserRecord | null>;

  createSession(session: AuthSessionRecord): Promise<AuthSessionRecord>;
  findSessionByTokenHmac(tokenHmac: string): Promise<AuthSessionRecord | null>;
  touchSession(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void>;
  revokeSession(sessionId: string, now: Date, reason: string): Promise<void>;
  revokeUserSessions(userId: string, now: Date, reason: string): Promise<number>;

  replacePasswordResetToken(token: AuthTokenRecord): Promise<void>;
  consumePasswordResetToken(tokenHmac: string, now: Date): Promise<string | null>;
  completePasswordReset(
    tokenHmac: string,
    passwordHash: string,
    now: Date,
  ): Promise<string | null>;

  replaceEmailVerificationToken(token: AuthTokenRecord): Promise<void>;
  consumeEmailVerificationToken(tokenHmac: string, now: Date): Promise<string | null>;
  completeEmailVerification(
    tokenHmac: string,
    now: Date,
  ): Promise<AuthUserRecord | null>;

  recordRateLimitAttempt(input: AuthRateLimitAttempt): Promise<AuthRateLimitResult>;
  appendAuditEvent(event: AuthAuditEvent): Promise<void>;
}

export interface PublicAuthUser {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}

export interface RequestMetadata {
  ipAddress: string;
  requestId?: string | undefined;
}
