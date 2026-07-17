import { describe, expect, it } from "vitest";
import {
  authFeaturesSchema,
  reviewAccessSessionEnvelopeSchema,
  sessionEnvelopeSchema,
} from "./auth-contract.ts";

const baseFeatures = {
  registrationEnabled: true,
  passwordResetEnabled: true,
  emailVerificationEnabled: true,
};

describe("Review Access frontend contract", () => {
  it("requires an explicit server status feature", () => {
    expect(authFeaturesSchema.safeParse(baseFeatures).success).toBe(false);
    expect(authFeaturesSchema.safeParse({
      ...baseFeatures,
      reviewAccessEnabled: false,
    }).success).toBe(true);
  });

  it("accepts a server-derived development review session envelope", () => {
    const parsed = sessionEnvelopeSchema.safeParse({
      state: "authenticated",
      sessionType: "development_review",
      user: {
        id: "9d6ba75b-6689-4c18-bc32-e5ee76d88502",
        email: "visual-review@localhost.invalid",
        displayName: "Visual Review",
        emailVerified: false,
      },
      expiresAt: "2026-07-16T12:00:00.000Z",
      csrfToken: "csrf-token-with-at-least-thirty-two-bytes",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sessionType).toBe("development_review");
      expect(reviewAccessSessionEnvelopeSchema.safeParse(parsed.data).success).toBe(true);
    }
  });

  it("does not accept a guest envelope as successful Review Access", () => {
    expect(reviewAccessSessionEnvelopeSchema.safeParse({
      state: "guest",
      sessionType: "guest",
      user: null,
      expiresAt: null,
      csrfToken: "csrf-token-with-at-least-thirty-two-bytes",
    }).success).toBe(false);
  });
});
