import type { RawQuote } from "../types";
import { classify } from "../instruments";

// ─── Alpaca Markets data adapter ──────────────────────────────────────────────
// Licensed, keyed market data provider covering US equities, ETFs, and crypto.
// Equity/ETF data comes from the IEX feed (15 min delayed on free tier, live
// SIP data on paid plans). Crypto comes from Alpaca's crypto bars endpoint.
// Both are keyed — keys are NEVER sent to the frontend.
//
// This adapter is ONLY called when ALPACA_API_KEY + ALPACA_API_SECRET are set.
// The router checks `implemented` + presence of FETCHERS entry; the health probe
// validates the key by making a real network request.
//
// Trading is NEVER enabled — this adapter is read-only market data only.

const STOCK_BASE  = "https://data.alpaca.markets/v2/stocks";
const CRYPTO_BASE = "https://data.alpaca.markets/v1beta3/crypto/us";
const UA = "YucaTanaTrades/1.0";

function alpacaHeaders(): Record<string, string> {
  const key    = process.env.ALPACA_API_KEY?.trim();
  const secret = process.env.ALPACA_API_SECRET?.trim();
  if (!key || !secret) throw new Error("alpaca_not_configured");
  return {
    "APCA-API-KEY-ID":     key,
    "APCA-API-SECRET-KEY": secret,
    "User-Agent":          UA,
    "Accept":              "application/json",
  };
}

// ── Equity / ETF ─────────────────────────────────────────────────────────────
// Alpaca v2 stocks snapshot response:
//   GET /v2/stocks/snapshots?symbols=SPY → flat map { "SPY": AlpacaSnapshot }
// Some older SDK wrappers also wrap under a "snapshots" key; we accept both.

interface AlpacaSnapshot {
  latestTrade?: { t?: string; p?: number; x?: string };
  latestQuote?: { ap?: number; bp?: number };
  minuteBar?: { c?: number };
  dailyBar?: { o?: number; h?: number; l?: number; c?: number; vw?: number };
  prevDailyBar?: { c?: number };
}

// Normalise the raw JSON to a flat symbol→snapshot map regardless of wrapper.
function parseSnapshotResponse(
  raw: unknown,
): Record<string, AlpacaSnapshot> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    // Wrapped shape: { snapshots: { SPY: {...} } }
    if (
      obj["snapshots"] &&
      typeof obj["snapshots"] === "object" &&
      !Array.isArray(obj["snapshots"])
    ) {
      return obj["snapshots"] as Record<string, AlpacaSnapshot>;
    }
    // Flat shape: { SPY: {...} }
    return obj as Record<string, AlpacaSnapshot>;
  }
  return {};
}

// Prefer latestTrade price (most recent tick), fall back through quote mid,
// minute bar close, and finally daily bar close — all valid intraday prices.
function extractPrice(snap: AlpacaSnapshot): number | null {
  const trade = snap.latestTrade?.p;
  if (typeof trade === "number" && trade > 0) return trade;

  const ap = snap.latestQuote?.ap;
  const bp = snap.latestQuote?.bp;
  if (typeof ap === "number" && typeof bp === "number" && ap > 0 && bp > 0) {
    return (ap + bp) / 2;
  }

  const minClose = snap.minuteBar?.c;
  if (typeof minClose === "number" && minClose > 0) return minClose;

  const dayClose = snap.dailyBar?.c ?? snap.dailyBar?.vw;
  if (typeof dayClose === "number" && dayClose > 0) return dayClose;

  return null;
}

