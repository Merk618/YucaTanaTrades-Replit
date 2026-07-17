export type ResetPasswordSurface = "unavailable" | "completed" | "token-required" | "form";

export function resolveResetPasswordSurface({
  enabled,
  completed,
  hasToken,
}: {
  enabled: boolean;
  completed: boolean;
  hasToken: boolean;
}): ResetPasswordSurface {
  if (!enabled) return "unavailable";
  if (completed) return "completed";
  if (!hasToken) return "token-required";
  return "form";
}
