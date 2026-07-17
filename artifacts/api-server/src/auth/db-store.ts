import {
  authAuditEventsTable,
  authRateLimitsTable,
  authSchemaVersionsTable,
  authSessionsTable,
  db,
  emailVerificationTokensTable,
  passwordResetTokensTable,
  usersTable,
} from "@workspace/db";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type {
  AuthAuditEvent,
  AuthRateLimitAttempt,
  AuthRateLimitResult,
  AuthSessionRecord,
  AuthStore,
  AuthTokenRecord,
  AuthUserRecord,
} from "./types";
import {
  AuthEmailConflictError,
  isPostgresEmailConflict,
} from "./store-errors";

function mapUser(row: typeof usersTable.$inferSelect): AuthUserRecord {
  return {
    id: row.id,
    email: row.email,
    normalizedEmail: row.normalizedEmail,
    displayName: row.displayName,
    passwordHash: row.passwordHash,
    emailVerifiedAt: row.emailVerifiedAt,
    disabledAt: row.disabledAt,
    authVersion: row.authVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSession(
  row: typeof authSessionsTable.$inferSelect,
): AuthSessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    authVersion: row.authVersion,
    tokenHmac: row.tokenHmac,
    csrfTokenHmac: row.csrfTokenHmac,
    rotatedFromSessionId: row.rotatedFromSessionId,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
    idleExpiresAt: row.idleExpiresAt,
    absoluteExpiresAt: row.absoluteExpiresAt,
    revokedAt: row.revokedAt,
    revocationReason: row.revocationReason,
  };
}

export class DbAuthStore implements AuthStore {
  async checkAvailability(): Promise<boolean> {
    try {
      const [row] = await db
        .select({ version: authSchemaVersionsTable.version })
        .from(authSchemaVersionsTable)
        .where(eq(authSchemaVersionsTable.version, 1))
        .limit(1);
      return row?.version === 1;
    } catch {
      return false;
    }
  }

  async createUser(user: AuthUserRecord): Promise<AuthUserRecord> {
    try {
      const [row] = await db.insert(usersTable).values(user).returning();
      if (!row) throw new Error("AUTH_USER_CREATE_FAILED");
      return mapUser(row);
    } catch (error) {
      if (isPostgresEmailConflict(error)) {
        throw new AuthEmailConflictError();
      }
      throw error;
    }
  }

