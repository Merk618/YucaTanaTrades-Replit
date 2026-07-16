import * as React from "react";
import { useForm } from "react-hook-form";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/auth/auth-provider";
import { isValidAuthEmailInput } from "@/auth/auth-contract";
import { safeAuthErrorMessage } from "@/auth/auth-error-copy";
import { authHrefWithReturnTo, returnToFromSearch } from "@/auth/return-to";
import { AuthField, AuthSubmitButton } from "@/components/auth/auth-field";
import { AuthActions, AuthFrame, AuthNotice } from "@/components/auth/auth-frame";
import { AuthFeatureUnavailable } from "@/components/auth/auth-status-surface";

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const { state, requestPasswordReset } = useAuth();
  const returnTo = returnToFromSearch(useSearch());
  const enabled = (state.kind === "guest" || state.kind === "expired") && state.status.features.passwordResetEnabled;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [accepted, setAccepted] = React.useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>();

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestPasswordReset({ email: values.email.trim() });
      setAccepted(true);
    } catch (error) {
      setServerError(safeAuthErrorMessage(error, "forgot"));
    }
  });

  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Request a password reset"
      description="Recovery responses never disclose whether an email belongs to an account."
    >
      {!enabled ? (
        <AuthFeatureUnavailable
          title="Password recovery is not configured"
          description="No recovery message has been sent. Contact the administrator for the current access path."
        />
      ) : accepted ? (
        <AuthNotice tone="success">
          If an eligible account matches that address, the recovery request has been accepted.
        </AuthNotice>
      ) : (
        <form className="yt-auth-form" onSubmit={submit} noValidate>
          {serverError && <AuthNotice tone="error">{serverError}</AuthNotice>}
          <AuthField
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            error={errors.email?.message}
            {...register("email", {
              required: "Enter your email address.",
              validate: (value) =>
                isValidAuthEmailInput(value) || "Enter a valid email address.",
            })}
          />
          <AuthSubmitButton pending={isSubmitting}>Request reset</AuthSubmitButton>
        </form>
      )}

      <AuthActions>
        <span>Return to secure access</span>
        <Link href={authHrefWithReturnTo("/sign-in", returnTo)}>Sign in</Link>
      </AuthActions>
    </AuthFrame>
  );
}
