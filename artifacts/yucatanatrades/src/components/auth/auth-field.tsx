import * as React from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

interface AuthFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ id, label, error, hint, type = "text", ...props }, ref) => {
    const [revealed, setRevealed] = React.useState(false);
    const isPassword = type === "password";
    const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
    const wrapClassName = [
      "yt-auth-input-wrap",
      error ? "has-error" : "",
      isPassword ? "has-reveal" : "",
    ].filter(Boolean).join(" ");

    return (
      <div className="yt-auth-field">
        <label htmlFor={id}>{label}</label>
        <div className={wrapClassName} data-revealed={isPassword ? revealed : undefined}>
          <input
            {...props}
            ref={ref}
            id={id}
            type={isPassword && revealed ? "text" : type}
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionId}
          />
          {isPassword && (
            <button
              type="button"
              className="yt-auth-reveal"
              onClick={() => setRevealed((current) => !current)}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-controls={id}
              aria-pressed={revealed}
              title={revealed ? "Hide password" : "Show password"}
            >
              <span aria-hidden="true">
                {revealed ? <EyeOff /> : <Eye />}
              </span>
            </button>
          )}
        </div>
        {error ? <small id={`${id}-error`} className="is-error">{error}</small> : hint ? (
          <small id={`${id}-hint`}>{hint}</small>
        ) : null}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";

export function AuthSubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button className="yt-auth-submit" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? <LoaderCircle className="yt-auth-submit-spinner" aria-hidden="true" /> : null}
      <span aria-live="polite">{pending ? "Working…" : children}</span>
      {!pending ? <ArrowRight className="yt-auth-submit-arrow" aria-hidden="true" /> : null}
    </button>
  );
}
