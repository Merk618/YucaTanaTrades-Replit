import * as React from "react";
import { Link } from "wouter";
import { useAuth } from "@/auth/auth-provider";
import { safeAuthErrorMessage } from "@/auth/auth-error-copy";
import { useOneTimeToken } from "@/auth/use-one-time-token";
import { AuthActions, AuthFrame, AuthNotice } from "@/components/auth/auth-frame";
import { AuthFeatureUnavailable } from "@/components/auth/auth-status-surface";

export default function VerifyEmailPage() {
  const {
    state,
    requestEmailVerification,
    completeEmailVerification,
  } = useAuth();
  const { token, clearToken } = useOneTimeToken();
  const enabled = state.kind !== "loading" && state.kind !== "unavailable" && state.status.features.emailVerificationEnabled;
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const complete = async () => {
    setPending(true);
    setServerError(null);
    try {
      await completeEmailVerification({ token });
      clearToken();
      setMessage("Email verification completed.");
    } catch (error) {
      setServerError(safeAuthErrorMessage(error, "verify"));
    } finally {
      setPending(false);
    }
  };

  const request = async () => {
    setPending(true);
    setServerError(null);
    try {
      await requestEmailVerification();
      setMessage("The verification request was accepted; delivery is not configured in this phase.");
    } catch (error) {
      setServerError(safeAuthErrorMessage(error, "verify"));
    } finally {
      setPending(false);
    }
  };

  const authenticated = state.kind === "authenticated";
  const alreadyVerified = authenticated && state.user.emailVerified;

  return (
    <AuthFrame
      eyebrow="Identity verification"
      title="Verify your email"
      description="Verification consumes a one-time token. The token has been removed from the visible browser URL."
    >
      {!enabled ? (
        <AuthFeatureUnavailable
          title="Email verification is not configured"
          description="No delivery or verification claim has been made."
        />
      ) : serverError ? (
        <AuthNotice tone="error">{serverError}</AuthNotice>
      ) : message ? (
        <AuthNotice tone="success">{message}</AuthNotice>
      ) : alreadyVerified ? (
        <AuthNotice tone="success">The server reports this email as verified.</AuthNotice>
      ) : token ? (
        <button className="yt-auth-submit" type="button" disabled={pending} onClick={() => void complete()}>
          {pending ? "Working…" : "Complete verification"}
        </button>
      ) : authenticated ? (
        <button className="yt-auth-submit" type="button" disabled={pending} onClick={() => void request()}>
          {pending ? "Working…" : "Request verification message"}
        </button>
      ) : (
        <AuthFeatureUnavailable
          title="Verification link or session required"
          description="Sign in to request a verification message, or open a valid one-time link."
        />
      )}

      <AuthActions>
        {authenticated ? <Link href="/overview">Return to Meridian OS</Link> : <Link href="/sign-in">Sign in</Link>}
      </AuthActions>
    </AuthFrame>
  );
}
