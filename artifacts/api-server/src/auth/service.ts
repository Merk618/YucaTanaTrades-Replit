import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  deriveSynchronizerToken,
  domainHmac,
  generateOpaqueToken,
  hashPassword,
  normalizeEmail,
  safeHmacEqual,
  verifyPassword,
  type Argon2idOptions,
} from "./crypto";
import type {
  AuthAuditOutcome,
  AuthSessionRecord,
  AuthStore,
  AuthUserRecord,
  PublicAuthUser,
  RequestMetadata,
} from "./types";
import { AuthEmailConflictError } from "./store-errors";

export interface AuthServiceConfig {
  enabled: boolean;
  secret: string;
  exposeDevelopmentTokens: boolean;
  features: {
    registration: boolean;
    passwordReset: boolean;
    emailVerification: boolean;
  };
  password: Argon2idOptions;
  session: {
    guestTtlMs: number;
    idleTtlMs: number;
    absoluteTtlMs: number;
  };
  tokenTtl: {
    passwordResetMs: number;
    emailVerificationMs: number;
  };
}

export type AuthErrorCode =
  | "AUTH_DISABLED"
  | "FEATURE_DISABLED"
  | "SESSION_REQUIRED"
  | "SESSION_EXPIRED"
  | "CSRF_INVALID"
  | "INVALID_CREDENTIALS"
  | "REGISTRATION_UNAVAILABLE"
  | "INVALID_OR_EXPIRED_RESET_TOKEN"
  | "INVALID_OR_EXPIRED_VERIFICATION_TOKEN"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR";

export class AuthServiceError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export interface PresentedAuthSession {
  session: AuthSessionRecord;
  user: AuthUserRecord | null;
  csrfToken: string;
}

export interface AuthSessionEnvelope {
  state: "guest" | "authenticated" | "expired";
  cookieToken: string;
  cookieExpiresAt: Date;
  csrfToken: string;
  user: PublicAuthUser | null;
}

interface IssuedSession {
  presented: PresentedAuthSession;
  rawToken: string;
}

interface TokenDeliveryResult {
  accepted: true;
  delivery: "unavailable";
  developmentToken?: string | undefined;
}

const RATE_RULES = {
  guestSessionIp: {
    scope: "guest-session-ip",
    limit: 30,
    windowMs: 15 * 60_000,
  },
  signInIp: { scope: "sign-in-ip", limit: 10, windowMs: 15 * 60_000 },
  signInEmail: { scope: "sign-in-email", limit: 6, windowMs: 15 * 60_000 },
  registrationIp: { scope: "registration-ip", limit: 5, windowMs: 60 * 60_000 },
  registrationEmail: {
    scope: "registration-email",
    limit: 3,
    windowMs: 60 * 60_000,
  },
  forgotIp: { scope: "forgot-ip", limit: 5, windowMs: 15 * 60_000 },
  forgotEmail: { scope: "forgot-email", limit: 3, windowMs: 60 * 60_000 },
  resetIp: { scope: "reset-ip", limit: 10, windowMs: 15 * 60_000 },
  resetToken: { scope: "reset-token", limit: 5, windowMs: 15 * 60_000 },
  verifyRequest: { scope: "verify-request", limit: 5, windowMs: 60 * 60_000 },
  verifyCompleteIp: {
    scope: "verify-complete-ip",
    limit: 10,
    windowMs: 15 * 60_000,
  },
  verifyCompleteToken: {
    scope: "verify-complete-token",
    limit: 10,
    windowMs: 15 * 60_000,
  },
} as const;

function publicUser(user: AuthUserRecord): PublicAuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerifiedAt !== null,
  };
}

function presentationEmail(email: string): string {
  return email.trim().normalize("NFKC");
}

const canonicalEmailSchema = z
  .string()
  .transform(presentationEmail)
  .pipe(z.string().max(320).email());

function validatedEmail(email: string): {
  presentation: string;
  normalized: string;
} {
  const parsed = canonicalEmailSchema.safeParse(email);
  if (!parsed.success) {
    throw new AuthServiceError("VALIDATION_ERROR", 400, "Invalid request data.");
  }
  const presentation = parsed.data;
  const normalized = normalizeEmail(presentation);
  return { presentation, normalized };
}

