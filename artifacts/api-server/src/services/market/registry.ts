import type { AssetClass, ProviderDescriptor } from "./types";

// ─── Provider registry ───────────────────────────────────────────────────────
// Central, declarative description of every market-data provider the terminal
// knows about. Two are implemented today against free, no-key public feeds
// (Yahoo delayed equities, CoinGecko crypto). The rest are future-ready: they
// declare their env-var requirements and capabilities so the architecture can
// be upgraded to keyed/live feeds without a rewrite. AI providers are
// analysis-only and must never serve prices.

export const PROVIDERS: ProviderDescriptor[] = [
  // ── Real, implemented, no key required ──────────────────────────────────────
  {
    id: "yahoo",
    name: "Yahoo Finance (Delayed)",
    assetClasses: ["equity", "etf"],
    capabilities: ["quotes"],
    envVars: [],
    requiresKey: false,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 20,
    liveCapable: false,
    implemented: true,
    sourceLabel: "Delayed · Yahoo",
    description:
      "Free public delayed (~15 min) equity & ETF quotes. Never labeled live.",
  },
  {
    id: "coingecko",
    name: "CoinGecko",
    assetClasses: ["crypto"],
    capabilities: ["quotes"],
    envVars: [],
    requiresKey: false,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 20,
    liveCapable: false,
    implemented: true,
    sourceLabel: "CoinGecko · Reference",
    description:
      "Free public crypto reference prices (BTC, ETH, SOL, SUI). Near real-time, labeled reference.",
  },

  // ── Trading-capable (read-only enforced), future-ready ──────────────────────
  {
    id: "moomoo",
    name: "MooMoo / OpenD",
    assetClasses: ["equity", "etf", "crypto"],
    capabilities: ["quotes", "trading"],
    envVars: ["MOOMOO_OPEND_HOST", "MOOMOO_OPEND_PORT"],
    requiresKey: false,
    requiresGateway: true,
    isTradingCapable: true,
    readOnly: true,
    priority: 5,
    liveCapable: true,
    implemented: false,
    sourceLabel: "Live · MooMoo",
    description:
      "Live quotes via a local OpenD gateway. Trading capable but locked READ-ONLY. Requires a reachable OpenD host (not available in cloud).",
  },
  {
    id: "alpaca",
    name: "Alpaca Markets",
    assetClasses: ["equity", "etf", "crypto"],
    capabilities: ["quotes", "trading"],
    envVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
    requiresKey: true,
    requiresGateway: false,
    isTradingCapable: true,
    readOnly: true,
    priority: 8,
    liveCapable: true,
    implemented: false,
    sourceLabel: "Live · Alpaca",
    description:
      "Live equity & crypto market data plus trading. Trading capable but locked READ-ONLY.",
  },

  // ── Keyed market-data providers, future-ready ───────────────────────────────
  {
    id: "polygon",
    name: "Polygon.io",
    assetClasses: ["equity", "etf", "crypto"],
    capabilities: ["quotes"],
    envVars: ["POLYGON_API_KEY"],
    requiresKey: true,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 10,
    liveCapable: true,
    implemented: false,
    sourceLabel: "Live · Polygon",
    description: "Live & historical equity/crypto market data (paid tiers).",
  },
  {
    id: "fmp",
    name: "Financial Modeling Prep",
    assetClasses: ["equity", "etf", "fundamentals"],
    capabilities: ["quotes", "fundamentals"],
    envVars: ["FMP_API_KEY"],
    requiresKey: true,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 15,
    liveCapable: false,
    implemented: false,
    sourceLabel: "FMP",
    description: "Quotes plus company fundamentals and financial statements.",
  },
  {
    id: "kraken",
    name: "Kraken",
    assetClasses: ["crypto"],
    capabilities: ["quotes"],
    envVars: [],
    requiresKey: false,
    requiresGateway: false,
    isTradingCapable: true,
    readOnly: true,
    priority: 12,
    liveCapable: true,
    implemented: false,
    sourceLabel: "Live · Kraken",
    description:
      "Public crypto ticker (no key for market data). Future-ready fallback for crypto.",
  },
  {
    id: "coinbase",
    name: "Coinbase",
    assetClasses: ["crypto"],
    capabilities: ["quotes"],
    envVars: [],
    requiresKey: false,
    requiresGateway: false,
    isTradingCapable: true,
    readOnly: true,
    priority: 14,
    liveCapable: true,
    implemented: false,
    sourceLabel: "Live · Coinbase",
    description:
      "Public crypto spot prices. Future-ready fallback for crypto.",
  },
  {
    id: "sec_edgar",
    name: "SEC EDGAR",
    assetClasses: ["fundamentals"],
    capabilities: ["filings", "fundamentals"],
    envVars: [],
    requiresKey: false,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 30,
    liveCapable: false,
    implemented: false,
    sourceLabel: "SEC EDGAR",
    description:
      "Official company filings & fundamentals. Never a price source.",
  },

  // ── AI providers — ANALYSIS ONLY, never a market-data source ─────────────────
  {
    id: "openai",
    name: "OpenAI",
    assetClasses: ["ai"],
    capabilities: ["analysis"],
    envVars: ["OPENAI_API_KEY"],
    requiresKey: true,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 100,
    liveCapable: false,
    implemented: false,
    sourceLabel: "AI · OpenAI",
    description: "Analysis & summarization only. Never used as a price source.",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    assetClasses: ["ai"],
    capabilities: ["analysis"],
    envVars: ["PERPLEXITY_API_KEY"],
    requiresKey: true,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 100,
    liveCapable: false,
    implemented: false,
    sourceLabel: "AI · Perplexity",
    description: "Research synthesis only. Never used as a price source.",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    assetClasses: ["ai"],
    capabilities: ["analysis"],
    envVars: ["DEEPSEEK_API_KEY"],
    requiresKey: true,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 100,
    liveCapable: false,
    implemented: false,
    sourceLabel: "AI · DeepSeek",
    description: "Analysis only. Never used as a price source.",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    assetClasses: ["ai"],
    capabilities: ["analysis"],
    envVars: ["GEMINI_API_KEY"],
    requiresKey: true,
    requiresGateway: false,
    isTradingCapable: false,
    readOnly: true,
    priority: 100,
    liveCapable: false,
    implemented: false,
    sourceLabel: "AI · Gemini",
    description: "Analysis only. Never used as a price source.",
  },
];

export function getProvider(id: string): ProviderDescriptor | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

// Implemented price providers for an asset class, highest priority first.
export function quoteProvidersFor(assetClass: AssetClass): ProviderDescriptor[] {
  return PROVIDERS.filter(
    (p) =>
      p.assetClasses.includes(assetClass) &&
      p.capabilities.includes("quotes"),
  ).sort((a, b) => a.priority - b.priority);
}
