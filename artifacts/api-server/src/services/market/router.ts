import type { Quote, RawQuote, AssetClass } from "./types";
import { classify } from "./instruments";
import { quoteProvidersFor, getProvider } from "./registry";
import { computeFreshness, computeConfidence } from "./freshness";
import { fetchYahooQuotes } from "./providers/yahoo";
import { fetchCoinGeckoQuotes } from "./providers/coingecko";
import type { Logger } from "pino";

// ─── Data router ─────────────────────────────────────────────────────────────
// Given symbols, classifies each, groups by asset class, and fetches from the
// highest-priority IMPLEMENTED provider for that class. Falls back to the next
// implemented provider on failure (labeling fallback use). Never fabricates a
// price: if every provider fails, returns an honest error quote (confidence 0).

type Fetcher = (symbols: string[]) => Promise<Map<string, RawQuote | Error>>;

const FETCHERS: Record<string, Fetcher> = {
  yahoo: (symbols) => fetchYahooQuotes(symbols),
  coingecko: (symbols) => fetchCoinGeckoQuotes(symbols),
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
  const isLive = desc?.liveCapable ?? false; // implemented free feeds are not live
  const isDelayed = providerId === "yahoo";
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
        log?.warn({ symbol: sym, provider: provider.id, err: r.message }, "Provider returned error for symbol");
      }
    }
  }

  // Anything still unresolved: honest error quote.
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
