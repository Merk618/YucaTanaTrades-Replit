import { AlertTriangle, LoaderCircle, RotateCcw } from "lucide-react";
import { AuthFrame } from "./auth-frame";

export function AuthLoadingSurface() {
  return (
    <AuthFrame
      eyebrow="Session check"
      title="Opening secure access"
      description="Confirming the server-side session before Meridian OS is mounted."
    >
      <div className="yt-auth-status-card" role="status">
        <LoaderCircle className="yt-auth-spinner" aria-hidden="true" />
        <div><strong>Session lookup in progress</strong><span>Private workspace content remains hidden.</span></div>
      </div>
    </AuthFrame>
  );
}

export function AuthUnavailableSurface({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <AuthFrame
      eyebrow="Secure access status"
      title="Authentication unavailable"
      description="Meridian OS remains closed until the session service can be verified."
    >
      <div className="yt-auth-status-card is-unavailable" role="alert">
        <AlertTriangle aria-hidden="true" />
        <div><strong>Fail-closed session boundary</strong><span>{message}</span></div>
      </div>
      <button className="yt-auth-secondary-button" type="button" onClick={onRetry}>
        <RotateCcw aria-hidden="true" /> Retry secure access
      </button>
    </AuthFrame>
  );
}

export function AuthFeatureUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="yt-auth-status-card is-unavailable" role="status">
      <AlertTriangle aria-hidden="true" />
      <div><strong>{title}</strong><span>{description}</span></div>
    </div>
  );
}
