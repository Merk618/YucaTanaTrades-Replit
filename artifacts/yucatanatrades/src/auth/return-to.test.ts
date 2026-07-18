import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authHrefWithReturnTo,
  protectedReturnDestination,
  returnToFromSearch,
  sanitizeReturnTo,
  signInHrefFor,
} from "./return-to.ts";

describe("auth return destinations", () => {
  it("preserves approved private routes and their local query", () => {
    assert.equal(sanitizeReturnTo("/overview"), "/overview");
    assert.equal(sanitizeReturnTo("/markets/stocks?symbol=NVDA#chart"),
      "/markets/stocks?symbol=NVDA#chart",
    );
    assert.equal(returnToFromSearch("?returnTo=%2Fjournal%3Ftab%3Dwins"),
      "/journal?tab=wins",
    );
  });

  for (const value of [
    "https://attacker.example/",
    "//attacker.example/",
    "/\\attacker.example/",
    "/sign-in",
    "/unknown-private-path",
    "javascript:alert(1)",
  ]) {
    it(`rejects an unsafe return destination: ${value}`, () => {
      assert.equal(sanitizeReturnTo(value), "/overview");
    });
  }

  it("builds encoded auth links without creating open redirects", () => {
    assert.equal(signInHrefFor("/portfolio", true),
      "/sign-in?returnTo=%2Fportfolio&reason=expired",
    );
    assert.equal(authHrefWithReturnTo("/register", "//attacker.example/"),
      "/register?returnTo=%2Foverview",
    );
  });

  it("preserves the protected caller query and hash in the sign-in destination", () => {
    const destination = protectedReturnDestination(
      "/markets/stocks",
      "symbol=NVDA",
      "#chart",
    );
    assert.equal(destination, "/markets/stocks?symbol=NVDA#chart");
    assert.equal(
      new URLSearchParams(signInHrefFor(destination).split("?", 2)[1]).get(
        "returnTo",
      ),
      destination,
    );
  });
});
