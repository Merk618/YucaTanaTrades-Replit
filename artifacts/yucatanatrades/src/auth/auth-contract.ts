import { z } from "zod";

export const authEmailInputSchema = z
  .string()
  .transform((value) => value.trim().normalize("NFKC"))
  .pipe(z.string().max(320).email());

export function isValidAuthEmailInput(value: string): boolean {
  return authEmailInputSchema.safeParse(value).success;
}

export const authFeaturesSchema = z.object({
  registrationEnabled: z.boolean(),
  passwordResetEnabled: z.boolean(),
  emailVerificationEnabled: z.boolean(),
  reviewAccessEnabled: z.boolean(),
});

export const authStatusSchema = z.object({
  available: z.boolean(),
  features: authFeaturesSchema,
  message: z.string().nullable(),
});

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  emailVerified: z.boolean(),
});

export const sessionEnvelopeSchema = z.object({
  state: z.enum(["guest", "authenticated", "expired"]),
  sessionType: z.enum(["guest", "user", "development_review"]),
  user: sessionUserSchema.nullable(),
  expiresAt: z.string().datetime().nullable(),
  csrfToken: z.string().min(32),
}).superRefine((value, context) => {
  if (value.state === "authenticated" && (!value.user || !value.expiresAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Authenticated sessions require a user and expiry.",
    });
  }

  if (value.state !== "authenticated" && value.user !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Guest and expired sessions cannot include a user.",
    });
  }
});

export const reviewAccessSessionEnvelopeSchema = sessionEnvelopeSchema.refine(
  (value) =>
    value.state === "authenticated" &&
    value.sessionType === "development_review",
  { message: "Review Access requires a development review session." },
);

export const genericActionResponseSchema = z.object({
  accepted: z.boolean(),
  message: z.string(),
});

export const authErrorCodeSchema = z.enum([
  "invalid_request",
  "invalid_credentials",
  "unauthorized",
  "csrf_invalid",
  "session_expired",
  "rate_limited",
  "unavailable",
]);

export const authErrorSchema = z.object({
  code: authErrorCodeSchema,
  message: z.string(),
});

export type AuthFeatures = z.infer<typeof authFeaturesSchema>;
export type AuthStatus = z.infer<typeof authStatusSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type SessionEnvelope = z.infer<typeof sessionEnvelopeSchema>;
export type GenericActionResponse = z.infer<typeof genericActionResponseSchema>;
export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;
export type AuthErrorBody = z.infer<typeof authErrorSchema>;

export interface SignInInput {
  email: string;
  password: string;
}

export interface ReviewAccessInput {
  code: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface CompleteEmailVerificationInput {
  token: string;
}
