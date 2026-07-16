import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginAuthMutation,
  createAuthMutationGate,
  endAuthMutation,
  requestAuthRevalidation,
} from "./auth-mutation-gate.ts";

describe("auth mutation revalidation gate", () => {
  it("defers a synchronous invalidation handler until the mutation closes", () => {
    const gate = createAuthMutationGate();

    beginAuthMutation(gate);
    assert.equal(requestAuthRevalidation(gate), false);
    assert.equal(gate.pendingRevalidation, true);
    assert.deepEqual(endAuthMutation(gate), { showLoading: true });
    assert.deepEqual(gate, {
      depth: 0,
      epoch: 2,
      pendingRevalidation: false,
    });
  });

  it("waits for nested mutations and leaves clean mutations without a refresh", () => {
    const gate = createAuthMutationGate();

    beginAuthMutation(gate);
    beginAuthMutation(gate);
    assert.equal(requestAuthRevalidation(gate), false);
    assert.equal(endAuthMutation(gate), null);
    assert.deepEqual(endAuthMutation(gate), { showLoading: true });

    beginAuthMutation(gate);
    assert.equal(endAuthMutation(gate), null);
  });

  it("allows an immediate refresh when no mutation is active", () => {
    assert.equal(requestAuthRevalidation(createAuthMutationGate()), true);
  });
});
