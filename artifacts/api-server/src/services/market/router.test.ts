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
