import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  setApiErrorHandler,
  setCsrfTokenGetter,
} from "@workspace/api-client-react";
import { authClient, getAuthErrorCode } from "./auth-client";
import { shouldStartFailClosedAuthRevalidation } from "./auth-error-policy";
import {
  beginAuthMutation,
  createAuthMutationGate,
  endAuthMutation,
  requestAuthRevalidation,
} from "./auth-mutation-gate";
import type {
  AuthStatus,
  CompleteEmailVerificationInput,
  ForgotPasswordInput,
  GenericActionResponse,
  RegisterInput,
  ResetPasswordInput,
  SessionEnvelope,
  SignInInput,
} from "./auth-contract";
import {
  hasRefreshableSession,
  identityForState,
  stateFromEnvelope,
  type AuthRuntimeState,
} from "./auth-state";

const unavailableMessage = "Secure access is currently unavailable. Please retry in a moment.";

interface AuthContextValue {
  state: AuthRuntimeState;
  refresh: () => Promise<void>;
  validateSession: () => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  signOutAllDevices: () => Promise<void>;
  requestPasswordReset: (input: ForgotPasswordInput) => Promise<GenericActionResponse>;
  completePasswordReset: (input: ResetPasswordInput) => Promise<GenericActionResponse>;
  requestEmailVerification: () => Promise<GenericActionResponse>;
  completeEmailVerification: (
    input: CompleteEmailVerificationInput,
  ) => Promise<GenericActionResponse>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = React.useState<AuthRuntimeState>({ kind: "loading" });
  const statusRef = React.useRef<AuthStatus | null>(null);
  const csrfRef = React.useRef<string | null>(null);
  const identityRef = React.useRef<string | null | undefined>(undefined);
  const refreshInFlightRef = React.useRef<Promise<void> | null>(null);
  const refreshSequenceRef = React.useRef(0);
  const mutationGateRef = React.useRef(createAuthMutationGate());

  const adoptState = React.useCallback((nextState: AuthRuntimeState) => {
    const nextIdentity = identityForState(nextState);
    if (
      identityRef.current !== undefined &&
      identityRef.current !== nextIdentity
    ) {
      queryClient.clear();
    }

    identityRef.current = nextIdentity;
    csrfRef.current =
      nextState.kind === "guest" ||
      nextState.kind === "expired" ||
      nextState.kind === "authenticated"
        ? nextState.session.csrfToken
        : null;
    setState(nextState);
  }, [queryClient]);

  const adoptEnvelope = React.useCallback((status: AuthStatus, envelope: SessionEnvelope) => {
    statusRef.current = status;
    adoptState(stateFromEnvelope(status, envelope));
  }, [adoptState]);

  const markUnavailable = React.useCallback((message = unavailableMessage) => {
    statusRef.current = null;
    adoptState({ kind: "unavailable", message });
  }, [adoptState]);

