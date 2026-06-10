import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawQuote } from "./types.js";

// ─── Mock all provider modules ────────────────────────────────────────────────
// These are hoisted by vitest before any imports are resolved, so the router
// picks up the mocked versions when it is imported below.

vi.mock("./providers/kraken.js", () => ({
  fetchKrakenQuotes: vi.fn(),
}));
vi.mock("./providers/coinbase.js", () => ({
  fetchCoinbaseQuotes: vi.fn(),
}));
vi.mock("./providers/coingecko.js", () => ({
  fetchCoinGeckoQuotes: vi.fn(),
}));
// Non-crypto providers — mocked to prevent accidental outbound calls.
vi.mock("./providers/yahoo.js", () => ({ fetchYahooQuotes: vi.fn() }));
vi.mock("./providers/polygon.js", () => ({ fetchPolygonQuotes: vi.fn() }));
vi.mock("./providers/alpaca.js", () => ({ fetchAlpacaQuotes: vi.fn() }));
vi.mock("./providers/fmp.js", () => ({ fetchFmpQuotes: vi.fn() }));

import { fetchKrakenQuotes } from "./providers/kraken.js";
import { fetchCoinbaseQuotes } from "./providers/coinbase.js";
import { fetchCoinGeckoQuotes } from "./providers/coingecko.js";
import { getQuotes } from "./router.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRawQuote(symbol: string): RawQuote {
  return {
    symbol,
    assetClass: "crypto",
    price: 50_000,
    change: 100,
    changePercent: 0.2,
    timestamp: new Date().toISOString(),
  };
}

function rawMap(...symbols: string[]): Map<string, RawQuote | Error> {
  return new Map(symbols.map((s) => [s, makeRawQuote(s)]));
}

function errorMap(...symbols: string[]): Map<string, RawQuote | Error> {
  return new Map(symbols.map((s) => [s, new Error(`${s}: provider error`)]));
}

