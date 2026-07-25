import {
  defaultProtectedDestination,
  isProtectedRoutePath,
} from "../navigation/workspace-navigation.ts";

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return defaultProtectedDestination;
  }

  try {
    const parsed = new URL(value, "https://return.local");
    if (
      parsed.origin !== "https://return.local" ||
      !isProtectedRoutePath(parsed.pathname)
    ) {
      return defaultProtectedDestination;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultProtectedDestination;
  }
}

export function returnToFromSearch(search: string): string {
  return sanitizeReturnTo(new URLSearchParams(search).get("returnTo"));
}

export function signInHrefFor(location: string, expired = false): string {
  const returnTo = sanitizeReturnTo(location);
  const params = new URLSearchParams({ returnTo });
  if (expired) params.set("reason", "expired");
  return `/sign-in?${params.toString()}`;
}

export function protectedReturnDestination(
  pathname: string,
  search: string,
  hash: string,
): string {
  const normalizedSearch = search
    ? `?${search.startsWith("?") ? search.slice(1) : search}`
    : "";
  const normalizedHash = hash
    ? `#${hash.startsWith("#") ? hash.slice(1) : hash}`
    : "";
  return sanitizeReturnTo(`${pathname}${normalizedSearch}${normalizedHash}`);
}

export function authHrefWithReturnTo(path: string, returnTo: string): string {
  const safe = sanitizeReturnTo(returnTo);
  return `${path}?${new URLSearchParams({ returnTo: safe }).toString()}`;
}