function validatedPassword(password: string): string {
  if (
    password.length < 12 ||
    password.length > 256 ||
    Buffer.byteLength(password, "utf8") > 1024
  ) {
    throw new AuthServiceError("VALIDATION_ERROR", 400, "Invalid request data.");
  }
  return password;
}

function validatedDisplayName(displayName: string | null | undefined): string | null {
  if (displayName == null || displayName.trim() === "") return null;
  const normalized = displayName.trim().normalize("NFKC");
  if (normalized.length > 100) {
    throw new AuthServiceError("VALIDATION_ERROR", 400, "Invalid request data.");
  }
  return normalized;
}

export class AuthService {
  private readonly now: () => Date;
  private dummyPasswordHash: Promise<string> | null = null;

  constructor(
    private readonly store: AuthStore,
    private readonly config: AuthServiceConfig,
    now: () => Date = () => new Date(),
  ) {
    this.now = now;
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  get featureFlags(): AuthServiceConfig["features"] {
    return { ...this.config.features };
  }

  async checkAvailability(): Promise<boolean> {
    if (!this.config.enabled) return false;
    try {
      return await this.store.checkAvailability();
    } catch {
      return false;
    }
  }

  async getOrCreateSession(
    rawToken: string | null,
    metadata: RequestMetadata,
  ): Promise<AuthSessionEnvelope> {
    this.assertEnabled();
    if (rawToken) {
      const existing = await this.resolvePresentedSession(rawToken);
      if (existing) {
        return {
          state: existing.user ? "authenticated" : "guest",
          cookieToken: rawToken,
          cookieExpiresAt: existing.session.absoluteExpiresAt,
          csrfToken: existing.csrfToken,
          user: existing.user ? publicUser(existing.user) : null,
        };
      }
    }

    await this.enforceRate(RATE_RULES.guestSessionIp, metadata.ipAddress);
    const guest = await this.issueSession(null, null, null);
    return {
      state: rawToken ? "expired" : "guest",
      cookieToken: guest.rawToken,
      cookieExpiresAt: guest.presented.session.absoluteExpiresAt,
      csrfToken: guest.presented.csrfToken,
      user: null,
    };
  }

  async createGuestSession(
    state: "guest" | "expired" = "guest",
  ): Promise<AuthSessionEnvelope> {
    this.assertEnabled();
    const guest = await this.issueSession(null, null, null);
    return this.guestEnvelopeFromIssued(guest, state);
  }

  async resolvePresentedSession(
    rawToken: string | null,
  ): Promise<PresentedAuthSession | null> {
    if (!rawToken) return null;
    const now = this.now();
    const tokenHmac = domainHmac(
      this.config.secret,
      "ytt/session-token-at-rest/v1",
      rawToken,
    );
    const session = await this.store.findSessionByTokenHmac(tokenHmac);
    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.idleExpiresAt <= now || session.absoluteExpiresAt <= now) {
      await this.store.revokeSession(session.id, now, "expired");
      return null;
    }

    let user: AuthUserRecord | null = null;
    if (session.kind === "authenticated") {
      if (!session.userId || session.authVersion == null) {
        await this.store.revokeSession(session.id, now, "invalid_identity");
        return null;
      }
      user = await this.store.findUserById(session.userId);
      if (
        !user ||
        user.disabledAt ||
        user.authVersion !== session.authVersion
      ) {
        await this.store.revokeSession(
          session.id,
          now,
          user?.disabledAt ? "account_disabled" : "auth_version_changed",
        );
        return null;
      }

      const idleExpiresAt = new Date(
        Math.min(
          now.getTime() + this.config.session.idleTtlMs,
          session.absoluteExpiresAt.getTime(),
        ),
      );
      await this.store.touchSession(session.id, now, idleExpiresAt);
      session.lastSeenAt = now;
      session.idleExpiresAt = idleExpiresAt;
    }

    return {
      session,
      user,
      csrfToken: deriveSynchronizerToken(this.config.secret, session.id),
    };
  }