  async findUserByNormalizedEmail(email: string): Promise<AuthUserRecord | null> {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.normalizedEmail, email))
      .limit(1);
    return row ? mapUser(row) : null;
  }

  async findUserById(id: string): Promise<AuthUserRecord | null> {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return row ? mapUser(row) : null;
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
    now: Date,
  ): Promise<void> {
    await db
      .update(usersTable)
      .set({ passwordHash, updatedAt: now })
      .where(eq(usersTable.id, userId));
  }

  async incrementUserAuthVersion(userId: string, now: Date): Promise<number> {
    const [row] = await db
      .update(usersTable)
      .set({
        authVersion: sql`${usersTable.authVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(usersTable.id, userId))
      .returning({ authVersion: usersTable.authVersion });
    if (!row) throw new Error("AUTH_USER_NOT_FOUND");
    return row.authVersion;
  }

  async markUserEmailVerified(
    userId: string,
    now: Date,
  ): Promise<AuthUserRecord | null> {
    const [row] = await db
      .update(usersTable)
      .set({ emailVerifiedAt: now, updatedAt: now })
      .where(and(eq(usersTable.id, userId), isNull(usersTable.emailVerifiedAt)))
      .returning();
    if (row) return mapUser(row);
    return this.findUserById(userId);
  }

  async createSession(session: AuthSessionRecord): Promise<AuthSessionRecord> {
    if (session.kind === "development_review") {
      throw new Error("DEVELOPMENT_REVIEW_SESSION_PERSISTENCE_FORBIDDEN");
    }
    const [row] = await db
      .insert(authSessionsTable)
      .values({ ...session, kind: session.kind })
      .returning();
    if (!row) throw new Error("AUTH_SESSION_CREATE_FAILED");
    return mapSession(row);
  }

  async findSessionByTokenHmac(
    tokenHmac: string,
  ): Promise<AuthSessionRecord | null> {
    const [row] = await db
      .select()
      .from(authSessionsTable)
      .where(eq(authSessionsTable.tokenHmac, tokenHmac))
      .limit(1);
    return row ? mapSession(row) : null;
  }

  async touchSession(
    sessionId: string,
    lastSeenAt: Date,
    idleExpiresAt: Date,
  ): Promise<void> {
    await db
      .update(authSessionsTable)
      .set({ lastSeenAt, idleExpiresAt })
      .where(
        and(
          eq(authSessionsTable.id, sessionId),
          isNull(authSessionsTable.revokedAt),
        ),
      );
  }

  async revokeSession(
    sessionId: string,
    now: Date,
    reason: string,
  ): Promise<void> {
    await db
      .update(authSessionsTable)
      .set({ revokedAt: now, revocationReason: reason })
      .where(
        and(
          eq(authSessionsTable.id, sessionId),
          isNull(authSessionsTable.revokedAt),
        ),
      );
  }

  async revokeUserSessions(
    userId: string,
    now: Date,
    reason: string,
  ): Promise<number> {
    const rows = await db
      .update(authSessionsTable)
      .set({ revokedAt: now, revocationReason: reason })
      .where(
        and(
          eq(authSessionsTable.userId, userId),
          isNull(authSessionsTable.revokedAt),
        ),
      )
      .returning({ id: authSessionsTable.id });
    return rows.length;
  }

  async replacePasswordResetToken(token: AuthTokenRecord): Promise<void> {
    await db.transaction(async (transaction) => {
      const [lockedUser] = await transaction
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, token.userId))
        .for("update");
      if (!lockedUser) throw new Error("AUTH_USER_NOT_FOUND");

      await transaction
        .update(passwordResetTokensTable)
        .set({ usedAt: token.createdAt })
        .where(
          and(
            eq(passwordResetTokensTable.userId, token.userId),
            isNull(passwordResetTokensTable.usedAt),
          ),
        );
      await transaction.insert(passwordResetTokensTable).values(token);
    });
  }

  async consumePasswordResetToken(
    tokenHmac: string,
    now: Date,
  ): Promise<string | null> {
    const [row] = await db
      .update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokensTable.tokenHmac, tokenHmac),
          isNull(passwordResetTokensTable.usedAt),
          gt(passwordResetTokensTable.expiresAt, now),
        ),
      )
      .returning({ userId: passwordResetTokensTable.userId });
    return row?.userId ?? null;
  }

  async completePasswordReset(
    tokenHmac: string,
    passwordHash: string,
    now: Date,
  ): Promise<string | null> {
    return db.transaction(async (transaction) => {
      const [candidate] = await transaction
        .select({ userId: passwordResetTokensTable.userId })
        .from(passwordResetTokensTable)
        .where(eq(passwordResetTokensTable.tokenHmac, tokenHmac))
        .limit(1);
      if (!candidate) return null;

      const [lockedUser] = await transaction
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, candidate.userId))
        .for("update");
      if (!lockedUser) return null;

      const [token] = await transaction
        .update(passwordResetTokensTable)
        .set({ usedAt: now })
        .where(
          and(
            eq(passwordResetTokensTable.tokenHmac, tokenHmac),
            eq(passwordResetTokensTable.userId, lockedUser.id),
            isNull(passwordResetTokensTable.usedAt),
            gt(passwordResetTokensTable.expiresAt, now),
          ),
        )
        .returning({ userId: passwordResetTokensTable.userId });
      if (!token) return null;

      await transaction
        .update(usersTable)
        .set({
          passwordHash,
          authVersion: sql`${usersTable.authVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(usersTable.id, token.userId));
      await transaction
        .update(authSessionsTable)
        .set({ revokedAt: now, revocationReason: "password_reset" })
        .where(
          and(
            eq(authSessionsTable.userId, token.userId),
            isNull(authSessionsTable.revokedAt),
          ),
        );
      await transaction
        .update(passwordResetTokensTable)
        .set({ usedAt: now })
        .where(
          and(
            eq(passwordResetTokensTable.userId, token.userId),
            isNull(passwordResetTokensTable.usedAt),
          ),
        );
      return token.userId;
    });
  }

  async replaceEmailVerificationToken(token: AuthTokenRecord): Promise<void> {
    await db.transaction(async (transaction) => {
      const [lockedUser] = await transaction
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, token.userId))
        .for("update");
      if (!lockedUser) throw new Error("AUTH_USER_NOT_FOUND");

      await transaction
        .update(emailVerificationTokensTable)
        .set({ usedAt: token.createdAt })
        .where(
          and(
            eq(emailVerificationTokensTable.userId, token.userId),
            isNull(emailVerificationTokensTable.usedAt),
          ),
        );
      await transaction.insert(emailVerificationTokensTable).values(token);
    });
  }

  async consumeEmailVerificationToken(
    tokenHmac: string,
    now: Date,
  ): Promise<string | null> {
    const [row] = await db
      .update(emailVerificationTokensTable)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokensTable.tokenHmac, tokenHmac),
          isNull(emailVerificationTokensTable.usedAt),
          gt(emailVerificationTokensTable.expiresAt, now),
        ),
      )
      .returning({ userId: emailVerificationTokensTable.userId });
    return row?.userId ?? null;
  }

  async completeEmailVerification(
    tokenHmac: string,
    now: Date,
  ): Promise<AuthUserRecord | null> {
    return db.transaction(async (transaction) => {
      const [candidate] = await transaction
        .select({ userId: emailVerificationTokensTable.userId })
        .from(emailVerificationTokensTable)
        .where(eq(emailVerificationTokensTable.tokenHmac, tokenHmac))
        .limit(1);
      if (!candidate) return null;

      const [lockedUser] = await transaction
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, candidate.userId))
        .for("update");
      if (!lockedUser) return null;

      const [token] = await transaction
        .update(emailVerificationTokensTable)
        .set({ usedAt: now })
        .where(
          and(
            eq(emailVerificationTokensTable.tokenHmac, tokenHmac),
            eq(emailVerificationTokensTable.userId, lockedUser.id),
            isNull(emailVerificationTokensTable.usedAt),
            gt(emailVerificationTokensTable.expiresAt, now),
          ),
        )
        .returning({ userId: emailVerificationTokensTable.userId });
      if (!token) return null;

      const [user] = await transaction
        .update(usersTable)
        .set({ emailVerifiedAt: now, updatedAt: now })
        .where(eq(usersTable.id, token.userId))
        .returning();
      if (!user) throw new Error("AUTH_USER_NOT_FOUND");

      await transaction
        .update(emailVerificationTokensTable)
        .set({ usedAt: now })
        .where(
          and(
            eq(emailVerificationTokensTable.userId, token.userId),
            isNull(emailVerificationTokensTable.usedAt),
          ),
        );
      return mapUser(user);
    });
  }

  async recordRateLimitAttempt(
    input: AuthRateLimitAttempt,
  ): Promise<AuthRateLimitResult> {
    const [row] = await db
      .insert(authRateLimitsTable)
      .values({
        id: input.id,
        scope: input.scope,
        subjectHmac: input.subjectHmac,
        windowStartedAt: input.windowStartedAt,
        attempts: 1,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: [
          authRateLimitsTable.scope,
          authRateLimitsTable.subjectHmac,
          authRateLimitsTable.windowStartedAt,
        ],
        set: {
          attempts: sql`${authRateLimitsTable.attempts} + 1`,
          updatedAt: input.now,
        },
      })
      .returning();
    if (!row) throw new Error("AUTH_RATE_LIMIT_WRITE_FAILED");

    if (row.blockedUntil && row.blockedUntil > input.now) {
      return {
        allowed: false,
        attempts: row.attempts,
        retryAt: row.blockedUntil,
      };
    }

    if (row.attempts > input.limit) {
      const blockedUntil = new Date(input.now.getTime() + input.blockMs);
      await db
        .update(authRateLimitsTable)
        .set({ blockedUntil, updatedAt: input.now })
        .where(eq(authRateLimitsTable.id, row.id));
      return { allowed: false, attempts: row.attempts, retryAt: blockedUntil };
    }

    return { allowed: true, attempts: row.attempts, retryAt: null };
  }

  async appendAuditEvent(event: AuthAuditEvent): Promise<void> {
    await db.insert(authAuditEventsTable).values(event);
  }
}
