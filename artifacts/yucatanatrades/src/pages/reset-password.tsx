import * as React from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { useAuth } from "@/auth/auth-provider";
import { safeAuthErrorMessage } from "@/auth/auth-error-copy";
import { useOneTimeToken } from "@/auth/use-one-time-token";
import { AuthField, AuthSubmitButton } from "@/components/auth/auth-field";
import { AuthActions, AuthFrame, AuthNotice } from "@/components/auth/auth-frame";
import { AuthFeatureUnavailable } from "@/components/auth/auth-status-surface";
import { resolveResetPasswordSurface } from "./reset-password-surface";

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const { state, completePasswordReset } = useAuth();
  const { token, clearToken } = useOneTimeToken();
  const enabled = state.kind !== "loading" && state.kind !== "unavailable" && state.status.features.passwordResetEnabled;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [completed, setCompleted] = React.useState(false);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<ResetPasswordForm>();
  const surface = resolveResetPasswordSurface({
    enabled,
    completed,
    hasToken: Boolean(token),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await completePasswordReset({ token, password: values.password });
      clearToken();
      setCompleted(true);
    } catch (error) {
      setServerError(safeAuthErrorMessage(error, "reset"));
    }
  });

  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Set a new password"
      description="A successful reset consumes the one-time token and revokes prior authenticated sessions."
    >
      {surface === "unavailable" ? (
        <AuthFeatureUnavailable
          title="Password reset is unavailable"
          description="The recovery feature is not configured, so no password has been changed."
        />
      ) : surface === "completed" ? (
        <AuthNotice tone="success">Your password was reset. Sign in with the new password.</AuthNotice>
      ) : surface === "token-required" ? (
        <AuthFeatureUnavailable
          title="Reset link required"
          description="Open a valid one-time recovery link to continue."
        />
      ) : (
        <form className="yt-auth-form" onSubmit={submit} noValidate>
          {serverError && <AuthNotice tone="error">{serverError}</AuthNotice>}
          <AuthField
            id="reset-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="Use at least 12 characters."
            error={errors.password?.message}
            {...register("password", {
              required: "Create a new password.",
              minLength: { value: 12, message: "Use at least 12 characters." },
              maxLength: { value: 256, message: "Use 256 characters or fewer." },
            })}
          />
          <AuthField
            id="reset-confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Confirm the new password.",
              validate: (value) => value === getValues("password") || "Passwords do not match.",
            })}
          />
          <AuthSubmitButton pending={isSubmitting}>Reset password</AuthSubmitButton>
        </form>
      )}

      <AuthActions>
        <span>Ready to return?</span>
        <Link href="/sign-in">Sign in</Link>
      </AuthActions>
    </AuthFrame>
  );
}
