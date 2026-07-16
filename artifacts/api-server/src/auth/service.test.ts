import { describe, expect, it } from "vitest";
import { domainHmac, verifyPassword } from "./crypto";
import { MemoryAuthStore } from "./memory-store";
import { AuthEmailConflictError } from "./store-errors";
import {
  AuthService,
  AuthServiceError,
  type AuthServiceConfig,
  type AuthSessionEnvelope,
  type PresentedAuthSession,
} from "./service";

const TEST_SECRET =
  "auth-test-secret/2026-07-13/meridian-session-foundation";
const PASSWORD = "correct horse battery staple";
const REPLACEMENT_PASSWORD = "a newer correct horse battery staple";
const METADATA = {
  ipAddress: "203.0.113.20",
  requestId: "auth-service-test",
};

const BASE_CONFIG: AuthServiceConfig = {
  enabled: true,
  secret: TEST_SECRET,
  exposeDevelopmentTokens: true,
  features: {
    registration: true,
    passwordReset: true,
    emailVerification: true,
  },
  password: {
    memoryKiB: 32,
    passes: 2,
    parallelism: 2,
    tagLength: 16,
  },
  session: {
    guestTtlMs: 60 * 60_000,
    idleTtlMs: 5 * 60_000,
    absoluteTtlMs: 24 * 60 * 60_000,
  },
  tokenTtl: {
    passwordResetMs: 30 * 60_000,
    emailVerificationMs: 60 * 60_000,
  },
};

type ConfigOverrides = Omit<
  Partial<AuthServiceConfig>,
  "features" | "password" | "session" | "tokenTtl"
> & {
  features?: Partial<AuthServiceConfig["features"]>;
  password?: Partial<AuthServiceConfig["password"]>;
  session?: Partial<AuthServiceConfig["session"]>;
  tokenTtl?: Partial<AuthServiceConfig["tokenTtl"]>;
};

interface Harness {
  store: MemoryAuthStore;
  service: AuthService;
  config: AuthServiceConfig;
  now(): Date;
  advance(milliseconds: number): void;
}

function createHarness(overrides: ConfigOverrides = {}): Harness {
  let nowMs = Date.parse("2026-07-13T05:00:00.000Z");
  const store = new MemoryAuthStore();
  const config: AuthServiceConfig = {
    ...BASE_CONFIG,
    ...overrides,
    features: { ...BASE_CONFIG.features, ...overrides.features },
    password: { ...BASE_CONFIG.password, ...overrides.password },
    session: { ...BASE_CONFIG.session, ...overrides.session },
    tokenTtl: { ...BASE_CONFIG.tokenTtl, ...overrides.tokenTtl },
  };
  const service = new AuthService(store, config, () => new Date(nowMs));
  return {
    store,
    service,
    config,
    now: () => new Date(nowMs),
    advance(milliseconds: number) {
      nowMs += milliseconds;
    },
  };
}

async function resolve(
  service: AuthService,
  rawToken: string,
): Promise<PresentedAuthSession> {
  const presented = await service.resolvePresentedSession(rawToken);
  expect(presented).not.toBeNull();
  return presented!;
}

async function createGuest(harness: Harness): Promise<{
  envelope: AuthSessionEnvelope;
  presented: PresentedAuthSession;
}> {
  const envelope = await harness.service.getOrCreateSession(null, METADATA);
  return {
    envelope,
    presented: await resolve(harness.service, envelope.cookieToken),
  };
}

async function registerUser(
  harness: Harness,
  input: { email?: string; password?: string; displayName?: string | null } = {},
): Promise<{
  guest: PresentedAuthSession;
  guestEnvelope: AuthSessionEnvelope;
  result: Awaited<ReturnType<AuthService["register"]>>;
  authenticated: PresentedAuthSession;
}> {
  const { envelope: guestEnvelope, presented: guest } =
    await createGuest(harness);
  const result = await harness.service.register(
    {
      email: input.email ?? "trader@example.com",
      password: input.password ?? PASSWORD,
      displayName: input.displayName ?? "Trader",
    },
    guest,
    METADATA,
  );
  return {
    guest,
    guestEnvelope,
    result,
    authenticated: await resolve(
      harness.service,
      result.session.cookieToken,
    ),
  };
}

async function captureAuthError(
  action: Promise<unknown>,
): Promise<AuthServiceError> {
  try {
    await action;
  } catch (error) {
    expect(error).toBeInstanceOf(AuthServiceError);
    return error as AuthServiceError;
  }
  throw new Error("Expected authentication action to reject.");
}

