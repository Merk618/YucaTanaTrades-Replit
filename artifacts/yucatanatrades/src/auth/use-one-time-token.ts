import * as React from "react";

export function tokenFromFragment(fragment: string, parameter = "token"): string {
  const value = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  return new URLSearchParams(value).get(parameter)?.trim() ?? "";
}

export function scrubOneTimeTokenFromUrl(
  href: string,
  parameter = "token",
): string {
  const url = new URL(href);
  const fragment = new URLSearchParams(
    url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
  );
  url.searchParams.delete(parameter);
  fragment.delete(parameter);
  const nextFragment = fragment.toString();
  url.hash = nextFragment ? `#${nextFragment}` : "";
  return `${url.pathname}${url.search}${url.hash}`;
}

export interface OneTimeTokenHandle {
  token: string;
  clearToken: () => void;
}

export function useOneTimeToken(parameter = "token"): OneTimeTokenHandle {
  const [token, setToken] = React.useState(() => {
    if (typeof window === "undefined") return "";
    return tokenFromFragment(window.location.hash, parameter);
  });

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const fragment = new URLSearchParams(url.hash.slice(1));
    const hasSensitiveParameter =
      url.searchParams.has(parameter) || fragment.has(parameter);
    if (!hasSensitiveParameter) return;

    window.history.replaceState(
      window.history.state,
      "",
      scrubOneTimeTokenFromUrl(url.href, parameter),
    );
  }, [parameter]);

  const clearToken = React.useCallback(() => setToken(""), []);
  return { token, clearToken };
}
