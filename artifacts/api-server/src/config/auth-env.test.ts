import { describe, expect, it } from "vitest";
import { loadAuthEnvironment } from "./auth-env";

const STRONG_SECRET =
  "auth-environment-test/2026-07-13/meridian-session-foundation";

describe("authentication environment validation", () => {
  it("boots development memory mode without a database and keeps delivery features off by default", () => {
    const environment = loadAuthEnvironment({
      NODE_ENV: "development",
      AUTH_STORE: "memory",
      SESSION_SECRET: STRONG_SECRET,
    });

    expect(environment.storeMode).toBe("memory");
    expect(environment.cookie).toMatchObject({
      name: "ytt_session",
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(environment.features).toEqual({
      registration: true,
      passwordReset: false,
      emailVerification: false,
    });
    expect(environment.trustProxy).toBe(false);
  });

  it("accepts only explicit trusted proxy addresses, CIDRs, or safe aliases", () => {
    const environment = loadAuthEnvironment({
      NODE_ENV: "test",
      AUTH_STORE: "memory",
      SESSION_SECRET: STRONG_SECRET,
      AUTH_TRUST_PROXY: "loopback,10.20.0.0/16,2001:db8::1",
    });

    expect(environment.trustProxy).toEqual([
      "loopback",
      "10.20.0.0/16",
      "2001:db8::1",
    ]);
    expect(() =>
      loadAuthEnvironment({
        NODE_ENV: "test",
        AUTH_STORE: "memory",
        SESSION_SECRET: STRONG_SECRET,
        AUTH_TRUST_PROXY: "true",
      }),
    ).toThrow(/AUTH_TRUST_PROXY/);
    for (const catchAll of ["0.0.0.0/0", "::/0", "203.0.113.10/0"]) {
      expect(() =>
        loadAuthEnvironment({
          NODE_ENV: "test",
          AUTH_STORE: "memory",
          SESSION_SECRET: STRONG_SECRET,
          AUTH_TRUST_PROXY: catchAll,
        }),
      ).toThrow(/invalid CIDR/);
    }
  });

  it("allows non-Secure cookies only when every non-production origin is loopback HTTP", () => {
    const base = {
      NODE_ENV: "test",
      AUTH_STORE: "memory",
      SESSION_SECRET: STRONG_SECRET,
    } as const;

    const loopbackEnvironment = loadAuthEnvironment({
      ...base,
      AUTH_ALLOWED_ORIGINS:
        "http://localhost:4173,http://127.0.0.1:4173,http://[::1]:4173",
    });
    expect(loopbackEnvironment.cookie.secure).toBe(false);

    expect(() =>
      loadAuthEnvironment({
        ...base,
        APP_ORIGIN: "https://localhost:4173",
      }),
    ).toThrow(/AUTH_COOKIE_SECURE=true/);
    expect(() =>
      loadAuthEnvironment({
        ...base,
        APP_ORIGIN: "https://preview.yucatanatrades.example",
      }),
    ).toThrow(/AUTH_COOKIE_SECURE=true/);
    expect(() =>
      loadAuthEnvironment({
        ...base,
        AUTH_ALLOWED_ORIGINS:
          "http://localhost:4173,https://preview.yucatanatrades.example",
      }),
    ).toThrow(/AUTH_COOKIE_SECURE=true/);

    const secureEnvironment = loadAuthEnvironment({
      ...base,
      APP_ORIGIN: "https://preview.yucatanatrades.example",
      AUTH_COOKIE_SECURE: "true",
    });
    expect(secureEnvironment.cookie.secure).toBe(true);
    expect(secureEnvironment.cookie.name).toBe("__Host-ytt_session");
    expect([...secureEnvironment.allowedOrigins]).toEqual([
      "https://preview.yucatanatrades.example",
    ]);

    expect(() =>
      loadAuthEnvironment({
        ...base,
        APP_ORIGIN: "http://preview.yucatanatrades.example",
        AUTH_COOKIE_SECURE: "true",
      }),
    ).toThrow(/loopback hosts/);

    let credentialError: unknown;
    try {
      loadAuthEnvironment({
        ...base,
        APP_ORIGIN: "https://operator:origin-secret@preview.yucatanatrades.example",
        AUTH_COOKIE_SECURE: "true",
      });
    } catch (error) {
      credentialError = error;
    }
    expect(credentialError).toBeInstanceOf(Error);
    expect((credentialError as Error).message).not.toContain("origin-secret");
  });

  it("requires explicit production enablement, database storage, HTTPS origins, and secure cookies", () => {
    const base = {
      NODE_ENV: "production",
      AUTH_ENABLED: "true",
      AUTH_STORE: "database",
      DATABASE_URL: "postgresql://db.example/yucatanatrades",
      SESSION_SECRET: STRONG_SECRET,
      APP_ORIGIN: "https://app.yucatanatrades.example",
    } as const;

    const environment = loadAuthEnvironment(base);
    expect(environment.cookie).toMatchObject({
      name: "__Host-ytt_session",
      secure: true,
    });
    expect(environment.storeMode).toBe("database");

    expect(() =>
      loadAuthEnvironment({ ...base, AUTH_ENABLED: undefined }),
    ).toThrow(/AUTH_ENABLED/);
    expect(() =>
      loadAuthEnvironment({ ...base, AUTH_STORE: "memory" }),
    ).toThrow(/AUTH_STORE=memory/);
    expect(() =>
      loadAuthEnvironment({ ...base, APP_ORIGIN: "http://app.example" }),
    ).toThrow(/HTTPS/);
    expect(() =>
      loadAuthEnvironment({ ...base, AUTH_COOKIE_SECURE: "false" }),
    ).toThrow(/Secure authentication cookies/);
  });

  it("forbids development-token exposure and ownership cutover flags in production", () => {
    const base = {
      NODE_ENV: "production",
      AUTH_ENABLED: "true",
      AUTH_STORE: "database",
      DATABASE_URL: "postgresql://db.example/yucatanatrades",
      SESSION_SECRET: STRONG_SECRET,
      APP_ORIGIN: "https://app.yucatanatrades.example",
    } as const;

    expect(() =>
      loadAuthEnvironment({ ...base, AUTH_EXPOSE_DEV_TOKENS: "true" }),
    ).toThrow(/Development token exposure/);
    expect(() =>
      loadAuthEnvironment({ ...base, AUTH_USER_DATA_MIGRATION_READY: "true" }),
    ).toThrow(/cannot be enabled/);
  });

  it("permits development-token exposure only on a loopback-bound local stack", () => {
    const local = loadAuthEnvironment({
      NODE_ENV: "development",
      AUTH_STORE: "memory",
      SESSION_SECRET: STRONG_SECRET,
      AUTH_EXPOSE_DEV_TOKENS: "true",
      AUTH_BIND_HOST: "127.0.0.1",
      APP_ORIGIN: "http://127.0.0.1:4173",
    });
    expect(local.bindHost).toBe("127.0.0.1");
    expect(local.exposeDevelopmentTokens).toBe(true);

    expect(() =>
      loadAuthEnvironment({
        NODE_ENV: "development",
        AUTH_STORE: "memory",
        SESSION_SECRET: STRONG_SECRET,
        AUTH_EXPOSE_DEV_TOKENS: "true",
        AUTH_BIND_HOST: "0.0.0.0",
        APP_ORIGIN: "http://127.0.0.1:4173",
      }),
    ).toThrow(/exact loopback IP/);
    expect(() =>
      loadAuthEnvironment({
        NODE_ENV: "development",
        AUTH_STORE: "memory",
        SESSION_SECRET: STRONG_SECRET,
        AUTH_EXPOSE_DEV_TOKENS: "true",
        AUTH_BIND_HOST: "127.0.0.1",
        AUTH_COOKIE_SECURE: "true",
        APP_ORIGIN: "https://shared-preview.example",
      }),
    ).toThrow(/loopback-only application origins/);
  });
});
