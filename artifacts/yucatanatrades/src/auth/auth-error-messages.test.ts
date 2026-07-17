import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeAuthErrorMessageForCode } from "./auth-error-messages.ts";

describe("safe auth error copy", () => {
  it("does not distinguish unknown-account and bad-password sign-in failures", () => {
    assert.equal(
      safeAuthErrorMessageForCode("invalid_credentials", "sign-in"),
      "Unable to sign in with those credentials.",
    );
    assert.equal(
      safeAuthErrorMessageForCode("unauthorized", "sign-in"),
      "Unable to sign in with those credentials.",
    );
  });

  it("uses bounded, non-secret operational messages", () => {
    assert.equal(
      safeAuthErrorMessageForCode("rate_limited", "forgot"),
      "Too many attempts. Please wait before trying again.",
    );
    assert.equal(
      safeAuthErrorMessageForCode("csrf_invalid", "register"),
      "Your secure form context changed. Please try again.",
    );
    assert.equal(
      safeAuthErrorMessageForCode("invalid_credentials", "review-access"),
      "That review code could not be accepted.",
    );
    assert.equal(
      safeAuthErrorMessageForCode("rate_limited", "review-access"),
      "Too many attempts. Please wait before trying again.",
    );
  });
});
