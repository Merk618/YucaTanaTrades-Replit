import type { RawQuote } from "../types";
import { classify, INSTRUMENTS } from "../instruments";

// ─── CoinGecko crypto reference adapter ───────────────────────────────────────
// Free public simple-price endpoint (no key). Real reference prices for the
// crypto symbols the terminal tracks. Labeled "CoinGecko · Reference".

const BASE = "https://api.coingecko.com/api/v3/simple/price";

function coingeckoIdFor(symbol: string): string | null {
  const inst = INSTRUMENTS[symbol.toUpperCase()];
  return inst?.coingeckoId ?? null;
}

interface CoinGeckoPrice {
  usd?: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
  last_updated_at?: number; // unix seconds
}

export async function fetchCoinGeckoQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();

  const idBySymbol = new Map<string, string>();
  for (const s of symbols) {
    const id = coingeckoIdFor(s);
    if (id) idBySymbol.set(s.toUpperCase(), id);
    else out.set(s.toUpperCase(), new Error("coingecko_unknown_symbol"));
  }
  if (idBySymbol.size === 0) return out;

  const ids = [...new Set(idBySymbol.values())].join(",");
  const url = `${BASE}?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 429) {
      for (const sym of idBySymbol.keys()) out.set(sym, new Error("rate_limited"));
      return out;
    }
    if (!res.ok) {
      for (const sym of idBySymbol.keys()) out.set(sym, new Error(`coingecko_http_${res.status}`));
      return out;
    }
    const json = (await res.json()) as Record<string, CoinGeckoPrice>;
    for (const [sym, id] of idBySymbol.entries()) {
      const row = json[id];
      if (!row || typeof row.usd !== "number") {
        out.set(sym, new Error("coingecko_no_data"));
        continue;
      }
      const inst = classify(sym);
      const price = row.usd;
      const changePercent = row.usd_24h_change ?? 0;
      // CoinGecko gives 24h % change; derive absolute change from it.
      const change = (price * changePercent) / 100;
      const timestamp = row.last_updated_at
        ? new Date(row.last_updated_at * 1000).toISOString()
        : null;
      out.set(sym, {
        symbol: inst.symbol,
        assetClass: inst.assetClass,
        price,
        change,
        changePercent,
        timestamp,
        open:   null,
        high:   null,
        low:    null,
        volume: typeof row.usd_24h_vol === "number" ? row.usd_24h_vol : null,
      });
    }
  } catch (err) {
    for (const sym of idBySymbol.keys()) {
      out.set(sym, err instanceof Error ? err : new Error(String(err)));
    }
  } finally {
    clearTimeout(timer);
  }
  return out;
}

export async function coinGeckoHealthProbe(timeoutMs = 6000): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}?ids=bitcoin&vs_currencies=usd`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`coingecko_http_${res.status}`);
    const json = (await res.json()) as Record<string, CoinGeckoPrice>;
    if (typeof json.bitcoin?.usd !== "number") throw new Error("coingecko_no_data");
  } finally {
    clearTimeout(timer);
  }
}
