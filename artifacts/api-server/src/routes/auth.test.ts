import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { createAuthRuntime, type AuthRuntime } from "../auth/runtime";
import type { AuthEnvironment } from "../config/auth-env";

const TRUSTED_ORIGIN = "https://app.yucatanatrades.test";
const TEST_SECRET =
  "auth-http-contract-test/2026-07-13/meridian-session-foundation";
const PASSWORD = "correct horse battery staple";

interface SessionUserWire {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}

interface SessionEnvelopeWire {
  state: "guest" | "authenticated" | "expired";
  user: SessionUserWire | null;
  expiresAt: string | null;
  csrfToken: string;
}

interface ErrorWire {
  code: string;
  message: string;
}

interface Harness {
  baseUrl: string;
  runtime: AuthRuntime;
  server: Server;
}

function createTestEnvironment(): AuthEnvironment {
  return {
    nodeEnv: "test",
    enabled: true,
    features: {
      registration: true,
      passwordReset: true,
      emailVerification: true,
    },
    sessionSecret: TEST_SECRET,
    generatedDevelopmentSecret: false,
    storeMode: "memory",
    bindHost: "127.0.0.1",
    storeOperationTimeoutMs: 1_000,
    cookie: {
      name: "__Host-ytt_session",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
    allowedOrigins: new Set([TRUSTED_ORIGIN]),
    trustProxy: false,
    exposeDevelopmentTokens: false,
    userDataMigrationReady: false,
    userDataStatus: "migration_required",
    session: {
      guestTtlMs: 60 * 60_000,
      idleTtlMs: 5 * 60_000,
      absoluteTtlMs: 24 * 60 * 60_000,
    },
    password: {
      memoryKiB: 32,
      passes: 2,
      parallelism: 2,
      tagLength: 16,
    },
    tokenTtl: {
      passwordResetMs: 30 * 60_000,
      emailVerificationMs: 60 * 60_000,
    },
  };
}

async function startHarness(): Promise<Harness> {
  const environment = createTestEnvironment();
  const runtime = createAuthRuntime(environment);
  const server = createApp({ environment, runtime }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    runtime,
    server,
  };
}

async function closeServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function setCookieHeader(response: Response): string {
  const header = response.headers.get("set-cookie");
  expect(header).not.toBeNull();
  return header!;
}

function cookiePair(response: Response): string {
  return setCookieHeader(response).split(";", 1)[0]!;
}

function cookieToken(cookie: string): string {
  const separator = cookie.indexOf("=");
  expect(separator).toBeGreaterThan(0);
  return cookie.slice(separator + 1);
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function expectSessionEnvelope(
  body: SessionEnvelopeWire,
  state: SessionEnvelopeWire["state"],
): void {
  expect(Object.keys(body).sort()).toEqual([
    "csrfToken",
    "expiresAt",
    "state",
    "user",
  ]);
  expect(body.state).toBe(state);
  expect(Buffer.from(body.csrfToken, "base64url")).toHaveLength(32);
  expect(body.expiresAt).toEqual(expect.any(String));
  expect(Number.isNaN(Date.parse(body.expiresAt!))).toBe(false);
}

async function getGuest(harness: Harness): Promise<{
  body: SessionEnvelopeWire;
  cookie: string;
  response: Response;
}> {
  const response = await fetch(`${harness.baseUrl}/api/auth/session`);
  const body = await readJson<SessionEnvelopeWire>(response);
  expect(response.status).toBe(200);
  expectSessionEnvelope(body, "guest");
  expect(body.user).toBeNull();
  return { body, cookie: cookiePair(response), response };
}

async function register(
  harness: Harness,
  options: {
    email?: string;
    displayName?: string;
    guest?: Awaited<ReturnType<typeof getGuest>>;
  } = {},
): Promise<{
  body: SessionEnvelopeWire;
  cookie: string;
  guest: Awaited<ReturnType<typeof getGuest>>;
  response: Response;
}> {
  const guest = options.guest ?? (await getGuest(harness));
  const response = await fetch(`${harness.baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: guest.cookie,
      origin: TRUSTED_ORIGIN,
      "x-csrf-token": guest.body.csrfToken,
    },
    body: JSON.stringify({
      email: options.email ?? "trader@example.com",
      password: PASSWORD,
      displayName: options.displayName ?? "Trader",
    }),
  });
  const body = await readJson<SessionEnvelopeWire>(response);
  expect(response.status).toBe(201);
  expectSessionEnvelope(body, "authenticated");
  expect(body.user).not.toBeNull();
  return { body, cookie: cookiePair(response), guest, response };
}

describe("HTTP authentication contract", () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await startHarness();
  });

  afterEach(async () => {
    await closeServer(harness.server);
  });

  it("returns the exact authentication status wire shape", async () => {
    const response = await fetch(`${harness.baseUrl}/api/auth/status`);

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      available: true,
      features: {
        registrationEnabled: true,
        passwordResetEnabled: true,
        emailVerificationEnabled: true,
      },
      message: null,
    });
  });

  it("issues an opaque Secure HttpOnly guest cookie and a distinct synchronizer token", async () => {
    const guest = await getGuest(harness);
    const header = setCookieHeader(guest.response);
    const token = cookieToken(guest.cookie);

    expect(guest.cookie).toMatch(/^__Host-ytt_session=[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(header).toContain("Path=/");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Priority=High");
    expect(header).toMatch(/Max-Age=\d+/);
    expect(header).toMatch(/Expires=[^;]+GMT/);
    expect(header).not.toContain("Domain=");
    expect(guest.response.headers.get("cache-control")).toBe(
      "no-store, private",
    );
    expect(guest.response.headers.get("pragma")).toBe("no-cache");
    expect(guest.response.headers.get("etag")).toBeNull();
    expect(guest.response.headers.get("vary")?.toLowerCase()).toContain(
      "cookie",
    );
    expect(guest.body.csrfToken).not.toBe(token);
    expect(JSON.stringify(guest.body)).not.toContain(token);
  });

  it("keeps parser-level auth errors generic and non-cacheable", async () => {
    const response = await fetch(`${harness.baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: TRUSTED_ORIGIN,
      },
      body: "{malformed",
    });

    expect(response.status).toBe(400);
    await expect(readJson<ErrorWire>(response)).resolves.toEqual({
      code: "invalid_request",
      message: "Invalid request data.",
    });
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("vary")?.toLowerCase()).toContain("cookie");
    expect(response.headers.get("etag")).toBeNull();
  });

  it("returns completed reset success without depending on replacement guest issuance", async () => {
    const guest = await getGuest(harness);
    harness.runtime.service.resetPassword = async () => {};
    harness.runtime.service.createGuestSession = async () => {
      throw new Error("replacement guest storage unavailable");
    };

    const response = await fetch(`${harness.baseUrl}/api/auth/password/reset`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: guest.cookie,
        origin: TRUSTED_ORIGIN,
        "x-csrf-token": guest.body.csrfToken,
      },
      body: JSON.stringify({
        token: "r".repeat(43),
        password: "a replacement password",
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    await expect(readJson(response)).resolves.toEqual({
      accepted: true,
      message: "The password reset was completed.",
    });
  });

  it("rejects untrusted origins before mutation and rejects missing synchronizer tokens", async () => {
    const guest = await getGuest(harness);
    const registration = {
      email: "origin-check@example.com",
      password: PASSWORD,
      displayName: "Origin Check",
    };

    const untrusted = await fetch(`${harness.baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: guest.cookie,
        origin: "https://attacker.example",
        "x-csrf-token": guest.body.csrfToken,
      },
      body: JSON.stringify(registration),
    });
    expect(untrusted.status).toBe(403);
    await expect(readJson<ErrorWire>(untrusted)).resolves.toEqual({
      code: "csrf_invalid",
      message: "Request origin verification failed.",
    });

    const missingOrigin = await fetch(`${harness.baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: guest.cookie,
        "x-csrf-token": guest.body.csrfToken,
      },
      body: JSON.stringify(registration),
    });
    expect(missingOrigin.status).toBe(403);
    await expect(readJson<ErrorWire>(missingOrigin)).resolves.toEqual({
      code: "csrf_invalid",
      message: "Request origin verification failed.",
    });

    const missingCsrf = await fetch(`${harness.baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: guest.cookie,
        origin: TRUSTED_ORIGIN,
      },
      body: JSON.stringify(registration),
    });
    expect(missingCsrf.status).toBe(403);
    await expect(readJson<ErrorWire>(missingCsrf)).resolves.toEqual({
      code: "csrf_invalid",
      message: "Request verification failed.",
    });

    const stillGuest = await fetch(`${harness.baseUrl}/api/auth/session`, {
      headers: { cookie: guest.cookie },
    });
    expect(stillGuest.status).toBe(200);
    expect(stillGuest.headers.get("set-cookie")).toBeNull();
    await expect(readJson<SessionEnvelopeWire>(stillGuest)).resolves.toEqual(
      guest.body,
    );
  });

  it("rotates registration into an authenticated server-derived identity", async () => {
    const registered = await register(harness, {
      email: "  Trader@Example.COM  ",
      displayName: "  Meridian Trader  ",
    });

    expect(cookieToken(registered.cookie)).not.toBe(
      cookieToken(registered.guest.cookie),
    );
    expect(registered.body.csrfToken).not.toBe(
      registered.guest.body.csrfToken,
    );
    expect(registered.body.user).toEqual({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      email: "Trader@Example.COM",
      displayName: "Meridian Trader",
      emailVerified: false,
    });

    const current = await fetch(`${harness.baseUrl}/api/auth/session`, {
      headers: {
        cookie: registered.cookie,
        "x-user-id": "00000000-0000-4000-8000-000000000001",
      },
    });
    expect(current.status).toBe(200);
    expect(current.headers.get("set-cookie")).toBeNull();
    const currentBody = await readJson<SessionEnvelopeWire>(current);
    expectSessionEnvelope(currentBody, "authenticated");
    expect(currentBody.user).toEqual(registered.body.user);
    expect(currentBody.csrfToken).toBe(registered.body.csrfToken);
    expect(currentBody.user?.id).not.toBe(
      "00000000-0000-4000-8000-000000000001",
    );
  });

  it("returns the same generic credential error for unknown and wrong credentials", async () => {
    await register(harness, { email: "known@example.com" });
    const guest = await getGuest(harness);

    const signIn = async (email: string, password: string) => {
      const response = await fetch(`${harness.baseUrl}/api/auth/sign-in`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: guest.cookie,
          origin: TRUSTED_ORIGIN,
          "x-csrf-token": guest.body.csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      return { response, body: await readJson<ErrorWire>(response) };
    };

    const unknown = await signIn("unknown@example.com", PASSWORD);
    const wrong = await signIn(
      "KNOWN@example.com",
      "this password is intentionally wrong",
    );

    expect(unknown.response.status).toBe(401);
    expect(wrong.response.status).toBe(401);
    expect(unknown.body).toEqual({
      code: "invalid_credentials",
      message: "Email or password is incorrect.",
    });
    expect(wrong.body).toEqual(unknown.body);
  });

  it("revokes the authenticated session on sign-out and rotates to a fresh guest envelope", async () => {
    const registered = await register(harness, { email: "logout@example.com" });
    const response = await fetch(`${harness.baseUrl}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        cookie: registered.cookie,
        origin: TRUSTED_ORIGIN,
        "x-csrf-token": registered.body.csrfToken,
      },
    });
    const body = await readJson<SessionEnvelopeWire>(response);
    const signedOutCookie = cookiePair(response);

    expect(response.status).toBe(200);
    expectSessionEnvelope(body, "guest");
    expect(body.user).toBeNull();
    expect(cookieToken(signedOutCookie)).not.toBe(cookieToken(registered.cookie));
    expect(body.csrfToken).not.toBe(registered.body.csrfToken);

    const oldSession = await fetch(`${harness.baseUrl}/api/auth/session`, {
      headers: { cookie: registered.cookie },
    });
    const oldSessionBody = await readJson<SessionEnvelopeWire>(oldSession);
    expect(oldSession.status).toBe(200);
    expectSessionEnvelope(oldSessionBody, "expired");
    expect(oldSessionBody.user).toBeNull();

    const currentGuest = await fetch(`${harness.baseUrl}/api/auth/session`, {
      headers: { cookie: signedOutCookie },
    });
    expect(currentGuest.status).toBe(200);
    await expect(readJson<SessionEnvelopeWire>(currentGuest)).resolves.toEqual(
      body,
    );
  });

  it("rejects guest sign-out so guest-session issuance cannot be rotated without authentication", async () => {
    const guest = await getGuest(harness);
    const response = await fetch(`${harness.baseUrl}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        cookie: guest.cookie,
        origin: TRUSTED_ORIGIN,
        "x-csrf-token": guest.body.csrfToken,
      },
    });

    expect(response.status).toBe(401);
    await expect(readJson<ErrorWire>(response)).resolves.toEqual({
      code: "unauthorized",
      message: "Authentication is required.",
    });
  });

  it("sign-out-all invalidates every authenticated session for the server-derived user", async () => {
    const first = await register(harness, { email: "devices@example.com" });
    const secondGuest = await getGuest(harness);
    const signInResponse = await fetch(`${harness.baseUrl}/api/auth/sign-in`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: secondGuest.cookie,
        origin: TRUSTED_ORIGIN,
        "x-csrf-token": secondGuest.body.csrfToken,
      },
      body: JSON.stringify({ email: "DEVICES@example.com", password: PASSWORD }),
    });
    const secondBody = await readJson<SessionEnvelopeWire>(signInResponse);
    const secondCookie = cookiePair(signInResponse);
    expect(signInResponse.status).toBe(200);
    expectSessionEnvelope(secondBody, "authenticated");
    expect(secondBody.user?.id).toBe(first.body.user?.id);

    const signOutAll = await fetch(`${harness.baseUrl}/api/auth/sign-out-all`, {
      method: "POST",
      headers: {
        cookie: first.cookie,
        origin: TRUSTED_ORIGIN,
        "x-csrf-token": first.body.csrfToken,
      },
    });
    const guestBody = await readJson<SessionEnvelopeWire>(signOutAll);
    const guestCookie = cookiePair(signOutAll);
    expect(signOutAll.status).toBe(200);
    expectSessionEnvelope(guestBody, "guest");
    expect(guestBody.user).toBeNull();

    const revokedSecond = await fetch(`${harness.baseUrl}/api/auth/session`, {
      headers: { cookie: secondCookie },
    });
    const revokedBody = await readJson<SessionEnvelopeWire>(revokedSecond);
    expect(revokedSecond.status).toBe(200);
    expectSessionEnvelope(revokedBody, "expired");
    expect(revokedBody.user).toBeNull();

    const replacementGuest = await fetch(`${harness.baseUrl}/api/auth/session`, {
      headers: { cookie: guestCookie },
    });
    expect(replacementGuest.status).toBe(200);
    await expect(
      readJson<SessionEnvelopeWire>(replacementGuest),
    ).resolves.toEqual(guestBody);
  });

  it("keeps password-recovery responses generic for existing and unknown accounts", async () => {
    await register(harness, { email: "recovery@example.com" });
    const guest = await getGuest(harness);
    const requestReset = async (email: string) => {
      const response = await fetch(
        `${harness.baseUrl}/api/auth/password/forgot`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: guest.cookie,
            origin: TRUSTED_ORIGIN,
            "x-csrf-token": guest.body.csrfToken,
          },
          body: JSON.stringify({ email }),
        },
      );
      return { response, body: await readJson(response) };
    };

    const existing = await requestReset(" RECOVERY@example.com ");
    const unknown = await requestReset("unknown@example.com");
    const expected = {
      accepted: true,
      message:
        "If the account is eligible, the request was accepted. Message delivery is not configured.",
    };

    expect(existing.response.status).toBe(202);
    expect(unknown.response.status).toBe(202);
    expect(existing.body).toEqual(expected);
    expect(unknown.body).toEqual(expected);
  });

  it("requires an authenticated server session for private routes and ignores identity headers", async () => {
    const withoutSession = await fetch(`${harness.baseUrl}/api/bots/status`, {
      headers: { "x-user-id": "00000000-0000-4000-8000-000000000001" },
    });
    expect(withoutSession.status).toBe(401);
    await expect(readJson<ErrorWire>(withoutSession)).resolves.toEqual({
      code: "unauthorized",
      message: "Authentication is required.",
    });

    const guest = await getGuest(harness);
    const guestAttempt = await fetch(`${harness.baseUrl}/api/bots/status`, {
      headers: {
        cookie: guest.cookie,
        "x-user-id": "00000000-0000-4000-8000-000000000001",
      },
    });
    expect(guestAttempt.status).toBe(401);
    await expect(readJson<ErrorWire>(guestAttempt)).resolves.toEqual({
      code: "unauthorized",
      message: "Authentication is required.",
    });

    const registered = await register(harness, {
      email: "protected@example.com",
      guest,
    });
    const authenticated = await fetch(`${harness.baseUrl}/api/bots/status`, {
      headers: {
        cookie: registered.cookie,
        "x-user-id": "00000000-0000-4000-8000-000000000001",
      },
    });
    expect(authenticated.status).toBe(200);
  });

  it("fails legacy user-owned data closed at the ownership-migration boundary", async () => {
    const registered = await register(harness, {
      email: "ownership@example.com",
    });
    const response = await fetch(`${harness.baseUrl}/api/portfolio/summary`, {
      headers: { cookie: registered.cookie },
    });

    expect(response.status).toBe(503);
    await expect(readJson<ErrorWire>(response)).resolves.toEqual({
      code: "ownership_migration_required",
      message:
        "User-owned application data is unavailable until its ownership migration is applied.",
    });
  });
});