describe("AuthService session foundation", () => {
  it("creates a guest session with a server-bound synchronizer CSRF token", async () => {
    const harness = createHarness();
    const { envelope, presented } = await createGuest(harness);

    expect(envelope.state).toBe("guest");
    expect(envelope.user).toBeNull();
    expect(Buffer.from(envelope.cookieToken, "base64url")).toHaveLength(32);
    expect(presented.session.kind).toBe("guest");
    expect(presented.user).toBeNull();
    expect(presented.session.tokenHmac).toBe(
      domainHmac(
        TEST_SECRET,
        "ytt/session-token-at-rest/v1",
        envelope.cookieToken,
      ),
    );
    expect(presented.session.tokenHmac).not.toContain(envelope.cookieToken);
    expect(presented.session.csrfTokenHmac).toBe(
      domainHmac(
        TEST_SECRET,
        "ytt/csrf-token-at-rest/v1",
        envelope.csrfToken,
      ),
    );
    expect(() =>
      harness.service.assertCsrf(presented, envelope.csrfToken),
    ).not.toThrow();
    let csrfError: unknown;
    try {
      harness.service.assertCsrf(presented, "wrong-csrf-token");
    } catch (error) {
      csrfError = error;
    }
    expect(csrfError).toMatchObject({ code: "CSRF_INVALID", status: 403 });
  });

  it("normalizes registration identity and rotates the guest session", async () => {
    const harness = createHarness();
    const registered = await registerUser(harness, {
      email: "  Trader\uff20Example.COM  ",
      displayName: "  \uff2d\uff45\uff52\uff49\uff44\uff49\uff41\uff4e Trader  ",
    });

    expect(registered.result.session).toMatchObject({
      state: "authenticated",
      user: {
        email: "Trader@Example.COM",
        displayName: "Meridian Trader",
        emailVerified: false,
      },
    });
    expect(registered.result.session.cookieToken).not.toBe(
      registered.guestEnvelope.cookieToken,
    );
    expect(registered.result.session.csrfToken).not.toBe(
      registered.guestEnvelope.csrfToken,
    );

    const storedUser = await harness.store.findUserByNormalizedEmail(
      "trader@example.com",
    );
    expect(storedUser).toMatchObject({
      email: "Trader@Example.COM",
      normalizedEmail: "trader@example.com",
      displayName: "Meridian Trader",
      authVersion: 1,
    });
    expect(registered.authenticated.session.rotatedFromSessionId).toBe(
      registered.guest.session.id,
    );

    const oldSession = await harness.store.findSessionByTokenHmac(
      domainHmac(
        TEST_SECRET,
        "ytt/session-token-at-rest/v1",
        registered.guestEnvelope.cookieToken,
      ),
    );
    expect(oldSession).toMatchObject({
      revokedAt: harness.now(),
      revocationReason: "rotated_after_authentication",
    });
    await expect(
      harness.service.resolvePresentedSession(
        registered.guestEnvelope.cookieToken,
      ),
    ).resolves.toBeNull();
  });

  it("rejects response-incompatible email addresses before persistence", async () => {
    const harness = createHarness();
    const guest = await createGuest(harness);

    const error = await captureAuthError(
      harness.service.register(
        {
          email: "a@b..com",
          password: PASSWORD,
          displayName: "Invalid",
        },
        guest.presented,
        METADATA,
      ),
    );

    expect(error).toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    await expect(
      harness.store.findUserByNormalizedEmail("a@b..com"),
    ).resolves.toBeNull();
  });

  it("maps only an expected email-conflict race to the generic registration response", async () => {
    const conflictHarness = createHarness();
    const conflictGuest = await createGuest(conflictHarness);
    conflictHarness.store.createUser = async () => {
      throw new AuthEmailConflictError();
    };

    const conflict = await captureAuthError(
      conflictHarness.service.register(
        {
          email: "race@example.com",
          password: PASSWORD,
          displayName: "Race",
        },
        conflictGuest.presented,
        METADATA,
      ),
    );
    expect(conflict).toMatchObject({
      code: "REGISTRATION_UNAVAILABLE",
      status: 400,
      message: "Registration could not be completed.",
    });

    const outageHarness = createHarness();
    const outageGuest = await createGuest(outageHarness);
    const infrastructureFailure = new Error("database unavailable");
    outageHarness.store.createUser = async () => {
      throw infrastructureFailure;
    };

    await expect(
      outageHarness.service.register(
        {
          email: "outage@example.com",
          password: PASSWORD,
          displayName: "Outage",
        },
        outageGuest.presented,
        METADATA,
      ),
    ).rejects.toBe(infrastructureFailure);
  });

  it("keeps a created account usable when verification-token issuance is unavailable", async () => {
    const harness = createHarness();
    harness.store.replaceEmailVerificationToken = async () => {
      throw new Error("verification token table unavailable");
    };

    const registered = await registerUser(harness, {
      email: "verification-deferred@example.com",
    });

    expect(registered.result.session).toMatchObject({
      state: "authenticated",
      user: { email: "verification-deferred@example.com" },
    });
    expect(registered.result.verification).toMatchObject({
      accepted: true,
      delivery: "unavailable",
      developmentToken: expect.any(String),
    });
    expect(harness.store.auditEvents.at(-1)).toMatchObject({
      outcome: "success",
      code: "REGISTERED_VERIFICATION_DEFERRED",
    });
  });

  it("returns the same generic credential error for malformed, unknown, and wrong credentials", async () => {
    const harness = createHarness();
    await registerUser(harness, { email: "known@example.com" });
    const { presented: guest } = await createGuest(harness);
    const metadata = { ...METADATA, ipAddress: "203.0.113.21" };

    const malformed = await captureAuthError(
      harness.service.signIn(
        { email: "not-an-email", password: "" },
        guest,
        metadata,
      ),
    );
    const unknown = await captureAuthError(
      harness.service.signIn(
        { email: "unknown@example.com", password: PASSWORD },
        guest,
        metadata,
      ),
    );
    const wrong = await captureAuthError(
      harness.service.signIn(
        { email: "KNOWN@example.com", password: REPLACEMENT_PASSWORD },
        guest,
        metadata,
      ),
    );

    for (const error of [malformed, unknown, wrong]) {
      expect({ code: error.code, status: error.status, message: error.message })
        .toEqual({
          code: "INVALID_CREDENTIALS",
          status: 401,
          message: "Email or password is incorrect.",
        });
    }
  });

  it("rotates the presented guest session after a successful sign-in", async () => {
    const harness = createHarness();
    await registerUser(harness, { email: "known@example.com" });
    const { envelope: guestEnvelope, presented: guest } =
      await createGuest(harness);

    const signedIn = await harness.service.signIn(
      { email: "  KNOWN@EXAMPLE.COM ", password: PASSWORD },
      guest,
      { ...METADATA, ipAddress: "203.0.113.22" },
    );
    const authenticated = await resolve(harness.service, signedIn.cookieToken);

    expect(signedIn.state).toBe("authenticated");
    expect(signedIn.cookieToken).not.toBe(guestEnvelope.cookieToken);
    expect(authenticated.session.rotatedFromSessionId).toBe(guest.session.id);
    await expect(
      harness.service.resolvePresentedSession(guestEnvelope.cookieToken),
    ).resolves.toBeNull();
  });

  it("revokes one session on sign-out and invalidates all sessions through authVersion on sign-out-all", async () => {
    const harness = createHarness();
    const registered = await registerUser(harness, {
      email: "logout@example.com",
    });
    const userId = registered.authenticated.user!.id;
    const { presented: secondGuest } = await createGuest(harness);
    const secondEnvelope = await harness.service.signIn(
      { email: "logout@example.com", password: PASSWORD },
      secondGuest,
      { ...METADATA, ipAddress: "203.0.113.23" },
    );
    const secondSession = await resolve(
      harness.service,
      secondEnvelope.cookieToken,
    );

    const signedOutGuest = await harness.service.signOut(
      registered.authenticated,
      METADATA,
    );
    expect(signedOutGuest).toMatchObject({ state: "guest", user: null });
    await expect(
      harness.service.resolvePresentedSession(
        registered.result.session.cookieToken,
      ),
    ).resolves.toBeNull();
    await expect(
      harness.service.resolvePresentedSession(secondEnvelope.cookieToken),
    ).resolves.not.toBeNull();
    expect((await harness.store.findUserById(userId))?.authVersion).toBe(1);

    const all = await harness.service.signOutAll(secondSession, METADATA);
    expect(all.revoked).toBe(1);
    expect(all.session).toMatchObject({ state: "guest", user: null });
    expect((await harness.store.findUserById(userId))?.authVersion).toBe(2);
    await expect(
      harness.service.resolvePresentedSession(secondEnvelope.cookieToken),
    ).resolves.toBeNull();
    await expect(
      harness.service.resolvePresentedSession(all.session.cookieToken),
    ).resolves.toMatchObject({ user: null, session: { kind: "guest" } });
  });

  it("expires and revokes an authenticated session at its idle deadline", async () => {
    const harness = createHarness({
      session: { idleTtlMs: 60_000, absoluteTtlMs: 10 * 60_000 },
    });
    const registered = await registerUser(harness, {
      email: "expiry@example.com",
    });
    const token = registered.result.session.cookieToken;
    const sessionId = registered.authenticated.session.id;

    harness.advance(60_000);
    await expect(
      harness.service.resolvePresentedSession(token),
    ).resolves.toBeNull();
    expect(
      await harness.store.findSessionByTokenHmac(
        domainHmac(TEST_SECRET, "ytt/session-token-at-rest/v1", token),
      ),
    ).toMatchObject({
      id: sessionId,
      revokedAt: harness.now(),
      revocationReason: "expired",
    });

    const replacement = await harness.service.getOrCreateSession(
      token,
      METADATA,
    );
    expect(replacement).toMatchObject({ state: "expired", user: null });
    expect(replacement.cookieToken).not.toBe(token);
  });

  it("consumes password-reset tokens once, changes authVersion, and revokes user sessions", async () => {
    const harness = createHarness();
    const registered = await registerUser(harness, {
      email: "reset@example.com",
    });
    const { presented: recoveryGuest } = await createGuest(harness);
    const forgot = await harness.service.forgotPassword(
      "  RESET@example.com ",
      recoveryGuest,
      { ...METADATA, ipAddress: "203.0.113.24" },
    );
    const token = forgot.developmentToken;
    expect(token).toEqual(expect.any(String));

    await harness.service.resetPassword(
      { token: token!, password: REPLACEMENT_PASSWORD },
      recoveryGuest,
      { ...METADATA, ipAddress: "203.0.113.24" },
    );

    const user = await harness.store.findUserByNormalizedEmail(
      "reset@example.com",
    );
    expect(user?.authVersion).toBe(2);
    await expect(
      verifyPassword(REPLACEMENT_PASSWORD, user!.passwordHash),
    ).resolves.toBe(true);
    await expect(
      harness.service.resolvePresentedSession(
        registered.result.session.cookieToken,
      ),
    ).resolves.toBeNull();

    await expect(
      harness.service.resetPassword(
        { token: token!, password: "another replacement password" },
        recoveryGuest,
        { ...METADATA, ipAddress: "203.0.113.24" },
      ),
    ).rejects.toMatchObject({
      code: "INVALID_OR_EXPIRED_RESET_TOKEN",
      status: 400,
    });
  });

  it("leaves only one usable password-reset token after concurrent requests", async () => {
    const harness = createHarness();
    await registerUser(harness, { email: "concurrent-reset@example.com" });
    const { presented: recoveryGuest } = await createGuest(harness);

    const requests = await Promise.all([
      harness.service.forgotPassword(
        "concurrent-reset@example.com",
        recoveryGuest,
        { ...METADATA, ipAddress: "203.0.113.30", requestId: "reset-a" },
      ),
      harness.service.forgotPassword(
        "concurrent-reset@example.com",
        recoveryGuest,
        { ...METADATA, ipAddress: "203.0.113.30", requestId: "reset-b" },
      ),
    ]);
    const tokens = requests.map((request) => request.developmentToken!);
    expect(tokens).toHaveLength(2);

    const consumed = await Promise.all(
      tokens.map((token) =>
        harness.store.consumePasswordResetToken(
          domainHmac(
            TEST_SECRET,
            "ytt/password-reset-token-at-rest/v1",
            token,
          ),
          harness.now(),
        ),
      ),
    );
    expect(consumed.filter(Boolean)).toHaveLength(1);
  });

  it("keeps forgot-password generic when token storage fails for an existing account", async () => {
    const harness = createHarness();
    await registerUser(harness, { email: "recovery-outage@example.com" });
    const { presented: recoveryGuest } = await createGuest(harness);
    harness.store.replacePasswordResetToken = async () => {
      throw new Error("password reset token table unavailable");
    };

    const existing = await harness.service.forgotPassword(
      "recovery-outage@example.com",
      recoveryGuest,
      { ...METADATA, ipAddress: "203.0.113.31" },
    );
    const unknown = await harness.service.forgotPassword(
      "unknown-recovery@example.com",
      recoveryGuest,
      { ...METADATA, ipAddress: "203.0.113.32" },
    );

    expect(existing).toMatchObject({
      accepted: true,
      delivery: "unavailable",
      developmentToken: expect.any(String),
    });
    expect(unknown).toMatchObject({
      accepted: true,
      delivery: "unavailable",
      developmentToken: expect.any(String),
    });
    expect(existing.developmentToken).not.toBe(unknown.developmentToken);
    expect(harness.store.auditEvents.at(-2)).toMatchObject({
      outcome: "failure",
      code: "PASSWORD_RESET_TOKEN_ISSUE_FAILED",
      userId: null,
    });
  });

  it("consumes an email-verification token once", async () => {
    const harness = createHarness();
    const registered = await registerUser(harness, {
      email: "verify@example.com",
    });
    const token = registered.result.verification.developmentToken;
    expect(token).toEqual(expect.any(String));

    const verified = await harness.service.completeEmailVerification(
      token!,
      registered.authenticated,
      METADATA,
    );
    expect(verified).toMatchObject({
      email: "verify@example.com",
      emailVerified: true,
    });
    expect(
      (await harness.store.findUserByNormalizedEmail("verify@example.com"))
        ?.emailVerifiedAt,
    ).toEqual(harness.now());

    await expect(
      harness.service.completeEmailVerification(
        token!,
        registered.authenticated,
        METADATA,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
      status: 400,
    });
  });

  it("leaves only one usable verification token after concurrent requests", async () => {
    const harness = createHarness();
    const registered = await registerUser(harness, {
      email: "concurrent-verification@example.com",
    });

    const requests = await Promise.all([
      harness.service.requestEmailVerification(registered.authenticated, {
        ...METADATA,
        requestId: "verification-a",
      }),
      harness.service.requestEmailVerification(registered.authenticated, {
        ...METADATA,
        requestId: "verification-b",
      }),
    ]);
    const tokens = [
      registered.result.verification.developmentToken!,
      ...requests.map((request) => request.developmentToken!),
    ];

    const consumed = await Promise.all(
      tokens.map((token) =>
        harness.store.consumeEmailVerificationToken(
          domainHmac(
            TEST_SECRET,
            "ytt/email-verification-token-at-rest/v1",
            token,
          ),
          harness.now(),
        ),
      ),
    );
    expect(consumed.filter(Boolean)).toHaveLength(1);
  });

  it("rate-limits repeated sign-in attempts and allows the next fixed window", async () => {
    const harness = createHarness();
    const { presented: guest } = await createGuest(harness);
    const input = { email: "limited@example.com", password: PASSWORD };
    const metadata = { ...METADATA, ipAddress: "203.0.113.25" };

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await expect(
        harness.service.signIn(input, guest, metadata),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 });
    }
    await expect(
      harness.service.signIn(input, guest, metadata),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });

    harness.advance(15 * 60_000);
    await expect(
      harness.service.signIn(input, guest, metadata),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 });
  });

  it("rate-limits new guest issuance without charging valid session lookups", async () => {
    const harness = createHarness();
    const metadata = { ...METADATA, ipAddress: "203.0.113.26" };
    const first = await harness.service.getOrCreateSession(null, metadata);

    for (let issuance = 1; issuance < 30; issuance += 1) {
      await expect(
        harness.service.getOrCreateSession(null, metadata),
      ).resolves.toMatchObject({ state: "guest" });
    }

    await expect(
      harness.service.getOrCreateSession(null, metadata),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
    await expect(
      harness.service.getOrCreateSession(first.cookieToken, metadata),
    ).resolves.toMatchObject({
      state: "guest",
      cookieToken: first.cookieToken,
    });
  });

  it("rate-limits distinct invalid verification tokens by client network", async () => {
    const harness = createHarness();
    const { presented: guest } = await createGuest(harness);
    const metadata = { ...METADATA, ipAddress: "203.0.113.27" };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(
        harness.service.completeEmailVerification(
          `invalid-verification-token-${attempt.toString().padStart(2, "0")}`,
          guest,
          metadata,
        ),
      ).rejects.toMatchObject({
        code: "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
        status: 400,
      });
    }

    await expect(
      harness.service.completeEmailVerification(
        "one-more-distinct-invalid-verification-token",
        guest,
        metadata,
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
  });
});