  const refreshSession = React.useCallback(async (
    showLoading = true,
    forceNew = false,
  ) => {
    if (!forceNew && refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshSequence = refreshSequenceRef.current + 1;
    refreshSequenceRef.current = refreshSequence;
    const mutationEpoch = mutationGateRef.current.epoch;
    const isCurrent = () =>
      refreshSequenceRef.current === refreshSequence &&
      mutationGateRef.current.epoch === mutationEpoch;

    const task = (async () => {
      if (showLoading && isCurrent()) setState({ kind: "loading" });
      try {
        const status = statusRef.current ?? await authClient.getStatus();
        if (!isCurrent()) return;
        if (!status.available) {
          markUnavailable(status.message ?? unavailableMessage);
          return;
        }

        const envelope = await authClient.getSession();
        if (!isCurrent()) return;
        adoptEnvelope(status, envelope);
      } catch {
        if (isCurrent()) markUnavailable();
      }
    })();

    refreshInFlightRef.current = task;
    try {
      await task;
    } finally {
      if (refreshInFlightRef.current === task) {
        refreshInFlightRef.current = null;
      }
    }
  }, [adoptEnvelope, markUnavailable]);

  const runAuthMutation = React.useCallback(async <T,>(
    action: () => Promise<T>,
  ): Promise<T> => {
    const gate = mutationGateRef.current;
    beginAuthMutation(gate);
    let succeeded = false;
    try {
      const result = await action();
      succeeded = true;
      return result;
    } finally {
      const deferredRevalidation = endAuthMutation(gate);
      if (deferredRevalidation) {
        void refreshSession(deferredRevalidation.showLoading, true);
      } else if (!succeeded) {
        void refreshSession(false, true);
      }
    }
  }, [refreshSession]);

  const refresh = React.useCallback(async () => {
    statusRef.current = null;
    await refreshSession(true, true);
  }, [refreshSession]);

  const validateSession = React.useCallback(async () => {
    await refreshSession(true);
  }, [refreshSession]);

  React.useEffect(() => {
    setCsrfTokenGetter(() => csrfRef.current);
    setApiErrorHandler((error) => {
      if (
        shouldStartFailClosedAuthRevalidation(
          error.status,
          getAuthErrorCode(error),
          refreshInFlightRef.current !== null,
          error.url,
        )
      ) {
        if (requestAuthRevalidation(mutationGateRef.current)) {
          void refreshSession(true, true);
        }
      }
    });
    void refresh();

    return () => {
      setApiErrorHandler(null);
      setCsrfTokenGetter(null);
      csrfRef.current = null;
    };
  }, [refresh, refreshSession]);

  React.useEffect(() => {
    if (!hasRefreshableSession(state) || !state.session.expiresAt) return;
    const expiresAt = Date.parse(state.session.expiresAt);
    if (!Number.isFinite(expiresAt)) return;

    const maxDelay = 2_147_000_000;
    const delay = Math.min(maxDelay, Math.max(0, expiresAt - Date.now() + 100));
    const timer = window.setTimeout(() => void refreshSession(true), delay);
    return () => window.clearTimeout(timer);
  }, [refreshSession, state]);

  React.useEffect(() => {
    if (!hasRefreshableSession(state)) return;
    const validateVisibleSession = () => {
      if (document.visibilityState === "visible") {
        void refreshSession(false);
      }
    };
    window.addEventListener("focus", validateVisibleSession);
    document.addEventListener("visibilitychange", validateVisibleSession);
    return () => {
      window.removeEventListener("focus", validateVisibleSession);
      document.removeEventListener("visibilitychange", validateVisibleSession);
    };
  }, [refreshSession, state]);

  const signIn = React.useCallback(async (input: SignInInput) => {
    const status = statusRef.current;
    if (!status?.available) throw new Error(unavailableMessage);
    const envelope = await runAuthMutation(() => authClient.signIn(input));
    adoptEnvelope(status, envelope);
  }, [adoptEnvelope, runAuthMutation]);

  const register = React.useCallback(async (input: RegisterInput) => {
    const status = statusRef.current;
    if (!status?.available || !status.features.registrationEnabled) {
      throw new Error("Registration is unavailable.");
    }
    const envelope = await runAuthMutation(() => authClient.register(input));
    adoptEnvelope(status, envelope);
  }, [adoptEnvelope, runAuthMutation]);

  const signOut = React.useCallback(async () => {
    const status = statusRef.current;
    if (!status?.available) throw new Error(unavailableMessage);
    const envelope = await runAuthMutation(() => authClient.signOut());
    adoptEnvelope(status, envelope);
  }, [adoptEnvelope, runAuthMutation]);

  const signOutAllDevices = React.useCallback(async () => {
    const status = statusRef.current;
    if (!status?.available) throw new Error(unavailableMessage);
    const envelope = await runAuthMutation(() => authClient.signOutAllDevices());
    adoptEnvelope(status, envelope);
  }, [adoptEnvelope, runAuthMutation]);

  const requestPasswordReset = React.useCallback(async (input: ForgotPasswordInput) => {
    return authClient.requestPasswordReset(input);
  }, []);

  const completePasswordReset = React.useCallback(async (input: ResetPasswordInput) => {
    const result = await runAuthMutation(() =>
      authClient.completePasswordReset(input),
    );
    await refreshSession(false, true);
    return result;
  }, [refreshSession, runAuthMutation]);

  const requestEmailVerification = React.useCallback(async () => {
    return authClient.requestEmailVerification();
  }, []);

  const completeEmailVerification = React.useCallback(async (
    input: CompleteEmailVerificationInput,
  ) => {
    const result = await runAuthMutation(() =>
      authClient.completeEmailVerification(input),
    );
    await refreshSession(false, true);
    return result;
  }, [refreshSession, runAuthMutation]);

  const value = React.useMemo<AuthContextValue>(() => ({
    state,
    refresh,
    validateSession,
    signIn,
    register,
    signOut,
    signOutAllDevices,
    requestPasswordReset,
    completePasswordReset,
    requestEmailVerification,
    completeEmailVerification,
  }), [
    completeEmailVerification,
    completePasswordReset,
    refresh,
    register,
    requestEmailVerification,
    requestPasswordReset,
    signIn,
    signOut,
    signOutAllDevices,
    state,
    validateSession,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
