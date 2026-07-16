import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

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

    return (
      <div className="yt-auth-field">
        <label htmlFor={id}>{label}</label>
        <div className={error ? "yt-auth-input-wrap has-error" : "yt-auth-input-wrap"}>
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
            >
              {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
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
      <span>{pending ? "Working…" : children}</span>
    </button>
  );
}
