import type { RawQuote } from "../types";
import { classify } from "../instruments";

// ─── Financial Modeling Prep (FMP) quote adapter ─────────────────────────────
// Requires FMP_API_KEY. Fetcher self-checks the env var so the router falls
// through to Yahoo when the key is absent.
//
// FMP free tier → delayed/end-of-day data. Labeled delayed.
// Supports equities, ETFs, and fundamentals (fundamentals endpoints wired later).

const BASE = "https://financialmodelingprep.com/api/v3";
const UA   = "YucaTanaTrades/1.0";

function getKey(): string | undefined {
  const k = process.env.FMP_API_KEY?.trim();
  return k && k.length > 0 ? k : undefined;
}

interface FmpQuote {
  symbol:             string;
  price:              number;
  change:             number;
  changesPercentage:  number;
  timestamp:          number; // unix seconds
}

export async function fetchFmpQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();
  const apiKey = getKey();
  if (!apiKey) {
    for (const s of symbols) out.set(s.toUpperCase(), new Error("fmp_missing_api_key"));
    return out;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${BASE}/quote/${symbols.join(",")}?apikey=${apiKey}`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: controller.signal });
    if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
    if (res.status === 429) throw new Error("rate_limited");
    if (!res.ok) throw new Error(`fmp_http_${res.status}`);
    const json = (await res.json()) as FmpQuote[] | { "Error Message"?: string };

    if (!Array.isArray(json)) {
      const msg = (json as { "Error Message"?: string })["Error Message"] ?? "fmp_invalid_response";
      if (msg.toLowerCase().includes("limit") || msg.toLowerCase().includes("plan")) {
        throw new Error("auth_failed");
      }
      throw new Error(msg);
    }

    for (const q of json) {
      if (!q.symbol || !Number.isFinite(q.price) || q.price <= 0) continue;
      const sym  = q.symbol.toUpperCase();
      const inst = classify(sym);
      const ts   = q.timestamp ? new Date(q.timestamp * 1000).toISOString() : null;
      out.set(sym, {
        symbol: inst.symbol,
        assetClass: inst.assetClass,
        price: q.price,
        change: q.change ?? 0,
        changePercent: q.changesPercentage ?? 0,
        timestamp: ts,
      });
    }

    for (const s of symbols) {
      const upper = s.toUpperCase();
      if (!out.has(upper)) out.set(upper, new Error("fmp_no_data"));
    }
  } catch (err) {
    for (const s of symbols) {
      const upper = s.toUpperCase();
      if (!out.has(upper)) out.set(upper, err instanceof Error ? err : new Error(String(err)));
    }
  } finally {
    clearTimeout(timer);
  }
  return out;
}

export async function fmpHealthProbe(timeoutMs = 6000): Promise<void> {
  const apiKey = getKey();
  if (!apiKey) throw new Error("fmp_missing_api_key");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/quote/SPY?apikey=${apiKey}`, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
    });
    if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
    if (res.status === 429) throw new Error("rate_limited");
    if (!res.ok) throw new Error(`fmp_http_${res.status}`);
    const json = (await res.json()) as FmpQuote[] | { "Error Message"?: string };
    if (!Array.isArray(json) || !json.length || !json[0]?.price) {
      if (!Array.isArray(json)) throw new Error("auth_failed");
      throw new Error("fmp_no_data");
    }
  } finally {
    clearTimeout(timer);
  }
}
