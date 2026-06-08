import {
  useGetMarketQuotes,
  useGetMarketSession,
  useGetSourceHealth,
  getGetMarketQuotesQueryKey,
  getGetMarketSessionQueryKey,
  getGetSourceHealthQueryKey,
  type Quote,
} from "@workspace/api-client-react";

// Symbols shown in the scrolling ticker tape.
export const TICKER_SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA",
  "BTC", "ETH", "SOL", "SUI",
  "MSFT", "NVDA", "AVGO",
] as const;

// Symbols shown in the Command Center "Index Overview" grid.
export const INDEX_SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA",
  "BTC", "ETH", "SOL", "SUI",
] as const;

export function useMarketQuotes(symbols: readonly string[], refetchMs = 60_000) {
  const params = { symbols: symbols.join(",") };
  return useGetMarketQuotes(params, {
    query: {
      queryKey: getGetMarketQuotesQueryKey(params),
      refetchInterval: refetchMs,
      staleTime: 30_000,
    },
  });
}

export function useMarketSession(refetchMs = 60_000) {
  return useGetMarketSession({
    query: {
      queryKey: getGetMarketSessionQueryKey(),
      refetchInterval: refetchMs,
      staleTime: 30_000,
    },
  });
}

export function useSourceHealth(refetchMs = 60_000) {
  return useGetSourceHealth({
    query: {
      queryKey: getGetSourceHealthQueryKey(),
      refetchInterval: refetchMs,
      staleTime: 30_000,
    },
  });
}

// Format a price honoring magnitude (sub-$10 instruments get 4 decimals).
export function formatPrice(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "—";
  const decimals = price < 10 ? 4 : 2;
  return price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// A quote is usable only when a real source returned a positive price.
export function isQuoteUsable(q: Quote | undefined): q is Quote {
  return !!q && !q.error && q.price > 0 && q.provider !== "none";
}

// Short trust badge derived from the quote's own source metadata.
export function quoteBadge(q: Quote): { text: string; tone: "live" | "delayed" | "ref" | "stale" } {
  if (q.isStale) return { text: "STALE", tone: "stale" };
  if (q.isLive) return { text: "LIVE", tone: "live" };
  if (q.isDelayed) return { text: "DELAYED", tone: "delayed" };
  return { text: "REFERENCE", tone: "ref" };
}

export type { Quote };
