export function shouldStartFailClosedAuthRevalidation(
  status: number,
  code: string | null,
  refreshInFlight: boolean,
  requestUrl: string,
): boolean {
  const requiresRevalidation =
    code === "session_expired" ||
    code === "unauthorized" ||
    code === "csrf_invalid" ||
    (status === 503 && code === "unavailable");
  if (!requiresRevalidation) return false;
  if (!refreshInFlight) return true;

  try {
    const pathname = new URL(requestUrl, "https://auth-observer.local").pathname;
    return pathname !== "/api/auth/status" && pathname !== "/api/auth/session";
  } catch {
    return true;
  }
}
