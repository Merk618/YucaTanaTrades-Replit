import type { Quote, RawQuote, AssetClass } from "./types";
import { classify } from "./instruments";
import { quoteProvidersFor, getProvider } from "./registry";
import { computeFreshness, computeConfidence } from "./freshness";
import { fetchYahooQuotes } from "./providers/yahoo";
import { fetchCoinGeckoQuotes } from "./providers/coingecko";
import { fetchKrakenQuotes } from "./providers/kraken";
import { fetchCoinbaseQuotes } from "./providers/coinbase";
import { fetchPolygonQuotes } from "./providers/polygon";
import { fetchAlpacaQuotes } from "./providers/alpaca";
import { fetchFmpQuotes } from "./providers/fmp";
import type { Logger } from "pino";

// ─── Data router ─────────────────────────────────────────────────────────────
// Classifies symbols by asset class, routes each class to the highest-priority
// implemented provider, then falls back sequentially if a provider fails.
// Never fabricates a price: if every provider fails, returns an honest error
// quote (price=0, provider="none", confidence=0).

type Fetcher = (symbols: string[]) => Promise<Map<string, RawQuote | Error>>;

const FETCHERS: Record<string, Fetcher> = {
  // Free, no-key public feeds (always available)
  yahoo:     (symbols) => fetchYahooQuotes(symbols),
  coingecko: (symbols) => fetchCoinGeckoQuotes(symbols),
  // Public exchange feeds — no key required, live exchange data
  kraken:    (symbols) => fetchKrakenQuotes(symbols),
  coinbase:  (symbols) => fetchCoinbaseQuotes(symbols),
  // Keyed providers — adapters self-check env vars and throw if unconfigured
  polygon:   (symbols) => fetchPolygonQuotes(symbols),
  alpaca:    (symbols) => fetchAlpacaQuotes(symbols),
  fmp:       (symbols) => fetchFmpQuotes(symbols),
};

function errorQuote(symbol: string, assetClass: AssetClass, message: string): Quote {
  return {
    symbol,
    assetClass,
    price: 0,
    change: 0,
    changePercent: 0,
    provider: "none",
    sourceLabel: "Unavailable",
    timestamp: new Date().toISOString(),
    isLive: false,
    isDelayed: false,
    isStale: false,
    isFallback: false,
    isDemo: false,
    marketSession: assetClass === "crypto" ? "24h" : "closed",
    confidence: 0,
    error: message,
  };
}

function enrich(
  raw: RawQuote,
  providerId: string,
  isFallback: boolean,
): Quote {
  const desc = getProvider(providerId);
  const { isStale, marketSession } = computeFreshness({
    assetClass: raw.assetClass,
    timestamp: raw.timestamp,
  });
  // isLive: provider is live-capable AND data is not inherently delayed.
  const isLive    = !!(desc?.liveCapable && !desc?.isDelayed);
  const isDelayed = desc?.isDelayed ?? false;
  const confidence = computeConfidence({
    implemented: desc?.implemented ?? false,
    isStale,
    isFallback,
    hasError: false,
  });
  return {
    symbol: raw.symbol,
    assetClass: raw.assetClass,
    price: raw.price,
    change: raw.change,
    changePercent: raw.changePercent,
    provider: providerId,
    sourceLabel: desc?.sourceLabel ?? providerId,
    timestamp: raw.timestamp ?? new Date().toISOString(),
    isLive,
    isDelayed,
    isStale,
    isFallback,
    isDemo: false,
    marketSession,
    confidence,
    error: null,
  };
}

async function routeAssetClass(
  assetClass: AssetClass,
  symbols: string[],
  log?: Logger,
): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  const remaining = new Set(symbols.map((s) => s.toUpperCase()));

  // Use all implemented providers that have a fetcher wired up.
  const providers = quoteProvidersFor(assetClass).filter(
    (p) => p.implemented && FETCHERS[p.id],
  );

  if (providers.length === 0) {
    for (const sym of remaining) {
      out.set(sym, errorQuote(sym, assetClass, "No data provider available for this asset class."));
    }
    return out;
  }

  for (let i = 0; i < providers.length && remaining.size > 0; i++) {
    const provider = providers[i]!;
    const isFallback = i > 0;
    const batch = [...remaining];
    let results: Map<string, RawQuote | Error>;
    try {
      results = await FETCHERS[provider.id]!(batch);
    } catch (err) {
      log?.warn({ provider: provider.id, err }, "Provider fetch threw");
      continue;
    }

    for (const sym of batch) {
      const r = results.get(sym);
      if (r && !(r instanceof Error)) {
        if (isFallback) {
          log?.info({ symbol: sym, provider: provider.id }, "Served via fallback provider");
        }
        out.set(sym, enrich(r, provider.id, isFallback));
        remaining.delete(sym);
      } else if (r instanceof Error) {
        log?.warn(
          { symbol: sym, provider: provider.id, err: r.message },
          "Provider returned error for symbol",
        );
      }
    }
  }

  // Any unresolved symbols → honest error quote.
  for (const sym of remaining) {
    out.set(sym, errorQuote(sym, assetClass, "All providers failed for this symbol."));
  }
  return out;
}

export async function getQuotes(symbols: string[], log?: Logger): Promise<Quote[]> {
  const byClass = new Map<AssetClass, string[]>();
  const orderKeys: string[] = [];
  for (const s of symbols) {
    const inst = classify(s);
    orderKeys.push(inst.symbol);
    const arr = byClass.get(inst.assetClass) ?? [];
    arr.push(inst.symbol);
    byClass.set(inst.assetClass, arr);
  }

  const merged = new Map<string, Quote>();
  await Promise.all(
    [...byClass.entries()].map(async ([assetClass, syms]) => {
      const res = await routeAssetClass(assetClass, syms, log);
      for (const [k, v] of res.entries()) merged.set(k, v);
    }),
  );

  // Preserve requested order, dedupe.
  const seen = new Set<string>();
  const ordered: Quote[] = [];
  for (const k of orderKeys) {
    if (seen.has(k)) continue;
    seen.add(k);
    const q = merged.get(k);
    if (q) ordered.push(q);
  }
  return ordered;
}
