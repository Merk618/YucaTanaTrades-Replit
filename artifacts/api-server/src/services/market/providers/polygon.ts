import type { RawQuote } from "../types";
import { classify } from "../instruments";

// ─── Polygon.io snapshot adapter ─────────────────────────────────────────────
// Requires POLYGON_API_KEY. Fetcher self-checks the env var so the router can
// fall through to the next provider (Yahoo) when the key is absent.
//
// Free Polygon tier → delayed/end-of-day data. Paid tiers → real-time.
// We label data as delayed (isDelayed flag on the descriptor) regardless of
// subscription tier to stay conservative.
//
// Equity/ETF endpoint: /v2/snapshot/locale/us/markets/stocks/tickers
// Crypto endpoint:     /v2/snapshot/locale/global/markets/crypto/tickers

const BASE = "https://api.polygon.io";
const UA = "YucaTanaTrades/1.0";

const CRYPTO_SYMBOLS = new Set(["BTC", "ETH", "SOL", "SUI", "ADA", "XRP", "DOGE", "AVAX", "DOT", "LINK"]);

function polygonCryptoTicker(symbol: string): string {
  return `X:${symbol}USD`;
}

interface PolygonStockSnapshot {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  day?: { c?: number; o?: number };
  lastTrade?: { p?: number; t?: number };
  prevDay?: { c?: number };
}

interface PolygonCryptoSnapshot {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  day?: { c?: number };
  lastTrade?: { p?: number; t?: number };
}

interface PolygonStockResponse  { tickers?: PolygonStockSnapshot[] }
interface PolygonCryptoResponse { tickers?: PolygonCryptoSnapshot[] }

function getKey(): string | undefined {
  const k = process.env.POLYGON_API_KEY;
  return typeof k === "string" && k.trim().length > 0 ? k.trim() : undefined;
}

async function fetchStockSnapshots(
  symbols: string[],
  apiKey: string,
  signal: AbortSignal,
): Promise<PolygonStockSnapshot[]> {
  const url = `${BASE}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${symbols.join(",")}&apiKey=${apiKey}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal });
  if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`polygon_http_${res.status}`);
  const json = (await res.json()) as PolygonStockResponse;
  return json.tickers ?? [];
}

async function fetchCryptoSnapshots(
  symbols: string[],
  apiKey: string,
  signal: AbortSignal,
): Promise<PolygonCryptoSnapshot[]> {
  const tickers = symbols.map(polygonCryptoTicker).join(",");
  const url = `${BASE}/v2/snapshot/locale/global/markets/crypto/tickers?tickers=${tickers}&apiKey=${apiKey}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal });
  if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`polygon_http_${res.status}`);
  const json = (await res.json()) as PolygonCryptoResponse;
  return json.tickers ?? [];
}

export async function fetchPolygonQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();
  const apiKey = getKey();
  if (!apiKey) {
    for (const s of symbols) out.set(s.toUpperCase(), new Error("polygon_missing_api_key"));
    return out;
  }

  const stockSymbols = symbols.filter((s) => !CRYPTO_SYMBOLS.has(s.toUpperCase()));
  const cryptoSymbols = symbols.filter((s) => CRYPTO_SYMBOLS.has(s.toUpperCase()));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [stockResults, cryptoResults] = await Promise.allSettled([
      stockSymbols.length ? fetchStockSnapshots(stockSymbols, apiKey, controller.signal) : Promise.resolve([]),
      cryptoSymbols.length ? fetchCryptoSnapshots(cryptoSymbols, apiKey, controller.signal) : Promise.resolve([]),
    ]);

    if (stockResults.status === "fulfilled") {
      for (const snap of stockResults.value) {
        const sym = snap.ticker.toUpperCase();
        const price = snap.lastTrade?.p ?? snap.day?.c;
        if (!price || !Number.isFinite(price) || price <= 0) {
          out.set(sym, new Error("polygon_no_price"));
          continue;
        }
        const ts = snap.lastTrade?.t
          ? new Date(snap.lastTrade.t / 1_000_000).toISOString()
          : undefined;
        const inst = classify(sym);
        out.set(sym, {
          symbol: inst.symbol,
          assetClass: inst.assetClass,
          price,
          change: snap.todaysChange ?? 0,
          changePercent: snap.todaysChangePerc ?? 0,
          timestamp: ts ?? null,
        });
      }
    } else {
      for (const s of stockSymbols) out.set(s.toUpperCase(), stockResults.reason instanceof Error ? stockResults.reason : new Error("polygon_stock_error"));
    }

    if (cryptoResults.status === "fulfilled") {
      for (const snap of cryptoResults.value) {
        const sym = snap.ticker.replace(/^X:/, "").replace("USD", "").toUpperCase();
        const price = snap.lastTrade?.p ?? snap.day?.c;
        if (!price || !Number.isFinite(price) || price <= 0) {
          out.set(sym, new Error("polygon_no_price"));
          continue;
        }
        const ts = snap.lastTrade?.t
          ? new Date(snap.lastTrade.t / 1_000_000).toISOString()
          : undefined;
        const inst = classify(sym);
        out.set(sym, {
          symbol: inst.symbol,
          assetClass: inst.assetClass,
          price,
          change: snap.todaysChange ?? 0,
          changePercent: snap.todaysChangePerc ?? 0,
          timestamp: ts ?? null,
        });
      }
    } else {
      for (const s of cryptoSymbols) out.set(s.toUpperCase(), cryptoResults.reason instanceof Error ? cryptoResults.reason : new Error("polygon_crypto_error"));
    }

    // Any symbols not resolved → error
    for (const s of symbols) {
      const upper = s.toUpperCase();
      if (!out.has(upper)) out.set(upper, new Error("polygon_no_data"));
    }
  } finally {
    clearTimeout(timer);
  }
  return out;
}

export async function polygonHealthProbe(timeoutMs = 6000): Promise<void> {
  const apiKey = getKey();
  if (!apiKey) throw new Error("polygon_missing_api_key");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${BASE}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=SPY&apiKey=${apiKey}`,
      { headers: { "User-Agent": UA }, signal: controller.signal },
    );
    if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
    if (res.status === 429) throw new Error("rate_limited");
    if (!res.ok) throw new Error(`polygon_http_${res.status}`);
    const json = (await res.json()) as PolygonStockResponse;
    if (!json.tickers?.length) throw new Error("polygon_no_data");
  } finally {
    clearTimeout(timer);
  }
}
