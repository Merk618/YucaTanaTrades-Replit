import {
  useGetMarketQuotes,
  useGetMarketSession,
  useGetSourceHealth,
  useTestQuoteFetch,
  getGetMarketQuotesQueryKey,
  getGetMarketSessionQueryKey,
  getGetSourceHealthQueryKey,
  getTestQuoteFetchQueryKey,
  type Quote,
} from "@workspace/api-client-react";

// Equity and crypto symbols shown in the scrolling ticker tape.
// Kept separate so each subset can poll at its own cadence.
export const EQUITY_TICKER_SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA", "MSFT", "NVDA", "AVGO",
] as const;
export const CRYPTO_TICKER_SYMBOLS = ["BTC", "ETH", "SOL", "SUI"] as const;

// Full ordered list (equities first, then crypto) — used for display ordering.
export const TICKER_SYMBOLS = [
  ...EQUITY_TICKER_SYMBOLS,
  ...CRYPTO_TICKER_SYMBOLS,
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
      enabled: symbols.length > 0,
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

/**
 * Ticker-tape aware quotes hook — 3-state cadence:
 *   equities open          → 30 s  for both equities and crypto
 *   equities closed + crypto open → 5 min for equities, 60 s for crypto
 *   both closed            → 5 min for both
 *
 * Session is polled every 2 minutes so cadence transitions happen within 2
 * minutes of an actual market open/close event.
 */
export function useTickerQuotes() {
  const { data: session } = useMarketSession(2 * 60_000);
  const equitiesOpen = session?.equities?.isOpen ?? false;
  // Crypto markets are 24/7; default to open when session hasn't loaded yet.
  const cryptoOpen = session?.crypto?.isOpen ?? true;

  const equityRefetchMs = equitiesOpen ? 30_000 : 5 * 60_000;
  const cryptoRefetchMs = equitiesOpen ? 30_000 : cryptoOpen ? 60_000 : 5 * 60_000;

  const equityResult = useMarketQuotes(EQUITY_TICKER_SYMBOLS, equityRefetchMs);
  const cryptoResult = useMarketQuotes(CRYPTO_TICKER_SYMBOLS, cryptoRefetchMs);

  return {
    quotes: [
      ...(equityResult.data?.quotes ?? []),
      ...(cryptoResult.data?.quotes ?? []),
    ],
    isError: equityResult.isError && cryptoResult.isError,
    equitiesOpen,
  };
}

export function useSourceHealth(refetchMs = 60_000) {
  return useGetSourceHealth(undefined, {
    query: {
      queryKey: getGetSourceHealthQueryKey(),
      refetchInterval: refetchMs,
      staleTime: 30_000,
    },
  });
}

// Forced probe (refresh=true) that bypasses the server-side health cache.
// Manual-only — call refetch() on the "Re-check" action so we don't hammer
// upstream providers on every auto-refresh tick.
export function useForceSourceHealth() {
  const params = { refresh: true };
  return useGetSourceHealth(params, {
    query: {
      queryKey: getGetSourceHealthQueryKey(params),
      enabled: false,
      gcTime: 0,
    },
  });
}

// On-demand probe of all active sources across SPY/QQQ/NVDA/MSFT + BTC/ETH/SOL/SUI. Disabled until triggered.
export function useTestQuotes() {
  return useTestQuoteFetch({
    query: {
      queryKey: getTestQuoteFetchQueryKey(),
      enabled: false,
      gcTime: 0,
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
// For live quotes the sourceLabel already encodes the provider name
// (e.g. "Live · Kraken", "Live · Coinbase"), so we use it verbatim.
export function quoteBadge(q: Quote): { text: string; tone: "live" | "delayed" | "ref" | "stale" } {
  if (q.isStale) return { text: "STALE", tone: "stale" };
  if (q.isLive) return { text: q.sourceLabel, tone: "live" };
  if (q.isDelayed) return { text: q.sourceLabel, tone: "delayed" };
  return { text: q.sourceLabel || "REFERENCE", tone: "ref" };
}

// Human-readable freshness, e.g. "12s ago" / "3m ago".
export function freshnessLabel(iso: string | undefined): string {
  if (!iso) return "unknown";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "unknown";
  const s = Math.round(diff / 1000);
  if (s < 60) return `${Math.max(s, 0)}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

// Tooltip text exposing the quote's real provenance: source, freshness, trust.
export function quoteTooltip(q: Quote): string {
  const badge = quoteBadge(q).text;
  const parts = [
    `${q.symbol} · ${q.sourceLabel}`,
    `Source: ${q.provider}`,
    `As of: ${freshnessLabel(q.timestamp)}`,
    `Status: ${badge}`,
  ];
  if (q.isFallback) parts.push("Fallback source in use");
  if (q.isStale) parts.push("Data may be outdated");
  return parts.join("\n");
}

export type { Quote };
