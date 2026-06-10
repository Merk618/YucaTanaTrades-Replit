import type { RawQuote } from "../types";
import { classify } from "../instruments";

// ─── Yahoo Finance delayed-quote adapter ─────────────────────────────────────
// Uses the public chart endpoint (no key, no crumb required). Returns delayed
// (~15 min) equity/ETF quotes. These are NEVER labeled live by the router.

const BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const UA = "Mozilla/5.0 (compatible; YucaTanaTrades/1.0)";

interface YahooChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketTime?: number; // unix seconds
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
}

async function fetchOne(symbol: string, signal: AbortSignal): Promise<RawQuote> {
  const url = `${BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`yahoo_http_${res.status}`);
  const json = (await res.json()) as {
    chart?: { result?: Array<{ meta?: YahooChartMeta }>; error?: unknown };
  };
  const meta = json.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") {
    throw new Error("yahoo_no_data");
  }
  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;
  const timestamp = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : null;

  const inst = classify(symbol);
  return {
    symbol: inst.symbol,
    assetClass: inst.assetClass,
    price,
    change,
    changePercent,
    timestamp,
    open:   typeof meta.regularMarketOpen === "number" ? meta.regularMarketOpen : null,
    high:   typeof meta.regularMarketDayHigh === "number" ? meta.regularMarketDayHigh : null,
    low:    typeof meta.regularMarketDayLow === "number" ? meta.regularMarketDayLow : null,
    volume: typeof meta.regularMarketVolume === "number" ? meta.regularMarketVolume : null,
  };
}

export async function fetchYahooQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const results = await Promise.allSettled(
      symbols.map((s) => fetchOne(s, controller.signal)),
    );
    results.forEach((r, i) => {
      const sym = symbols[i]!.toUpperCase();
      if (r.status === "fulfilled") out.set(sym, r.value);
      else out.set(sym, r.reason instanceof Error ? r.reason : new Error(String(r.reason)));
    });
  } finally {
    clearTimeout(timer);
  }
  return out;
}

// Lightweight health probe — single well-known symbol.
export async function yahooHealthProbe(timeoutMs = 6000): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetchOne("SPY", controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