function mixedMap(
  good: string[],
  bad: string[],
): Map<string, RawQuote | Error> {
  const m: Map<string, RawQuote | Error> = new Map();
  for (const s of good) m.set(s, makeRawQuote(s));
  for (const s of bad) m.set(s, new Error(`${s}: kraken_no_data`));
  return m;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("market router — crypto fallback chain", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("falls back to Coinbase when Kraken throws", async () => {
    // Kraken is the highest-priority crypto provider (priority 12).
    // When it throws entirely, the router must continue to Coinbase (priority 14).
    vi.mocked(fetchKrakenQuotes).mockRejectedValue(
      new Error("Kraken: connection refused"),
    );
    vi.mocked(fetchCoinbaseQuotes).mockResolvedValue(rawMap("BTC"));
    // CoinGecko should not be reached.
    vi.mocked(fetchCoinGeckoQuotes).mockResolvedValue(new Map());

    const quotes = await getQuotes(["BTC"]);

    expect(quotes).toHaveLength(1);
    const btc = quotes[0]!;
    expect(btc.symbol).toBe("BTC");
    expect(btc.provider).toBe("coinbase");
    expect(btc.isFallback).toBe(true);
    expect(btc.price).toBe(50_000);
    expect(btc.error).toBeNull();

    // Kraken was attempted, Coinbase was called as fallback.
    expect(vi.mocked(fetchKrakenQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinbaseQuotes)).toHaveBeenCalledOnce();
    // CoinGecko must not have been called — Coinbase resolved the symbol.
    expect(vi.mocked(fetchCoinGeckoQuotes)).not.toHaveBeenCalled();
  });

  it("falls back to CoinGecko when both Kraken and Coinbase are down", async () => {
    // Use ETH to avoid a cache hit from the BTC result stored by the previous test.
    vi.mocked(fetchKrakenQuotes).mockRejectedValue(
      new Error("Kraken: connection refused"),
    );
    vi.mocked(fetchCoinbaseQuotes).mockRejectedValue(
      new Error("Coinbase: 503 Service Unavailable"),
    );
    vi.mocked(fetchCoinGeckoQuotes).mockResolvedValue(rawMap("ETH"));

    const quotes = await getQuotes(["ETH"]);

    expect(quotes).toHaveLength(1);
    const eth = quotes[0]!;
    expect(eth.symbol).toBe("ETH");
    expect(eth.provider).toBe("coingecko");
    expect(eth.isFallback).toBe(true);
    expect(eth.price).toBe(50_000);
    expect(eth.error).toBeNull();

    // All three providers were attempted in priority order.
    expect(vi.mocked(fetchKrakenQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinbaseQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinGeckoQuotes)).toHaveBeenCalledOnce();
  });

  it("falls back to Coinbase when Kraken resolves but maps AVAX to a per-symbol Error", async () => {
    // Kraken succeeds at the network level but signals AVAX is unavailable via an
    // Error value in its result map (e.g. the pair is halted).
    // Use AVAX — a symbol not touched by prior tests — to avoid a stale cache hit.
    vi.mocked(fetchKrakenQuotes).mockResolvedValue(errorMap("AVAX"));
    vi.mocked(fetchCoinbaseQuotes).mockResolvedValue(rawMap("AVAX"));
    // CoinGecko should not be reached — Coinbase resolved the symbol.
    vi.mocked(fetchCoinGeckoQuotes).mockResolvedValue(new Map());

    const quotes = await getQuotes(["AVAX"]);

    expect(quotes).toHaveLength(1);
    const avax = quotes[0]!;
    expect(avax.symbol).toBe("AVAX");
    expect(avax.provider).toBe("coinbase");
    expect(avax.isFallback).toBe(true);
    expect(avax.price).toBe(50_000);
    expect(avax.error).toBeNull();

    expect(vi.mocked(fetchKrakenQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinbaseQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinGeckoQuotes)).not.toHaveBeenCalled();
  });

  it("serves XRP from Kraken and falls back to Coinbase for DOGE when Kraken returns a mixed result", async () => {
    // Kraken resolves successfully but returns a per-symbol Error for DOGE
    // (e.g. the pair is halted) while XRP has a valid quote.
    // XRP should be served directly from Kraken (isFallback: false).
    // DOGE should fall through to Coinbase (isFallback: true).
    // XRP and DOGE are unused by prior tests so there are no stale cache hits.
    vi.mocked(fetchKrakenQuotes).mockResolvedValue(
      mixedMap(["XRP"], ["DOGE"]),
    );
    vi.mocked(fetchCoinbaseQuotes).mockResolvedValue(rawMap("DOGE"));
    // CoinGecko must not be reached — Coinbase resolves the only remaining symbol.
    vi.mocked(fetchCoinGeckoQuotes).mockResolvedValue(new Map());

    const quotes = await getQuotes(["DOGE", "XRP"]);

    expect(quotes).toHaveLength(2);

    const xrp = quotes.find((q) => q.symbol === "XRP")!;
    expect(xrp).toBeDefined();
    expect(xrp.provider).toBe("kraken");
    expect(xrp.isFallback).toBe(false);
    expect(xrp.price).toBe(50_000);
    expect(xrp.error).toBeNull();

    const doge = quotes.find((q) => q.symbol === "DOGE")!;
    expect(doge).toBeDefined();
    expect(doge.provider).toBe("coinbase");
    expect(doge.isFallback).toBe(true);
    expect(doge.price).toBe(50_000);
    expect(doge.error).toBeNull();

    // Kraken was called once; Coinbase was called as fallback for DOGE only.
    expect(vi.mocked(fetchKrakenQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinbaseQuotes)).toHaveBeenCalledOnce();
    // CoinGecko must not have been called — DOGE was resolved by Coinbase.
    expect(vi.mocked(fetchCoinGeckoQuotes)).not.toHaveBeenCalled();
  });

  it("falls back to Coinbase when Kraken resolves with an empty Map for DOT", async () => {
    // Kraken succeeds at the network level but returns an empty Map — no entry
    // at all for DOT. The router must treat a missing entry the same as an Error
    // value and continue to the next provider rather than silently dropping the
    // symbol or returning an empty/zero quote.
    // DOT is unused by prior tests so there is no stale cache hit.
    vi.mocked(fetchKrakenQuotes).mockResolvedValue(new Map());
    vi.mocked(fetchCoinbaseQuotes).mockResolvedValue(rawMap("DOT"));
    // CoinGecko must not be reached — Coinbase resolved the symbol.
    vi.mocked(fetchCoinGeckoQuotes).mockResolvedValue(new Map());

    const quotes = await getQuotes(["DOT"]);

    expect(quotes).toHaveLength(1);
    const dot = quotes[0]!;
    expect(dot.symbol).toBe("DOT");
    expect(dot.provider).toBe("coinbase");
    expect(dot.isFallback).toBe(true);
    expect(dot.price).toBe(50_000);
    expect(dot.error).toBeNull();

    expect(vi.mocked(fetchKrakenQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinbaseQuotes)).toHaveBeenCalledOnce();
    // CoinGecko must not have been called — Coinbase resolved the symbol.
    expect(vi.mocked(fetchCoinGeckoQuotes)).not.toHaveBeenCalled();
  });

  it("returns an error quote when all three providers resolve with empty Maps for ADA", async () => {
    // Every provider resolves successfully at the network level but none includes
    // ADA in its result map. After exhausting all three providers the router must
    // produce an honest error quote (error !== null, price 0, provider "none")
    // rather than silently returning a zero/blank quote.
    // ADA is unused by prior tests so there is no stale cache hit.
    vi.mocked(fetchKrakenQuotes).mockResolvedValue(new Map());
    vi.mocked(fetchCoinbaseQuotes).mockResolvedValue(new Map());
    vi.mocked(fetchCoinGeckoQuotes).mockResolvedValue(new Map());

    const quotes = await getQuotes(["ADA"]);

    expect(quotes).toHaveLength(1);
    const ada = quotes[0]!;
    expect(ada.symbol).toBe("ADA");
    expect(ada.provider).toBe("none");
    expect(ada.price).toBe(0);
    expect(ada.error).not.toBeNull();

    // All three providers were tried in priority order.
    expect(vi.mocked(fetchKrakenQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinbaseQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinGeckoQuotes)).toHaveBeenCalledOnce();
  });

  it("falls back to CoinGecko when both Kraken and Coinbase return per-symbol errors for SOL", async () => {
    // Both primary providers resolve successfully but each maps SOL to an Error.
    // CoinGecko is the last-resort fallback and should serve the quote.
    vi.mocked(fetchKrakenQuotes).mockResolvedValue(errorMap("SOL"));
    vi.mocked(fetchCoinbaseQuotes).mockResolvedValue(errorMap("SOL"));
    vi.mocked(fetchCoinGeckoQuotes).mockResolvedValue(rawMap("SOL"));

    const quotes = await getQuotes(["SOL"]);

    expect(quotes).toHaveLength(1);
    const sol = quotes[0]!;
    expect(sol.symbol).toBe("SOL");
    expect(sol.provider).toBe("coingecko");
    expect(sol.isFallback).toBe(true);
    expect(sol.price).toBe(50_000);
    expect(sol.error).toBeNull();

    // All three providers were attempted in priority order.
    expect(vi.mocked(fetchKrakenQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinbaseQuotes)).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchCoinGeckoQuotes)).toHaveBeenCalledOnce();
  });
});
