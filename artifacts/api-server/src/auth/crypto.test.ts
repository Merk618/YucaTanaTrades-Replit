import { describe, expect, it } from "vitest";
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

const TEST_ARGON2ID: Argon2idOptions = {
  memoryKiB: 32,
  passes: 2,
  parallelism: 2,
  tagLength: 16,
};

describe("authentication crypto", () => {
  it("round-trips Argon2id password hashes and rejects a wrong password", async () => {
    const encoded = await hashPassword(
      "correct horse battery staple",
      TEST_ARGON2ID,
    );

    expect(encoded).toMatch(
      /^ytt-argon2id:v1:m=32,t=2,p=2,l=16:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/,
    );
    await expect(
      verifyPassword("correct horse battery staple", encoded),
    ).resolves.toBe(true);
    await expect(
      verifyPassword("correct horse battery stapler", encoded),
    ).resolves.toBe(false);
  });

  it("generates opaque 256-bit tokens and domain-separates at-rest HMACs", () => {
    const token = generateOpaqueToken();
    const secondToken = generateOpaqueToken();
    const secret = "test-secret-with-at-least-32-distinct-ish-characters";
    const sessionHmac = domainHmac(
      secret,
      "ytt/session-token-at-rest/v1",
      token,
    );
    const resetHmac = domainHmac(
      secret,
      "ytt/password-reset-token-at-rest/v1",
      token,
    );

    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(Buffer.from(secondToken, "base64url")).toHaveLength(32);
    expect(secondToken).not.toBe(token);
    expect(sessionHmac).toMatch(/^[a-f0-9]{64}$/);
    expect(resetHmac).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionHmac).not.toBe(resetHmac);
    expect(sessionHmac).not.toContain(token);
    expect(
      safeHmacEqual(
        sessionHmac,
        domainHmac(secret, "ytt/session-token-at-rest/v1", token),
      ),
    ).toBe(true);
    expect(safeHmacEqual(sessionHmac, resetHmac)).toBe(false);
  });

  it("derives a stable, session-bound synchronizer token", () => {
    const secret = "test-secret-with-at-least-32-distinct-ish-characters";
    const first = deriveSynchronizerToken(secret, "session-a");

    expect(first).toBe(deriveSynchronizerToken(secret, "session-a"));
    expect(first).not.toBe(deriveSynchronizerToken(secret, "session-b"));
    expect(Buffer.from(first, "base64url")).toHaveLength(32);
  });

  it("normalizes email lookup keys without retaining surrounding whitespace", () => {
    expect(normalizeEmail("  TEST\uff20Example.COM  ")).toBe("test@example.com");
  });
});
