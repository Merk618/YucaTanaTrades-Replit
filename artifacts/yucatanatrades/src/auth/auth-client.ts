import {
  ApiError,
  customFetch,
} from "@workspace/api-client-react";
import type { z } from "zod";
import {
  authErrorSchema,
  authStatusSchema,
  genericActionResponseSchema,
  reviewAccessSessionEnvelopeSchema,
  sessionEnvelopeSchema,
  type AuthErrorBody,
  type AuthErrorCode,
  type AuthStatus,
  type CompleteEmailVerificationInput,
  type ForgotPasswordInput,
  type GenericActionResponse,
  type RegisterInput,
  type ReviewAccessInput,
  type ResetPasswordInput,
  type SessionEnvelope,
  type SignInInput,
} from "./auth-contract";

class AuthContractError extends Error {
  readonly name = "AuthContractError";

  constructor(path: string) {
    super(`Authentication service returned an invalid response for ${path}.`);
  }
}

async function request<TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
  init?: RequestInit,
): Promise<z.infer<TSchema>> {
  const data = await customFetch<unknown>(path, {
    ...init,
    responseType: "json",
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new AuthContractError(path);
  return parsed.data;
}

function jsonPost(body?: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

export const authClient = {
  getStatus(): Promise<AuthStatus> {
    return request("/api/auth/status", authStatusSchema);
  },

  getSession(): Promise<SessionEnvelope> {
    return request("/api/auth/session", sessionEnvelopeSchema);
  },

  signIn(input: SignInInput): Promise<SessionEnvelope> {
    return request("/api/auth/sign-in", sessionEnvelopeSchema, jsonPost(input));
  },

  reviewAccess(input: ReviewAccessInput): Promise<SessionEnvelope> {
    return request("/api/auth/review-access", reviewAccessSessionEnvelopeSchema, jsonPost(input));
  },

  register(input: RegisterInput): Promise<SessionEnvelope> {
    return request("/api/auth/register", sessionEnvelopeSchema, jsonPost(input));
  },

  signOut(): Promise<SessionEnvelope> {
    return request("/api/auth/sign-out", sessionEnvelopeSchema, jsonPost());
  },

  signOutAllDevices(): Promise<SessionEnvelope> {
    return request("/api/auth/sign-out-all", sessionEnvelopeSchema, jsonPost());
  },

  requestPasswordReset(input: ForgotPasswordInput): Promise<GenericActionResponse> {
    return request("/api/auth/password/forgot", genericActionResponseSchema, jsonPost(input));
  },

  completePasswordReset(input: ResetPasswordInput): Promise<GenericActionResponse> {
    return request("/api/auth/password/reset", genericActionResponseSchema, jsonPost(input));
  },

  requestEmailVerification(): Promise<GenericActionResponse> {
    return request("/api/auth/email-verification/request", genericActionResponseSchema, jsonPost());
  },

  completeEmailVerification(input: CompleteEmailVerificationInput): Promise<GenericActionResponse> {
    return request("/api/auth/email-verification/complete", genericActionResponseSchema, jsonPost(input));
  },
};

export function getAuthError(error: unknown): AuthErrorBody | null {
  if (!(error instanceof ApiError)) return null;
  const parsed = authErrorSchema.safeParse(error.data);
  return parsed.success ? parsed.data : null;
}

export function getAuthErrorCode(error: unknown): AuthErrorCode | null {
  return getAuthError(error)?.code ?? null;
}

export function isSessionInvalidation(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  return code === "session_expired" || code === "unauthorized";
}
