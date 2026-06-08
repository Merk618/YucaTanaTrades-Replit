import type { AssetClass } from "./types";

// ─── Instrument catalog ──────────────────────────────────────────────────────
// Maps the symbols the terminal tracks to an asset class and any provider-
// specific identifiers (e.g. CoinGecko ids). Unknown symbols are classified by
// heuristic so the router can still route them.

export interface Instrument {
  symbol: string;
  assetClass: AssetClass;
  name: string;
  coingeckoId?: string;
}

export const INSTRUMENTS: Record<string, Instrument> = {
  SPY: { symbol: "SPY", assetClass: "etf", name: "SPDR S&P 500 ETF" },
  QQQ: { symbol: "QQQ", assetClass: "etf", name: "Invesco QQQ Trust" },
  IWM: { symbol: "IWM", assetClass: "etf", name: "iShares Russell 2000 ETF" },
  DIA: { symbol: "DIA", assetClass: "etf", name: "SPDR Dow Jones ETF" },
  NVDA: { symbol: "NVDA", assetClass: "equity", name: "NVIDIA Corp." },
  MSFT: { symbol: "MSFT", assetClass: "equity", name: "Microsoft Corp." },
  AVGO: { symbol: "AVGO", assetClass: "equity", name: "Broadcom Inc." },
  BTC: { symbol: "BTC", assetClass: "crypto", name: "Bitcoin", coingeckoId: "bitcoin" },
  ETH: { symbol: "ETH", assetClass: "crypto", name: "Ethereum", coingeckoId: "ethereum" },
  SOL: { symbol: "SOL", assetClass: "crypto", name: "Solana", coingeckoId: "solana" },
  SUI: { symbol: "SUI", assetClass: "crypto", name: "Sui", coingeckoId: "sui" },
};

const KNOWN_CRYPTO = new Set(["BTC", "ETH", "SOL", "SUI", "ADA", "XRP", "DOGE", "AVAX", "DOT", "MATIC", "LINK"]);

export function classify(symbol: string): Instrument {
  const upper = symbol.toUpperCase();
  const known = INSTRUMENTS[upper];
  if (known) return known;
  if (KNOWN_CRYPTO.has(upper)) {
    return { symbol: upper, assetClass: "crypto", name: upper };
  }
  return { symbol: upper, assetClass: "equity", name: upper };
}

// Default symbol sets used by the ticker rail and index overview.
export const DEFAULT_TICKER_SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA", "BTC", "ETH", "SOL", "SUI", "MSFT", "NVDA", "AVGO",
];
export const INDEX_SYMBOLS = ["SPY", "QQQ", "IWM", "DIA"];
