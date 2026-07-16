import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthStatus, SessionEnvelope } from "./auth-contract.ts";
import {
  hasRefreshableSession,
  identityForState,
  stateFromEnvelope,
} from "./auth-state.ts";

const status: AuthStatus = {
  available: true,
  message: null,
  features: {
    registrationEnabled: true,
    passwordResetEnabled: false,
    emailVerificationEnabled: false,
  },
};

const csrfToken = "csrf-token-with-at-least-thirty-two-bytes";

describe("auth runtime state", () => {
  it("accepts only server-provided identity for authenticated state", () => {
    const session: SessionEnvelope = {
      state: "authenticated",
      csrfToken,
      expiresAt: "2026-07-14T12:00:00.000Z",
      user: {
        id: "4a37bf09-e3d8-4b67-94a9-10c1063bf4ce",
        email: "trader@example.com",
        displayName: null,
        emailVerified: false,
      },
    };
    const state = stateFromEnvelope(status, session);
    assert.equal(state.kind, "authenticated");
    assert.equal(identityForState(state), session.user?.id);
    assert.equal(hasRefreshableSession(state), true);
  });

  for (const wireState of ["guest", "expired"] as const) {
    it(`keeps ${wireState} identity empty`, () => {
      const state = stateFromEnvelope(status, {
        state: wireState,
        csrfToken,
        expiresAt: null,
        user: null,
      });
      assert.equal(state.kind, wireState);
      assert.equal(identityForState(state), null);
      assert.equal(hasRefreshableSession(state), true);
    });
  }

  it("fails closed when authentication status is unavailable", () => {
    const state = stateFromEnvelope(
      { ...status, available: false, message: "Maintenance" },
      { state: "guest", csrfToken, expiresAt: null, user: null },
    );
    assert.deepEqual(state, { kind: "unavailable", message: "Maintenance" });
    assert.equal(hasRefreshableSession(state), false);
  });
});