  assertCsrf(session: PresentedAuthSession, csrfToken: string | null): void {
    if (!csrfToken || csrfToken.length > 256) {
      throw new AuthServiceError("CSRF_INVALID", 403, "Request verification failed.");
    }
    const presentedHmac = domainHmac(
      this.config.secret,
      "ytt/csrf-token-at-rest/v1",
      csrfToken,
    );
    if (!safeHmacEqual(presentedHmac, session.session.csrfTokenHmac)) {
      throw new AuthServiceError("CSRF_INVALID", 403, "Request verification failed.");
    }
  }

  async register(
    input: { email: string; password: string; displayName?: string | null },
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<{
    session: AuthSessionEnvelope;
    verification: TokenDeliveryResult;
  }> {
    this.assertEnabled();
    this.assertFeature("registration", this.config.features.registration);
    const email = validatedEmail(input.email);
    const password = validatedPassword(input.password);
    const displayName = validatedDisplayName(input.displayName);
    await this.enforceRate(RATE_RULES.registrationIp, metadata.ipAddress);
    await this.enforceRate(RATE_RULES.registrationEmail, email.normalized);
    const passwordHash = await hashPassword(password, this.config.password);

    if (await this.store.findUserByNormalizedEmail(email.normalized)) {
      await this.audit(
        "registration",
        "failure",
        "REGISTRATION_UNAVAILABLE",
        null,
        current.session.id,
        metadata,
      );
      throw new AuthServiceError(
        "REGISTRATION_UNAVAILABLE",
        400,
        "Registration could not be completed.",
      );
    }

    const now = this.now();
    const user: AuthUserRecord = {
      id: randomUUID(),
      email: email.presentation,
      normalizedEmail: email.normalized,
      displayName,
      passwordHash,
      emailVerifiedAt: null,
      disabledAt: null,
      authVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await this.store.createUser(user);
    } catch (error) {
      if (!(error instanceof AuthEmailConflictError)) throw error;
      throw new AuthServiceError(
        "REGISTRATION_UNAVAILABLE",
        400,
        "Registration could not be completed.",
      );
    }

    let verification: TokenDeliveryResult = {
      accepted: true,
      delivery: "unavailable",
    };
    let verificationDeferred = false;
    if (this.config.features.emailVerification) {
      try {
        verification = await this.issueEmailVerificationToken(user);
      } catch {
        verificationDeferred = true;
        verification = {
          accepted: true,
          delivery: "unavailable",
          developmentToken: this.config.exposeDevelopmentTokens
            ? generateOpaqueToken()
            : undefined,
        };
      }
    }
    const issued = await this.rotateToAuthenticated(current, user);
    await this.audit(
      "registration",
      "success",
      verificationDeferred ? "REGISTERED_VERIFICATION_DEFERRED" : "REGISTERED",
      user.id,
      issued.presented.session.id,
      metadata,
    );
    return {
      session: this.envelopeFromIssued(issued),
      verification,
    };
  }

  async signIn(
    input: { email: string; password: string },
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<AuthSessionEnvelope> {
    this.assertEnabled();
    const normalized = normalizeEmail(input.email);
    const emailIsUsable = canonicalEmailSchema.safeParse(input.email).success;
    const passwordBytes = Buffer.byteLength(input.password, "utf8");
    const passwordIsUsable =
      input.password.length > 0 &&
      input.password.length <= 256 &&
      passwordBytes <= 1024;
    const passwordForVerification = passwordIsUsable
      ? input.password
      : "invalid-sign-in-input";
    await this.enforceRate(RATE_RULES.signInIp, metadata.ipAddress);
    await this.enforceRate(
      RATE_RULES.signInEmail,
      normalized.slice(0, 320) || "invalid-email-input",
    );

    const found = emailIsUsable
      ? await this.store.findUserByNormalizedEmail(normalized)
      : null;
    const usableUser =
      found && !found.disabledAt && passwordIsUsable ? found : null;
    const candidateHash = usableUser?.passwordHash ?? (await this.getDummyPasswordHash());
    const valid = await verifyPassword(passwordForVerification, candidateHash);
    if (!usableUser || !valid) {
      await this.audit(
        "sign_in",
        "failure",
        "INVALID_CREDENTIALS",
        null,
        current.session.id,
        metadata,
      );
      throw new AuthServiceError(
        "INVALID_CREDENTIALS",
        401,
        "Email or password is incorrect.",
      );
    }

    const issued = await this.rotateToAuthenticated(current, usableUser);
    await this.audit(
      "sign_in",
      "success",
      "SIGNED_IN",
      usableUser.id,
      issued.presented.session.id,
      metadata,
    );
    return this.envelopeFromIssued(issued);
  }

  async signOut(
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<AuthSessionEnvelope> {
    const user = this.requireUser(current);
    const now = this.now();
    await this.store.revokeSession(current.session.id, now, "logout");
    await this.audit(
      "sign_out",
      "success",
      "SIGNED_OUT",
      user.id,
      current.session.id,
      metadata,
    );
    return this.createGuestSession();
  }

  async signOutAll(
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<{ revoked: number; session: AuthSessionEnvelope }> {
    const user = this.requireUser(current);
    const now = this.now();
    await this.store.incrementUserAuthVersion(user.id, now);
    const revoked = await this.store.revokeUserSessions(user.id, now, "logout_all");
    await this.audit(
      "sign_out_all",
      "success",
      "ALL_SESSIONS_REVOKED",
      user.id,
      current.session.id,
      metadata,
    );
    return { revoked, session: await this.createGuestSession() };
  }

  async forgotPassword(
    emailInput: string,
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<TokenDeliveryResult> {
    this.assertFeature("password_reset", this.config.features.passwordReset);
    const email = validatedEmail(emailInput);
    const limited =
      !(await this.tryRate(RATE_RULES.forgotIp, metadata.ipAddress)) ||
      !(await this.tryRate(RATE_RULES.forgotEmail, email.normalized));
    const rawToken = generateOpaqueToken();
    let issuanceFailed = false;

    if (!limited) {
      const user = await this.store.findUserByNormalizedEmail(email.normalized);
      if (user && !user.disabledAt) {
        const now = this.now();
        try {
          await this.store.replacePasswordResetToken({
            id: randomUUID(),
            userId: user.id,
            tokenHmac: domainHmac(
              this.config.secret,
              "ytt/password-reset-token-at-rest/v1",
              rawToken,
            ),
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.config.tokenTtl.passwordResetMs),
            usedAt: null,
          });
        } catch {
          issuanceFailed = true;
        }
      }
    }

    await this.audit(
      "password_forgot",
      limited ? "blocked" : issuanceFailed ? "failure" : "success",
      issuanceFailed
        ? "PASSWORD_RESET_TOKEN_ISSUE_FAILED"
        : "PASSWORD_RESET_REQUEST_ACCEPTED",
      null,
      current.session.id,
      metadata,
    );
    return {
      accepted: true,
      delivery: "unavailable",
      developmentToken: this.config.exposeDevelopmentTokens
        ? rawToken
        : undefined,
    };
  }

  async resetPassword(
    input: { token: string; password: string },
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<void> {
    this.assertFeature("password_reset", this.config.features.passwordReset);
    const password = validatedPassword(input.password);
    if (!input.token || input.token.length > 2048) {
      throw this.invalidResetToken();
    }
    await this.enforceRate(RATE_RULES.resetIp, metadata.ipAddress);
    await this.enforceRate(RATE_RULES.resetToken, input.token);
    const nextHash = await hashPassword(password, this.config.password);
    const tokenHmac = domainHmac(
      this.config.secret,
      "ytt/password-reset-token-at-rest/v1",
      input.token,
    );
    const now = this.now();
    const userId = await this.store.completePasswordReset(
      tokenHmac,
      nextHash,
      now,
    );
    if (!userId) {
      await this.audit(
        "password_reset",
        "failure",
        "INVALID_OR_EXPIRED_RESET_TOKEN",
        null,
        current.session.id,
        metadata,
      );
      throw this.invalidResetToken();
    }

    await this.store.revokeSession(
      current.session.id,
      now,
      "password_reset_completed",
    );
    await this.audit(
      "password_reset",
      "success",
      "PASSWORD_RESET_COMPLETED",
      userId,
      current.session.id,
      metadata,
    );
  }

  async requestEmailVerification(
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<TokenDeliveryResult> {
    this.assertFeature(
      "email_verification",
      this.config.features.emailVerification,
    );
    const user = this.requireUser(current);
    await this.enforceRate(RATE_RULES.verifyRequest, user.id);
    const result = user.emailVerifiedAt
      ? {
          accepted: true as const,
          delivery: "unavailable" as const,
        }
      : await this.issueEmailVerificationToken(user);
    await this.audit(
      "email_verification_request",
      "success",
      "EMAIL_VERIFICATION_REQUEST_ACCEPTED",
      user.id,
      current.session.id,
      metadata,
    );
    return result;
  }

  async completeEmailVerification(
    token: string,
    current: PresentedAuthSession,
    metadata: RequestMetadata,
  ): Promise<PublicAuthUser> {
    this.assertFeature(
      "email_verification",
      this.config.features.emailVerification,
    );
    if (!token || token.length > 2048) throw this.invalidVerificationToken();
    await this.enforceRate(
      RATE_RULES.verifyCompleteIp,
      metadata.ipAddress,
    );
    await this.enforceRate(RATE_RULES.verifyCompleteToken, token);
    const now = this.now();
    const user = await this.store.completeEmailVerification(
      domainHmac(
        this.config.secret,
        "ytt/email-verification-token-at-rest/v1",
        token,
      ),
      now,
    );
    if (!user) {
      await this.audit(
        "email_verification_complete",
        "failure",
        "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
        null,
        current.session.id,
        metadata,
      );
      throw this.invalidVerificationToken();
    }
    await this.audit(
      "email_verification_complete",
      "success",
      "EMAIL_VERIFIED",
      user.id,
      current.session.id,
      metadata,
    );
    return publicUser(user);
  }

  private async issueEmailVerificationToken(
    user: AuthUserRecord,
  ): Promise<TokenDeliveryResult> {
    const now = this.now();
    const rawToken = generateOpaqueToken();
    await this.store.replaceEmailVerificationToken({
      id: randomUUID(),
      userId: user.id,
      tokenHmac: domainHmac(
        this.config.secret,
        "ytt/email-verification-token-at-rest/v1",
        rawToken,
      ),
      createdAt: now,
      expiresAt: new Date(
        now.getTime() + this.config.tokenTtl.emailVerificationMs,
      ),
      usedAt: null,
    });
    return {
      accepted: true,
      delivery: "unavailable",
      developmentToken: this.config.exposeDevelopmentTokens
        ? rawToken
        : undefined,
    };
  }

  private async rotateToAuthenticated(
    current: PresentedAuthSession,
    user: AuthUserRecord,
  ): Promise<IssuedSession> {
    await this.store.revokeSession(
      current.session.id,
      this.now(),
      "rotated_after_authentication",
    );
    return this.issueSession(user.id, user.authVersion, current.session.id);
  }

  private async issueSession(
    userId: string | null,
    authVersion: number | null,
    rotatedFromSessionId: string | null,
  ): Promise<IssuedSession> {
    const now = this.now();
    const id = randomUUID();
    const rawToken = generateOpaqueToken();
    const csrfToken = deriveSynchronizerToken(this.config.secret, id);
    const authenticated = userId !== null;
    const absoluteExpiresAt = new Date(
      now.getTime() +
        (authenticated
          ? this.config.session.absoluteTtlMs
          : this.config.session.guestTtlMs),
    );
    const idleExpiresAt = authenticated
      ? new Date(
          Math.min(
            now.getTime() + this.config.session.idleTtlMs,
            absoluteExpiresAt.getTime(),
          ),
        )
      : absoluteExpiresAt;
    const session: AuthSessionRecord = {
      id,
      userId,
      kind: authenticated ? "authenticated" : "guest",
      authVersion,
      tokenHmac: domainHmac(
        this.config.secret,
        "ytt/session-token-at-rest/v1",
        rawToken,
      ),
      csrfTokenHmac: domainHmac(
        this.config.secret,
        "ytt/csrf-token-at-rest/v1",
        csrfToken,
      ),
      rotatedFromSessionId,
      createdAt: now,
      lastSeenAt: now,
      idleExpiresAt,
      absoluteExpiresAt,
      revokedAt: null,
      revocationReason: null,
    };
    await this.store.createSession(session);
    const user = userId ? await this.store.findUserById(userId) : null;
    return {
      rawToken,
      presented: { session, user, csrfToken },
    };
  }

  private envelopeFromIssued(issued: IssuedSession): AuthSessionEnvelope {
    const user = issued.presented.user;
    if (!user) throw new Error("Authenticated session user was not persisted.");
    return {
      state: "authenticated",
      cookieToken: issued.rawToken,
      cookieExpiresAt: issued.presented.session.absoluteExpiresAt,
      csrfToken: issued.presented.csrfToken,
      user: publicUser(user),
    };
  }

  private guestEnvelopeFromIssued(
    issued: IssuedSession,
    state: "guest" | "expired",
  ): AuthSessionEnvelope {
    return {
      state,
      cookieToken: issued.rawToken,
      cookieExpiresAt: issued.presented.session.absoluteExpiresAt,
      csrfToken: issued.presented.csrfToken,
      user: null,
    };
  }

  private requireUser(current: PresentedAuthSession): AuthUserRecord {
    if (!current.user || current.session.kind !== "authenticated") {
      throw new AuthServiceError(
        "SESSION_REQUIRED",
        401,
        "Authentication is required.",
      );
    }
    return current.user;
  }

  private assertEnabled(): void {
    if (!this.config.enabled) {
      throw new AuthServiceError(
        "AUTH_DISABLED",
        503,
        "Authentication is unavailable.",
      );
    }
  }

  private assertFeature(name: string, enabled: boolean): void {
    this.assertEnabled();
    if (!enabled) {
      throw new AuthServiceError(
        "FEATURE_DISABLED",
        403,
        `${name} is unavailable.`,
      );
    }
  }

  private async getDummyPasswordHash(): Promise<string> {
    this.dummyPasswordHash ??= hashPassword(
      "not-a-real-account-password",
      this.config.password,
    );
    return this.dummyPasswordHash;
  }

  private async enforceRate(
    rule: { scope: string; limit: number; windowMs: number },
    subject: string,
  ): Promise<void> {
    if (!(await this.tryRate(rule, subject))) {
      throw new AuthServiceError(
        "RATE_LIMITED",
        429,
        "Too many requests. Please try again later.",
      );
    }
  }

  private async tryRate(
    rule: { scope: string; limit: number; windowMs: number },
    subject: string,
  ): Promise<boolean> {
    const now = this.now();
    const windowStartedAt = new Date(
      Math.floor(now.getTime() / rule.windowMs) * rule.windowMs,
    );
    const result = await this.store.recordRateLimitAttempt({
      id: randomUUID(),
      scope: rule.scope,
      subjectHmac: domainHmac(
        this.config.secret,
        `ytt/rate-subject/${rule.scope}/v1`,
        subject,
      ),
      windowStartedAt,
      now,
      limit: rule.limit,
      blockMs: rule.windowMs,
    });
    return result.allowed;
  }

  private async audit(
    event: string,
    outcome: AuthAuditOutcome,
    code: string,
    userId: string | null,
    sessionId: string | null,
    metadata: RequestMetadata,
  ): Promise<void> {
    try {
      await this.store.appendAuditEvent({
        id: randomUUID(),
        event,
        outcome,
        code,
        userId,
        sessionId,
        subjectHmac: metadata.ipAddress
          ? domainHmac(
              this.config.secret,
              "ytt/audit-network-subject/v1",
              metadata.ipAddress,
            )
          : null,
        requestId: metadata.requestId ?? null,
        occurredAt: this.now(),
      });
    } catch {
      // Authentication state remains authoritative if the audit sink is unavailable.
    }
  }

  private invalidResetToken(): AuthServiceError {
    return new AuthServiceError(
      "INVALID_OR_EXPIRED_RESET_TOKEN",
      400,
      "The reset request is invalid or expired.",
    );
  }

  private invalidVerificationToken(): AuthServiceError {
    return new AuthServiceError(
      "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
      400,
      "The verification request is invalid or expired.",
    );
  }
}
