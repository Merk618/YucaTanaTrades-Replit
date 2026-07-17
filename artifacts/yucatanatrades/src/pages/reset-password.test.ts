import { describe, expect, it } from "vitest";
import { resolveResetPasswordSurface } from "./reset-password-surface.ts";

describe("reset password completion surface", () => {
  it("keeps the success state visible after the consumed token is cleared", () => {
    expect(
      resolveResetPasswordSurface({
        enabled: true,
        completed: true,
        hasToken: false,
      }),
    ).toBe("completed");
  });

  it("requires a token before an incomplete reset can render its form", () => {
    expect(
      resolveResetPasswordSurface({
        enabled: true,
        completed: false,
        hasToken: false,
      }),
    ).toBe("token-required");
    expect(
      resolveResetPasswordSurface({
        enabled: true,
        completed: false,
        hasToken: true,
      }),
    ).toBe("form");
  });

  it("keeps a disabled recovery feature fail-closed", () => {
    expect(
      resolveResetPasswordSurface({
        enabled: false,
        completed: false,
        hasToken: true,
      }),
    ).toBe("unavailable");
  });
});
