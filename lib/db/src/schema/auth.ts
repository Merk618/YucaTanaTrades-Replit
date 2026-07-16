import { isNull } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const authSessionKindEnum = pgEnum("auth_session_kind", [
  "guest",
  "authenticated",
]);

export const authAuditOutcomeEnum = pgEnum("auth_audit_outcome", [
  "success",
  "failure",
  "blocked",
]);

export const authSchemaVersionsTable = pgTable("auth_schema_versions", {
  version: integer("version").primaryKey(),
  appliedAt: timestamp("applied_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    displayName: text("display_name"),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    authVersion: integer("auth_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_normalized_email_uidx").on(table.normalizedEmail),
  ],
);

export const authSessionsTable = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "cascade",
    }),
    kind: authSessionKindEnum("kind").notNull(),
    authVersion: integer("auth_version"),
    tokenHmac: text("token_hmac").notNull(),
    csrfTokenHmac: text("csrf_token_hmac").notNull(),
    rotatedFromSessionId: uuid("rotated_from_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    idleExpiresAt: timestamp("idle_expires_at", { withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp("absolute_expires_at", {
      withTimezone: true,
    }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_hmac_uidx").on(table.tokenHmac),
    index("auth_sessions_user_id_idx").on(table.userId),
    index("auth_sessions_expiry_idx").on(
      table.idleExpiresAt,
      table.absoluteExpiresAt,
    ),
  ],
);

export const passwordResetTokensTable = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHmac: text("token_hmac").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hmac_uidx").on(table.tokenHmac),
    uniqueIndex("password_reset_tokens_active_user_uidx")
      .on(table.userId)
      .where(isNull(table.usedAt)),
    index("password_reset_tokens_user_id_idx").on(table.userId),
    index("password_reset_tokens_expiry_idx").on(table.expiresAt),
  ],
);

export const emailVerificationTokensTable = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHmac: text("token_hmac").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_hmac_uidx").on(table.tokenHmac),
    uniqueIndex("email_verification_tokens_active_user_uidx")
      .on(table.userId)
      .where(isNull(table.usedAt)),
    index("email_verification_tokens_user_id_idx").on(table.userId),
    index("email_verification_tokens_expiry_idx").on(table.expiresAt),
  ],
);

export const authRateLimitsTable = pgTable(
  "auth_rate_limits",
  {
    id: uuid("id").primaryKey(),
    scope: text("scope").notNull(),
    subjectHmac: text("subject_hmac").notNull(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    attempts: integer("attempts").notNull().default(1),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_rate_limits_window_uidx").on(
      table.scope,
      table.subjectHmac,
      table.windowStartedAt,
    ),
    index("auth_rate_limits_cleanup_idx").on(
      table.windowStartedAt,
      table.blockedUntil,
    ),
  ],
);

export const authAuditEventsTable = pgTable(
  "auth_audit_events",
  {
    id: uuid("id").primaryKey(),
    event: text("event").notNull(),
    outcome: authAuditOutcomeEnum("outcome").notNull(),
    code: text("code").notNull(),
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id").references(() => authSessionsTable.id, {
      onDelete: "set null",
    }),
    subjectHmac: text("subject_hmac"),
    requestId: text("request_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_audit_events_user_id_idx").on(table.userId),
    index("auth_audit_events_occurred_at_idx").on(table.occurredAt),
  ],
);

export type UserRow = typeof usersTable.$inferSelect;
export type AuthSchemaVersionRow =
  typeof authSchemaVersionsTable.$inferSelect;
export type AuthSessionRow = typeof authSessionsTable.$inferSelect;
export type PasswordResetTokenRow =
  typeof passwordResetTokensTable.$inferSelect;
export type EmailVerificationTokenRow =
  typeof emailVerificationTokensTable.$inferSelect;
export type AuthRateLimitRow = typeof authRateLimitsTable.$inferSelect;
export type AuthAuditEventRow = typeof authAuditEventsTable.$inferSelect;
