export interface AuthMutationGate {
  depth: number;
  epoch: number;
  pendingRevalidation: boolean;
}

export interface DeferredAuthRevalidation {
  showLoading: true;
}

export function createAuthMutationGate(): AuthMutationGate {
  return {
    depth: 0,
    epoch: 0,
    pendingRevalidation: false,
  };
}

export function beginAuthMutation(gate: AuthMutationGate): void {
  gate.depth += 1;
  gate.epoch += 1;
}

export function requestAuthRevalidation(gate: AuthMutationGate): boolean {
  if (gate.depth === 0) return true;
  gate.pendingRevalidation = true;
  return false;
}

export function endAuthMutation(
  gate: AuthMutationGate,
): DeferredAuthRevalidation | null {
  if (gate.depth === 0) {
    throw new Error("Cannot end an auth mutation that is not active.");
  }

  gate.depth -= 1;
  gate.epoch += 1;
  if (gate.depth !== 0 || !gate.pendingRevalidation) return null;

  gate.pendingRevalidation = false;
  return { showLoading: true };
}
