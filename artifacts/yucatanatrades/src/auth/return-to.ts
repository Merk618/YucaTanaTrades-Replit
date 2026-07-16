const protectedPaths = [
  "/",
  "/markets",
  "/charts",
  "/portfolio",
  "/research",
  "/news",
  "/ai-lab",
  "/scanners",
  "/bots",
  "/journal",
  "/watchlist",
  "/risk",
  "/settings",
] as const;

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }

  try {
    const parsed = new URL(value, "https://return.local");
    if (parsed.origin !== "https://return.local" || !isProtectedPath(parsed.pathname)) {
      return "/";
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
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
