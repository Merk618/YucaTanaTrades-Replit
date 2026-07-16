import type {
  AuthAuditEvent,
  AuthRateLimitAttempt,
  AuthRateLimitResult,
  AuthSessionRecord,
  AuthStore,
  AuthTokenRecord,
  AuthUserRecord,
} from "./types";
import { AuthEmailConflictError } from "./store-errors";

function cloneUser(user: AuthUserRecord): AuthUserRecord {
  return { ...user };
}

function cloneSession(session: AuthSessionRecord): AuthSessionRecord {
  return { ...session };
}

export class MemoryAuthStore implements AuthStore {
  private readonly users = new Map<string, AuthUserRecord>();
  private readonly userIdsByEmail = new Map<string, string>();
  private readonly sessions = new Map<string, AuthSessionRecord>();
  private readonly sessionIdsByHmac = new Map<string, string>();
  private readonly passwordResetTokens = new Map<string, AuthTokenRecord>();
  private readonly emailVerificationTokens = new Map<string, AuthTokenRecord>();
  private readonly rateLimits = new Map<
    string,
    { attempts: number; blockedUntil: Date | null }
  >();
  readonly auditEvents: AuthAuditEvent[] = [];

  async checkAvailability(): Promise<boolean> {
    return true;
  }

  async createUser(user: AuthUserRecord): Promise<AuthUserRecord> {
    if (this.userIdsByEmail.has(user.normalizedEmail)) {
      throw new AuthEmailConflictError();
    }
    this.users.set(user.id, cloneUser(user));
    this.userIdsByEmail.set(user.normalizedEmail, user.id);
    return cloneUser(user);
  }

  async findUserByNormalizedEmail(email: string): Promise<AuthUserRecord | null> {
    const id = this.userIdsByEmail.get(email);
    const user = id ? this.users.get(id) : undefined;
    return user ? cloneUser(user) : null;
  }

  async findUserById(id: string): Promise<AuthUserRecord | null> {
    const user = this.users.get(id);
    return user ? cloneUser(user) : null;
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
    now: Date,
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error("AUTH_USER_NOT_FOUND");
    user.passwordHash = passwordHash;
    user.updatedAt = now;
  }

  async incrementUserAuthVersion(userId: string, now: Date): Promise<number> {
    const user = this.users.get(userId);
    if (!user) throw new Error("AUTH_USER_NOT_FOUND");
    user.authVersion += 1;
    user.updatedAt = now;
    return user.authVersion;
  }

