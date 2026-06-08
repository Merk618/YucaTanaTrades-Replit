import type { RawQuote } from "../types";
import { classify } from "../instruments";

// ─── Kraken public ticker adapter ────────────────────────────────────────────
// Uses the public REST v0 API — no API key required.
// Returns near-real-time exchange data for tracked crypto symbols.
// Labeled "Live · Kraken" because this is a real exchange ticker, not delayed.

const BASE = "https://api.kraken.com/0/public/Ticker";
const UA = "YucaTanaTrades/1.0";

// Canonical symbol → Kraken pair name (as submitted to the API).
// Kraken may return a different key in the result (e.g. XXBTZUSD for XBTUSD).
const KRAKEN_PAIRS: Record<string, string> = {
  BTC:  "XBTUSD",
  ETH:  "ETHUSD",
  SOL:  "SOLUSD",
  SUI:  "SUIUSD",
  ADA:  "ADAUSD",
  XRP:  "XRPUSD",
  DOGE: "DOGEUSD",
  AVAX: "AVAXUSD",
  DOT:  "DOTUSD",
  LINK: "LINKUSD",
};

// Kraken prefixes legacy ISO-4217 assets with X and USD with Z in result keys.
// This helper tries the submitted pair name, the X/Z prefixed variant, and a
// few other common formats so we reliably find the response regardless of tier.
function findTicker(result: Record<string, KrakenTicker>, pair: string): KrakenTicker | undefined {
  if (result[pair]) return result[pair];
  const legacy = `X${pair.replace("USD", "ZUSD")}`;
  if (result[legacy]) return result[legacy];
  const xOnly = `X${pair}`;
  if (result[xOnly]) return result[xOnly];
  return undefined;
}

interface KrakenTicker {
  c: [string, string]; // [last trade closed price, lot volume]
  o: string;           // today's opening price
}

interface KrakenResponse {
  error: string[];
  result: Record<string, KrakenTicker>;
}

export async function fetchKrakenQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();

  // Map our canonical symbols to Kraken pairs; unknown ones get errors immediately.
  const pairBySymbol = new Map<string, string>();
  for (const s of symbols) {
    const upper = s.toUpperCase();
    const pair = KRAKEN_PAIRS[upper];
    if (pair) pairBySymbol.set(upper, pair);
    else out.set(upper, new Error("kraken_unknown_symbol"));
  }
  if (pairBySymbol.size === 0) return out;

  const pairs = [...pairBySymbol.values()].join(",");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}?pair=${encodeURIComponent(pairs)}`, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
    });
    if (res.status === 429) {
      for (const sym of pairBySymbol.keys()) out.set(sym, new Error("rate_limited"));
      return out;
    }
    if (!res.ok) {
      for (const sym of pairBySymbol.keys()) out.set(sym, new Error(`kraken_http_${res.status}`));
      return out;
    }
    const json = (await res.json()) as KrakenResponse;
    if (json.error?.length) {
      const msg = json.error[0] ?? "kraken_api_error";
      for (const sym of pairBySymbol.keys()) out.set(sym, new Error(msg));
      return out;
    }

    for (const [sym, pair] of pairBySymbol.entries()) {
      const ticker = findTicker(json.result, pair);
      if (!ticker) {
        out.set(sym, new Error("kraken_no_data"));
        continue;
      }
      const price = parseFloat(ticker.c[0]);
      const openPrice = parseFloat(ticker.o);
      if (!Number.isFinite(price) || price <= 0) {
        out.set(sym, new Error("kraken_invalid_price"));
        continue;
      }
      const change = price - openPrice;
      const changePercent = openPrice > 0 ? (change / openPrice) * 100 : 0;
      const inst = classify(sym);
      out.set(sym, {
        symbol: inst.symbol,
        assetClass: inst.assetClass,
        price,
        change,
        changePercent,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    for (const sym of pairBySymbol.keys()) {
      if (!out.has(sym)) {
        out.set(sym, err instanceof Error ? err : new Error(String(err)));
      }
    }
  } finally {
    clearTimeout(timer);
  }
  return out;
}

export async function krakenHealthProbe(timeoutMs = 6000): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}?pair=XBTUSD`, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
    });
    if (res.status === 429) throw new Error("rate_limited");
    if (!res.ok) throw new Error(`kraken_http_${res.status}`);
    const json = (await res.json()) as KrakenResponse;
    if (json.error?.length) throw new Error(json.error[0]);
    const ticker = findTicker(json.result, "XBTUSD");
    if (!ticker) throw new Error("kraken_no_data");
  } finally {
    clearTimeout(timer);
  }
}
