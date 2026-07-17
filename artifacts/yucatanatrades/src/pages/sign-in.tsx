import * as React from "react";
import { useForm } from "react-hook-form";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/auth/auth-provider";
import { isValidAuthEmailInput } from "@/auth/auth-contract";
import { safeAuthErrorMessage } from "@/auth/auth-error-copy";
import {
  authHrefWithReturnTo,
  returnToFromSearch,
} from "@/auth/return-to";
import { AuthField, AuthSubmitButton } from "@/components/auth/auth-field";
import { AuthActions, AuthFrame, AuthNotice } from "@/components/auth/auth-frame";
import { ReviewAccessEntry } from "@/components/auth/review-access";

interface SignInForm {
  email: string;
  password: string;
}

export default function SignInPage() {
  const { state, signIn, reviewAccess } = useAuth();
  const search = useSearch();
  const returnTo = returnToFromSearch(search);
  const params = new URLSearchParams(search);
  const expired = state.kind === "expired" || params.get("reason") === "expired";
  const features = state.kind === "guest" || state.kind === "expired" ? state.status.features : null;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInForm>();

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await signIn({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setServerError(safeAuthErrorMessage(error, "sign-in"));
    }
  });

  return (
    <AuthFrame
      eyebrow="YucaTanaTrades access"
      title="Sign in to Meridian OS"
      description="Your identity is resolved by the server before the approved intelligence workspace opens."
      notice={expired ? (
        <AuthNotice tone="warning">Your prior session expired. Sign in again to continue.</AuthNotice>
      ) : undefined}
    >
      <form className="yt-auth-form" onSubmit={submit} noValidate>
        {serverError && <AuthNotice tone="error">{serverError}</AuthNotice>}
        <AuthField
          id="sign-in-email"
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
          id="sign-in-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password", { required: "Enter your password." })}
        />
        <AuthSubmitButton pending={isSubmitting}>Open Meridian OS</AuthSubmitButton>
      </form>

      <AuthActions>
        {features?.passwordResetEnabled ? (
          <Link href={authHrefWithReturnTo("/forgot-password", returnTo)}>Forgot password?</Link>
        ) : <span>Password recovery unavailable</span>}
        {features?.registrationEnabled ? (
          <Link href={authHrefWithReturnTo("/register", returnTo)}>Create account</Link>
        ) : <span>Registration closed</span>}
      </AuthActions>

      <ReviewAccessEntry
        enabled={import.meta.env.DEV && features?.reviewAccessEnabled === true}
        onSubmit={reviewAccess}
      />
    </AuthFrame>
  );
}
