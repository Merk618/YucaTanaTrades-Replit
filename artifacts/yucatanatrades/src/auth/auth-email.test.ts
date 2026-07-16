import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authEmailInputSchema,
  sessionUserSchema,
} from "./auth-contract.ts";

describe("authentication email contract", () => {
  it("canonicalizes a compatible address before submission", () => {
    assert.equal(
      authEmailInputSchema.parse("  Trader\uff20Example.COM  "),
      "Trader@Example.COM",
    );
  });

  it("rejects any registration address that the session response rejects", () => {
    const email = "a@b..com";
    assert.equal(authEmailInputSchema.safeParse(email).success, false);
    assert.equal(
      sessionUserSchema.safeParse({
        id: "00000000-0000-4000-8000-000000000001",
        email,
        displayName: null,
        emailVerified: false,
      }).success,
      false,
    );
  });
});
