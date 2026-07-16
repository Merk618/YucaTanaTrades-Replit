import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AuthStoreTimeoutError,
  withAuthStoreTimeout,
} from "./timed-store.ts";
import type { AuthStore } from "./types.ts";

describe("bounded authentication storage", () => {
  it("rejects a never-settling store operation within the configured bound", async () => {
    const store = {
      checkAvailability: () => new Promise<boolean>(() => {}),
    } as AuthStore;
    const timed = withAuthStoreTimeout(store, 10);

    await assert.rejects(
      timed.checkAvailability(),
      AuthStoreTimeoutError,
    );
  });

  it("passes through a settled store result", async () => {
    const store = {
      checkAvailability: async () => true,
    } as AuthStore;
    const timed = withAuthStoreTimeout(store, 50);

    assert.equal(await timed.checkAvailability(), true);
  });
});
