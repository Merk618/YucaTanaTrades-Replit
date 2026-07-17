import type { AuthErrorCode } from "./auth-contract";

export type AuthFlow = "sign-in" | "review-access" | "register" | "forgot" | "reset" | "verify" | "sign-out";

export function safeAuthErrorMessageForCode(
  code: AuthErrorCode | null,
  flow: AuthFlow,
): string {
  if (code === "rate_limited") {
    return "Too many attempts. Please wait before trying again.";
  }
  if (code === "csrf_invalid") {
    return "Your secure form context changed. Please try again.";
  }
  if (code === "unavailable") {
    return "Secure access is currently unavailable.";
  }

  switch (flow) {
    case "sign-in":
      return "Unable to sign in with those credentials.";
    case "review-access":
      return "That review code could not be accepted.";
    case "register":
      return "Unable to create the account with the submitted details.";
    case "forgot":
      return "The recovery request could not be accepted right now.";
    case "reset":
      return "The reset link is invalid, expired, or already used.";
    case "verify":
      return "The verification link is invalid, expired, or already used.";
    case "sign-out":
      return "The sign-out request could not be completed.";
  }
}
