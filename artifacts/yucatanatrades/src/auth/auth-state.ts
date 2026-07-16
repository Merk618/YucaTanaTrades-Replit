import type {
  AuthStatus,
  SessionEnvelope,
  SessionUser,
} from "./auth-contract";

export type AuthRuntimeState =
  | { kind: "loading" }
  | { kind: "unavailable"; message: string }
  | { kind: "guest"; status: AuthStatus; session: SessionEnvelope }
  | { kind: "expired"; status: AuthStatus; session: SessionEnvelope }
  | {
      kind: "authenticated";
      status: AuthStatus;
      session: SessionEnvelope;
      user: SessionUser;
    };

export function stateFromEnvelope(
  status: AuthStatus,
  session: SessionEnvelope,
): AuthRuntimeState {
  if (!status.available) {
    return {
      kind: "unavailable",
      message: status.message ?? "Secure access is currently unavailable.",
    };
  }

  if (session.state === "authenticated" && session.user) {
    return { kind: "authenticated", status, session, user: session.user };
  }

  if (session.state === "expired") {
    return { kind: "expired", status, session };
  }

  if (session.state === "guest") {
    return { kind: "guest", status, session };
  }

  return {
    kind: "unavailable",
    message: "Secure access returned an invalid session state.",
  };
}

export function identityForState(state: AuthRuntimeState): string | null {
  return state.kind === "authenticated" ? state.user.id : null;
}

export function hasRefreshableSession(
  state: AuthRuntimeState,
): state is Extract<
  AuthRuntimeState,
  { kind: "guest" | "expired" | "authenticated" }
> {
  return (
    state.kind === "guest" ||
    state.kind === "expired" ||
    state.kind === "authenticated"
  );
}
