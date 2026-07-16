import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldStartFailClosedAuthRevalidation } from "./auth-error-policy.ts";

describe("auth error observer policy", () => {
  it("fails closed for invalid sessions, CSRF changes, and auth-storage outages", () => {
    assert.equal(shouldStartFailClosedAuthRevalidation(401, "unauthorized", false, "/api/portfolio"), true);
    assert.equal(shouldStartFailClosedAuthRevalidation(401, "session_expired", false, "/api/journal"), true);
    assert.equal(shouldStartFailClosedAuthRevalidation(403, "csrf_invalid", false, "/api/auth/sign-out"), true);
    assert.equal(shouldStartFailClosedAuthRevalidation(503, "unavailable", false, "/api/auth/status"), true);
  });

  it("does not unmount the shell for feature-disabled or unrelated errors", () => {
    assert.equal(shouldStartFailClosedAuthRevalidation(403, "unavailable", false, "/api/auth/register"), false);
    assert.equal(shouldStartFailClosedAuthRevalidation(503, "invalid_request", false, "/api/portfolio"), false);
    assert.equal(shouldStartFailClosedAuthRevalidation(400, null, false, "/api/auth/register"), false);
  });

  it("lets an active session refresh settle its own 503 without recursion", () => {
    assert.equal(shouldStartFailClosedAuthRevalidation(503, "unavailable", true, "https://app.test/api/auth/status"), false);
    assert.equal(shouldStartFailClosedAuthRevalidation(401, "session_expired", true, "/api/auth/session"), false);
    assert.equal(shouldStartFailClosedAuthRevalidation(401, "session_expired", true, "/api/portfolio"), true);
  });
});