  async markUserEmailVerified(
    userId: string,
    now: Date,
  ): Promise<AuthUserRecord | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    user.emailVerifiedAt ??= now;
    user.updatedAt = now;
    return cloneUser(user);
  }

  async createSession(session: AuthSessionRecord): Promise<AuthSessionRecord> {
    if (this.sessionIdsByHmac.has(session.tokenHmac)) {
      throw new Error("AUTH_SESSION_TOKEN_CONFLICT");
    }
    this.sessions.set(session.id, cloneSession(session));
    this.sessionIdsByHmac.set(session.tokenHmac, session.id);
    return cloneSession(session);
  }

  async findSessionByTokenHmac(
    tokenHmac: string,
  ): Promise<AuthSessionRecord | null> {
    const id = this.sessionIdsByHmac.get(tokenHmac);
    const session = id ? this.sessions.get(id) : undefined;
    return session ? cloneSession(session) : null;
  }

  async touchSession(
    sessionId: string,
    lastSeenAt: Date,
    idleExpiresAt: Date,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.revokedAt) return;
    session.lastSeenAt = lastSeenAt;
    session.idleExpiresAt = idleExpiresAt;
  }

  async revokeSession(
    sessionId: string,
    now: Date,
    reason: string,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && !session.revokedAt) {
      session.revokedAt = now;
      session.revocationReason = reason;
    }
  }

  async revokeUserSessions(
    userId: string,
    now: Date,
    reason: string,
  ): Promise<number> {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = now;
        session.revocationReason = reason;
        count += 1;
      }
    }
    return count;
  }

  async replacePasswordResetToken(token: AuthTokenRecord): Promise<void> {
    for (const candidate of this.passwordResetTokens.values()) {
      if (candidate.userId === token.userId && !candidate.usedAt) {
        candidate.usedAt = token.createdAt;
      }
    }
    this.passwordResetTokens.set(token.tokenHmac, { ...token });
  }

  async consumePasswordResetToken(
    tokenHmac: string,
    now: Date,
  ): Promise<string | null> {
    const token = this.passwordResetTokens.get(tokenHmac);
    if (!token || token.usedAt || token.expiresAt <= now) return null;
    token.usedAt = now;
    return token.userId;
  }

  async completePasswordReset(
    tokenHmac: string,
    passwordHash: string,
    now: Date,
  ): Promise<string | null> {
    const token = this.passwordResetTokens.get(tokenHmac);
    if (!token || token.usedAt || token.expiresAt <= now) return null;
    const user = this.users.get(token.userId);
    if (!user) return null;
    token.usedAt = now;
    user.passwordHash = passwordHash;
    user.authVersion += 1;
    user.updatedAt = now;
    for (const session of this.sessions.values()) {
      if (session.userId === user.id && !session.revokedAt) {
        session.revokedAt = now;
        session.revocationReason = "password_reset";
      }
    }
    for (const candidate of this.passwordResetTokens.values()) {
      if (candidate.userId === user.id && !candidate.usedAt) {
        candidate.usedAt = now;
      }
    }
    return user.id;
  }

  async replaceEmailVerificationToken(token: AuthTokenRecord): Promise<void> {
    for (const candidate of this.emailVerificationTokens.values()) {
      if (candidate.userId === token.userId && !candidate.usedAt) {
        candidate.usedAt = token.createdAt;
      }
    }
    this.emailVerificationTokens.set(token.tokenHmac, { ...token });
  }

  async consumeEmailVerificationToken(
    tokenHmac: string,
    now: Date,
  ): Promise<string | null> {
    const token = this.emailVerificationTokens.get(tokenHmac);
    if (!token || token.usedAt || token.expiresAt <= now) return null;
    token.usedAt = now;
    return token.userId;
  }

  async completeEmailVerification(
    tokenHmac: string,
    now: Date,
  ): Promise<AuthUserRecord | null> {
    const token = this.emailVerificationTokens.get(tokenHmac);
    if (!token || token.usedAt || token.expiresAt <= now) return null;
    const user = this.users.get(token.userId);
    if (!user) return null;

    token.usedAt = now;
    user.emailVerifiedAt ??= now;
    user.updatedAt = now;
    for (const candidate of this.emailVerificationTokens.values()) {
      if (candidate.userId === user.id && !candidate.usedAt) {
        candidate.usedAt = now;
      }
    }
    return cloneUser(user);
  }

  async recordRateLimitAttempt(
    input: AuthRateLimitAttempt,
  ): Promise<AuthRateLimitResult> {
    const key = `${input.scope}:${input.subjectHmac}:${input.windowStartedAt.toISOString()}`;
    const current = this.rateLimits.get(key) ?? {
      attempts: 0,
      blockedUntil: null,
    };

    if (current.blockedUntil && current.blockedUntil > input.now) {
      current.attempts += 1;
      this.rateLimits.set(key, current);
      return {
        allowed: false,
        attempts: current.attempts,
        retryAt: current.blockedUntil,
      };
    }

    current.attempts += 1;
    if (current.attempts > input.limit) {
      current.blockedUntil = new Date(input.now.getTime() + input.blockMs);
    }
    this.rateLimits.set(key, current);
    return {
      allowed: current.attempts <= input.limit,
      attempts: current.attempts,
      retryAt: current.blockedUntil,
    };
  }

  async appendAuditEvent(event: AuthAuditEvent): Promise<void> {
    this.auditEvents.push({ ...event });
  }
}
