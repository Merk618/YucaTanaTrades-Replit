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

interface RegisterForm {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { state, register: registerAccount } = useAuth();
  const returnTo = returnToFromSearch(useSearch());
  const enabled = (state.kind === "guest" || state.kind === "expired") && state.status.features.registrationEnabled;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<RegisterForm>();

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const displayName = values.displayName.trim();
      await registerAccount({
        email: values.email.trim(),
        password: values.password,
        ...(displayName ? { displayName } : {}),
      });
    } catch (error) {
      setServerError(safeAuthErrorMessage(error, "register"));
    }
  });

  return (
    <AuthFrame
      eyebrow="YucaTanaTrades registration"
      title="Create secure access"
      description="Registration creates an account and rotates the guest context into a server-side Meridian OS session."
    >
      {!enabled ? (
        <AuthFeatureUnavailable
          title="Registration is not enabled"
          description="No account has been created. Use an existing account or return when registration is available."
        />
      ) : (
        <form className="yt-auth-form" onSubmit={submit} noValidate>
          {serverError && <AuthNotice tone="error">{serverError}</AuthNotice>}
          <AuthField
            id="register-name"
            label="Display name (optional)"
            autoComplete="name"
            maxLength={100}
            error={errors.displayName?.message}
            {...register("displayName", {
              validate: (value) => !value.trim() || value.trim().length <= 100 || "Use 100 characters or fewer.",
            })}
          />
          <AuthField
            id="register-email"
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
          <AuthField
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="Use at least 12 characters."
            error={errors.password?.message}
            {...register("password", {
              required: "Create a password.",
              minLength: { value: 12, message: "Use at least 12 characters." },
              maxLength: { value: 256, message: "Use 256 characters or fewer." },
            })}
          />
          <AuthField
            id="register-confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Confirm your password.",
              validate: (value) => value === getValues("password") || "Passwords do not match.",
            })}
          />
          <AuthSubmitButton pending={isSubmitting}>Create account</AuthSubmitButton>
        </form>
      )}

      <AuthActions>
        <span>Already have secure access?</span>
        <Link href={authHrefWithReturnTo("/sign-in", returnTo)}>Sign in</Link>
      </AuthActions>
    </AuthFrame>
  );
}
