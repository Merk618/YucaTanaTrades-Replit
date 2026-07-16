import assert from "node:assert/strict";
import test from "node:test";
import {
  scrubOneTimeTokenFromUrl,
  tokenFromFragment,
} from "./use-one-time-token.ts";

test("one-time tokens are accepted only from URL fragments", () => {
  assert.equal(tokenFromFragment("#token=fragment-secret"), "fragment-secret");
  assert.equal(tokenFromFragment(""), "");
});

test("one-time tokens are scrubbed from query and fragment locations", () => {
  assert.equal(
    scrubOneTimeTokenFromUrl(
      "https://app.example/reset-password?token=query-secret&returnTo=%2F#token=fragment-secret&mode=reset",
    ),
    "/reset-password?returnTo=%2F#mode=reset",
  );
});
