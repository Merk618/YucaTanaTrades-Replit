import { describe, expect, it } from "vitest";
import { MemoryAuthStore } from "./memory-store";

describe("MemoryAuthStore", () => {
  it("atomically replaces concurrent password-reset tokens for one user", async () => {
    const store = new MemoryAuthStore();
    const createdAt = new Date("2026-07-13T05:00:00.000Z");
    const tokens = ["reset-hmac-1", "reset-hmac-2"].map((tokenHmac, index) => ({
      id: `reset-${index}`,
      userId: "reset-user",
      tokenHmac,
      createdAt,
      expiresAt: new Date("2026-07-13T05:30:00.000Z"),
      usedAt: null,
    }));

    await Promise.all(tokens.map((token) => store.replacePasswordResetToken(token)));
    const consumed = await Promise.all(
      tokens.map((token) =>
        store.consumePasswordResetToken(token.tokenHmac, createdAt),
      ),
    );

    expect(consumed.filter(Boolean)).toHaveLength(1);
  });

  it("atomically replaces concurrent email-verification tokens for one user", async () => {
    const store = new MemoryAuthStore();
    const createdAt = new Date("2026-07-13T05:00:00.000Z");
    const tokens = ["verification-hmac-1", "verification-hmac-2"].map(
      (tokenHmac, index) => ({
        id: `verification-${index}`,
        userId: "verification-user",
        tokenHmac,
        createdAt,
        expiresAt: new Date("2026-07-14T05:00:00.000Z"),
        usedAt: null,
      }),
    );

    await Promise.all(
      tokens.map((token) => store.replaceEmailVerificationToken(token)),
    );
    const consumed = await Promise.all(
      tokens.map((token) =>
        store.consumeEmailVerificationToken(token.tokenHmac, createdAt),
      ),
    );

    expect(consumed.filter(Boolean)).toHaveLength(1);
  });

  it("enforces fixed-window attempt limits and isolates the next window", async () => {
    const store = new MemoryAuthStore();
    const windowStartedAt = new Date("2026-07-13T05:00:00.000Z");
    const input = {
      scope: "sign-in-email",
      subjectHmac: "a".repeat(64),
      windowStartedAt,
      now: windowStartedAt,
      limit: 2,
      blockMs: 60_000,
    };

    await expect(
      store.recordRateLimitAttempt({ ...input, id: "attempt-1" }),
    ).resolves.toEqual({ allowed: true, attempts: 1, retryAt: null });
    await expect(
      store.recordRateLimitAttempt({ ...input, id: "attempt-2" }),
    ).resolves.toEqual({ allowed: true, attempts: 2, retryAt: null });

    const blocked = await store.recordRateLimitAttempt({
      ...input,
      id: "attempt-3",
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.attempts).toBe(3);
    expect(blocked.retryAt?.toISOString()).toBe("2026-07-13T05:01:00.000Z");

    const stillBlocked = await store.recordRateLimitAttempt({
      ...input,
      id: "attempt-4",
      now: new Date("2026-07-13T05:00:30.000Z"),
    });
    expect(stillBlocked.allowed).toBe(false);
    expect(stillBlocked.attempts).toBe(4);
    expect(stillBlocked.retryAt?.toISOString()).toBe(
      "2026-07-13T05:01:00.000Z",
    );

    await expect(
      store.recordRateLimitAttempt({
        ...input,
        id: "attempt-next-window",
        windowStartedAt: new Date("2026-07-13T05:01:00.000Z"),
        now: new Date("2026-07-13T05:01:00.000Z"),
      }),
    ).resolves.toEqual({ allowed: true, attempts: 1, retryAt: null });
  });
});