export async function fetchAlpacaEquityQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();
  if (symbols.length === 0) return out;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let headers: Record<string, string>;
    try { headers = alpacaHeaders(); }
    catch { for (const s of symbols) out.set(s.toUpperCase(), new Error("alpaca_not_configured")); return out; }

    const url = `${STOCK_BASE}/snapshots?symbols=${encodeURIComponent(symbols.join(","))}&feed=iex&currency=USD`;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (res.status === 401 || res.status === 403) { for (const s of symbols) out.set(s.toUpperCase(), new Error("alpaca_auth_failed")); return out; }
    if (res.status === 429)                        { for (const s of symbols) out.set(s.toUpperCase(), new Error("rate_limited")); return out; }
    if (!res.ok)                                   { for (const s of symbols) out.set(s.toUpperCase(), new Error(`alpaca_http_${res.status}`)); return out; }

    const json: unknown = await res.json();
    const snapshots = parseSnapshotResponse(json);

    for (const sym of symbols) {
      const upper = sym.toUpperCase();
      const snap = snapshots[upper];
      if (!snap) {
        out.set(upper, new Error("alpaca_no_data"));
        continue;
      }
      const price = extractPrice(snap);
      if (price === null) {
        out.set(upper, new Error("alpaca_no_price"));
        continue;
      }
      const prevClose = snap.prevDailyBar?.c ?? snap.dailyBar?.c ?? price;
      const change = price - prevClose;
      const changePercent = prevClose ? (change / prevClose) * 100 : 0;
      const inst = classify(upper);
      out.set(upper, {
        symbol: inst.symbol, assetClass: inst.assetClass,
        price, change, changePercent,
        timestamp: snap.latestTrade?.t ?? null,
      });
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

// ── Crypto ────────────────────────────────────────────────────────────────────
// Alpaca uses "BTC/USD" notation; we map to/from internal symbols.

function toAlpacaCryptoSymbol(symbol: string): string { return `${symbol.toUpperCase()}/USD`; }

interface AlpacaCryptoBar {
  t?: string;
  o?: number; h?: number; l?: number; c?: number;
  vw?: number; // VWAP
}

export async function fetchAlpacaCryptoQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  const out = new Map<string, RawQuote | Error>();
  if (symbols.length === 0) return out;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let headers: Record<string, string>;
    try { headers = alpacaHeaders(); }
    catch { for (const s of symbols) out.set(s.toUpperCase(), new Error("alpaca_not_configured")); return out; }

    const alpacaSyms = symbols.map(toAlpacaCryptoSymbol);
    const url = `${CRYPTO_BASE}/latest/bars?symbols=${encodeURIComponent(alpacaSyms.join(","))}`;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (res.status === 401 || res.status === 403) { for (const s of symbols) out.set(s.toUpperCase(), new Error("alpaca_auth_failed")); return out; }
    if (res.status === 429)                        { for (const s of symbols) out.set(s.toUpperCase(), new Error("rate_limited")); return out; }
    if (!res.ok)                                   { for (const s of symbols) out.set(s.toUpperCase(), new Error(`alpaca_http_${res.status}`)); return out; }

    const json = (await res.json()) as { bars?: Record<string, AlpacaCryptoBar> };
    const bars  = json.bars ?? {};
    for (const sym of symbols) {
      const upper     = sym.toUpperCase();
      const alpacaKey = toAlpacaCryptoSymbol(upper);
      const bar       = bars[alpacaKey];
      if (!bar || typeof bar.c !== "number") { out.set(upper, new Error("alpaca_no_data")); continue; }
      const price       = bar.vw ?? bar.c;
      const prevPrice   = bar.o ?? price;
      const change      = price - prevPrice;
      const changePercent = prevPrice ? (change / prevPrice) * 100 : 0;
      const inst = classify(upper);
      out.set(upper, {
        symbol: inst.symbol, assetClass: inst.assetClass,
        price, change, changePercent,
        timestamp: bar.t ?? null,
      });
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

// ── Unified fetcher (called by router) ────────────────────────────────────────
// The router separates by asset class before calling, but we also expose a
// unified entry point so the FETCHERS map stays clean (one key = one provider).

export async function fetchAlpacaQuotes(
  symbols: string[],
  timeoutMs = 8000,
): Promise<Map<string, RawQuote | Error>> {
  if (symbols.length === 0) return new Map();

  const equitySyms: string[] = [];
  const cryptoSyms: string[] = [];
  for (const s of symbols) {
    const inst = classify(s);
    if (inst.assetClass === "crypto") cryptoSyms.push(s);
    else equitySyms.push(s);
  }

  const [eqResult, crResult] = await Promise.all([
    equitySyms.length > 0 ? fetchAlpacaEquityQuotes(equitySyms, timeoutMs) : Promise.resolve(new Map<string, RawQuote | Error>()),
    cryptoSyms.length > 0 ? fetchAlpacaCryptoQuotes(cryptoSyms, timeoutMs) : Promise.resolve(new Map<string, RawQuote | Error>()),
  ]);

  const out = new Map<string, RawQuote | Error>();
  for (const [k, v] of eqResult) out.set(k, v);
  for (const [k, v] of crResult) out.set(k, v);
  return out;
}

// ── Health probe ──────────────────────────────────────────────────────────────
// Makes a real authenticated request (single well-known symbol). Throws on any
// failure so the health system can distinguish auth errors from network errors.

export async function alpacaHealthProbe(timeoutMs = 8000): Promise<void> {
  let headers: Record<string, string>;
  try { headers = alpacaHeaders(); }
  catch { throw new Error("alpaca_not_configured"); }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${STOCK_BASE}/snapshots?symbols=SPY&feed=iex&currency=USD`;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (res.status === 401 || res.status === 403) throw new Error("alpaca_auth_failed");
    if (res.status === 429) throw new Error("rate_limited");
    if (!res.ok) throw new Error(`alpaca_http_${res.status}`);
    const json: unknown = await res.json();
    const snapshots = parseSnapshotResponse(json);
    const spy = snapshots["SPY"];
    if (!spy || extractPrice(spy) === null) {
      throw new Error("alpaca_no_data");
    }
  } finally {
    clearTimeout(timer);
  }
}
