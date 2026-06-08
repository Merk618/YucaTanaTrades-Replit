import type { RawQuote } from "../types";
import { classify } from "../instruments";

// ─── Alpaca Markets data adapter ──────────────────────────────────────────────
// Requires ALPACA_API_KEY + ALPACA_API_SECRET. Fetcher self-checks env vars so
// the router falls through to Yahoo when credentials are absent.
//
// Uses the snapshot endpoint which returns latest + previous daily bars, giving
// accurate day-over-day change. IEX feed (free) → labeled delayed.
// Paid SIP feed → also labeled delayed for conservatism (SIP is official NBBO).
//
// Crypto endpoint uses the v1beta3 crypto bars.
// Trading is NEVER enabled — this adapter is read-only market data only.

const STOCK_BASE  = "https://data.alpaca.markets/v2/stocks";
const CRYPTO_BASE = "https://data.alpaca.markets/v1beta3/crypto/us";
const UA = "YucaTanaTrades/1.0";

const CRYPTO_SYMBOLS = new Set(["BTC", "ETH", "SOL", "SUI", "ADA", "XRP", "DOGE", "AVAX", "DOT", "LINK"]);

function getCredentials(): { key: string; secret: string } | null {
  const key    = process.env.ALPACA_API_KEY?.trim();
  const secret = process.env.ALPACA_API_SECRET?.trim();
  if (!key || !secret) return null;
  return { key, secret };
}

function authHeaders(creds: { key: string; secret: string }): Record<string, string> {
  return {
    "APCA-API-KEY-ID":     creds.key,
    "APCA-API-SECRET-KEY": creds.secret,
    "User-Agent":          UA,
  };
}

interface AlpacaBar  { o: number; h: number; l: number; c: number; t: string; v: number }
interface AlpacaSnap { latestBar: AlpacaBar; prevDailyBar: AlpacaBar }

interface AlpacaCryptoBar  { o: number; c: number; t: string }
interface AlpacaCryptoSnap { latestBar: AlpacaCryptoBar; prevDailyBar?: AlpacaCryptoBar }

export async function fetchAlpacaQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();
  const creds = getCredentials();
  if (!creds) {
    for (const s of symbols) out.set(s.toUpperCase(), new Error("alpaca_missing_credentials"));
    return out;
  }

  const stockSymbols  = symbols.filter((s) => !CRYPTO_SYMBOLS.has(s.toUpperCase()));
  const cryptoSymbols = symbols.filter((s) => CRYPTO_SYMBOLS.has(s.toUpperCase()));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = authHeaders(creds);

  try {
    await Promise.allSettled([
      (async () => {
        if (!stockSymbols.length) return;
        try {
          const url = `${STOCK_BASE}/snapshots?symbols=${stockSymbols.join(",")}&feed=iex&currency=USD`;
          const res = await fetch(url, { headers, signal: controller.signal });
          if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
          if (res.status === 429) throw new Error("rate_limited");
          if (!res.ok) throw new Error(`alpaca_http_${res.status}`);
          const json = (await res.json()) as Record<string, AlpacaSnap>;
          for (const [sym, snap] of Object.entries(json)) {
            const upper = sym.toUpperCase();
            if (!snap?.latestBar) { out.set(upper, new Error("alpaca_no_bar")); continue; }
            const price  = snap.latestBar.c;
            const prev   = snap.prevDailyBar?.c ?? snap.latestBar.o;
            const change = price - prev;
            const changePercent = prev > 0 ? (change / prev) * 100 : 0;
            const inst = classify(upper);
            out.set(upper, {
              symbol: inst.symbol,
              assetClass: inst.assetClass,
              price,
              change,
              changePercent,
              timestamp: snap.latestBar.t ?? null,
            });
          }
          for (const s of stockSymbols) {
            const upper = s.toUpperCase();
            if (!out.has(upper)) out.set(upper, new Error("alpaca_no_data"));
          }
        } catch (err) {
          for (const s of stockSymbols) out.set(s.toUpperCase(), err instanceof Error ? err : new Error(String(err)));
        }
      })(),
      (async () => {
        if (!cryptoSymbols.length) return;
        try {
          const pairs = cryptoSymbols.map((s) => `${s.toUpperCase()}/USD`).join(",");
          const url   = `${CRYPTO_BASE}/bars/latest?symbols=${encodeURIComponent(pairs)}&timeframe=1Day`;
          const res   = await fetch(url, { headers, signal: controller.signal });
          if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
          if (res.status === 429) throw new Error("rate_limited");
          if (!res.ok) throw new Error(`alpaca_http_${res.status}`);
          const json  = (await res.json()) as { bars?: Record<string, AlpacaCryptoBar[]> };
          for (const sym of cryptoSymbols) {
            const upper = sym.toUpperCase();
            const bars  = json.bars?.[`${upper}/USD`];
            if (!bars?.length) { out.set(upper, new Error("alpaca_no_crypto_bar")); continue; }
            const bar   = bars[bars.length - 1]!;
            const price = bar.c;
            const change = price - bar.o;
            const changePercent = bar.o > 0 ? (change / bar.o) * 100 : 0;
            const inst  = classify(upper);
            out.set(upper, {
              symbol: inst.symbol,
              assetClass: inst.assetClass,
              price,
              change,
              changePercent,
              timestamp: bar.t ?? null,
            });
          }
        } catch (err) {
          for (const s of cryptoSymbols) out.set(s.toUpperCase(), err instanceof Error ? err : new Error(String(err)));
        }
      })(),
    ]);
  } finally {
    clearTimeout(timer);
  }
  return out;
}

export async function alpacaHealthProbe(timeoutMs = 6000): Promise<void> {
  const creds = getCredentials();
  if (!creds) throw new Error("alpaca_missing_credentials");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${STOCK_BASE}/snapshots?symbols=SPY&feed=iex&currency=USD`,
      { headers: authHeaders(creds), signal: controller.signal },
    );
    if (res.status === 403 || res.status === 401) throw new Error("auth_failed");
    if (res.status === 429) throw new Error("rate_limited");
    if (!res.ok) throw new Error(`alpaca_http_${res.status}`);
    const json = (await res.json()) as Record<string, AlpacaSnap>;
    if (!json["SPY"]?.latestBar) throw new Error("alpaca_no_data");
  } finally {
    clearTimeout(timer);
  }
}
