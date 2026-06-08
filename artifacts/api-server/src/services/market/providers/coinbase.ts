import type { RawQuote } from "../types";
import { classify } from "../instruments";

// ─── Coinbase Exchange public stats adapter ───────────────────────────────────
// Uses the public Coinbase Exchange (formerly Pro) stats endpoint.
// No API key required. Returns near-real-time spot data for tracked crypto.
// Labeled "Live · Coinbase" because this is a real exchange feed.
//
// NOTE: This uses api.exchange.coinbase.com (old Pro API) which remains publicly
// accessible. Coinbase Advanced Trade API requires auth for all endpoints.

const BASE = "https://api.exchange.coinbase.com/products";
const UA = "YucaTanaTrades/1.0";

// Canonical symbol → Coinbase product ID.
const PRODUCT_MAP: Record<string, string> = {
  BTC:  "BTC-USD",
  ETH:  "ETH-USD",
  SOL:  "SOL-USD",
  SUI:  "SUI-USD",
  ADA:  "ADA-USD",
  XRP:  "XRP-USD",
  DOGE: "DOGE-USD",
  AVAX: "AVAX-USD",
  DOT:  "DOT-USD",
  LINK: "LINK-USD",
};

interface CoinbaseStats {
  open:   string;
  high:   string;
  low:    string;
  last:   string;
  volume: string;
}

async function fetchStats(
  productId: string,
  signal: AbortSignal,
): Promise<CoinbaseStats> {
  const res = await fetch(`${BASE}/${encodeURIComponent(productId)}/stats`, {
    headers: { "User-Agent": UA },
    signal,
  });
  if (res.status === 429) throw new Error("rate_limited");
  if (res.status === 404) throw new Error("coinbase_unknown_product");
  if (!res.ok) throw new Error(`coinbase_http_${res.status}`);
  return res.json() as Promise<CoinbaseStats>;
}

export async function fetchCoinbaseQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const productBySymbol = new Map<string, string>();
  for (const s of symbols) {
    const upper = s.toUpperCase();
    const pid = PRODUCT_MAP[upper];
    if (pid) productBySymbol.set(upper, pid);
    else out.set(upper, new Error("coinbase_unknown_symbol"));
  }

  try {
    await Promise.allSettled(
      [...productBySymbol.entries()].map(async ([sym, pid]) => {
        try {
          const stats = await fetchStats(pid, controller.signal);
          const price = parseFloat(stats.last);
          const open  = parseFloat(stats.open);
          if (!Number.isFinite(price) || price <= 0) {
            out.set(sym, new Error("coinbase_invalid_price"));
            return;
          }
          const change = price - open;
          const changePercent = open > 0 ? (change / open) * 100 : 0;
          const inst = classify(sym);
          out.set(sym, {
            symbol: inst.symbol,
            assetClass: inst.assetClass,
            price,
            change,
            changePercent,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          out.set(sym, err instanceof Error ? err : new Error(String(err)));
        }
      }),
    );
  } finally {
    clearTimeout(timer);
  }
  return out;
}

export async function coinbaseHealthProbe(timeoutMs = 6000): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const stats = await fetchStats("BTC-USD", controller.signal);
    if (!stats.last || parseFloat(stats.last) <= 0) throw new Error("coinbase_no_data");
  } finally {
    clearTimeout(timer);
  }
}
