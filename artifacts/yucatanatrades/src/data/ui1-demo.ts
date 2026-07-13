import type {
  ChartPoint,
  DashboardSnapshot,
  DataProvenance,
  DataTruthState,
} from "@/contracts/dashboard";

const GENERATED_AT = "2026-07-11T20:56:27.000Z";
const MARKET_AT = "2026-07-10T21:00:00.000Z";

export function createDemoProvenance(marketAt = MARKET_AT): DataProvenance {
  return {
    state: "demo",
    provider: "UI-1 deterministic fixture",
    sourceType: "fixture",
    generatedAt: GENERATED_AT,
    marketAt,
    freshness: "unknown",
    cacheState: "none",
  };
}

export function createHistoricalDemoProvenance(): DataProvenance {
  return {
    ...createDemoProvenance(),
    state: "historical",
    provider: "UI-1 fixed historical fixture",
  };
}

export function createAiGeneratedDemoProvenance(): DataProvenance {
  return {
    ...createDemoProvenance(),
    state: "ai-generated",
    provider: "Static AI sample · no model call",
    sourceType: "ai",
  };
}

export function createUnavailableProvenance(
  code: string,
  message: string,
  state: DataTruthState = "unavailable",
): DataProvenance {
  return {
    state,
    provider: "Not configured",
    sourceType: "provider",
    generatedAt: GENERATED_AT,
    freshness: "unknown",
    cacheState: "none",
    error: {
      code,
      message,
      retryable: false,
    },
  };
}

function chartPoints(length = 58): ChartPoint[] {
  let previous = 5208.2;
  return Array.from({ length }, (_, index) => {
    const drift = index * 1.35;
    const wave = Math.sin(index * 0.63 + 0.2) * 9.4 + Math.sin(index * 0.18) * 14;
    const close = 5208 + drift + wave;
    const open = previous + Math.sin(index * 1.17) * 2.8;
    const high = Math.max(open, close) + 3.2 + Math.abs(Math.sin(index * 0.91)) * 5.8;
    const low = Math.min(open, close) - 3.1 - Math.abs(Math.cos(index * 0.77)) * 5.1;
    previous = close;
    const minutesFromOpen = Math.round(index * 390 / Math.max(1, length - 1));
    const totalMinutes = 9 * 60 + 30 + minutesFromOpen;
    const hour24 = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
    const label = `${hour12}:${minute.toString().padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
    return {
      timestamp: `2026-07-10T${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00-04:00`,
      label,
      open,
      high,
      low,
      close,
      volume: 32 + Math.abs(Math.sin(index * 0.43 + 0.2)) * 76 + (index % 11 === 0 ? 42 : 0),
    };
  });
}

const marketSession = {
  provenance: createDemoProvenance(),
  dataState: "demo" as const,
  statusMessage: "Weekend state shown by the deterministic UI-1 adapter.",
  session: "closed" as const,
  label: "Market closed · Demo",
  exchangeTimezone: "America/New_York",
};

export const dashboardDemo: DashboardSnapshot = {
  id: "ui1-dashboard-demo-v1",
  generatedAt: GENERATED_AT,
  marketSession,
  marketStrip: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Fixed values; no streaming or provider request.",
    session: marketSession,
    items: [
      {
        id: "spx",
        symbol: "SPX",
        label: "S&P 500",
        displayValue: "5,278.40",
        changePercent: 0.82,
        direction: "up",
        sparkline: [34, 36, 35, 39, 41, 39, 43, 44, 42, 46, 45, 48, 46, 49, 51, 50, 54, 53],
      },
      {
        id: "ndx",
        symbol: "NDX",
        label: "NASDAQ 100",
        displayValue: "18,275.41",
        changePercent: 0.91,
        direction: "up",
        sparkline: [28, 29, 31, 30, 34, 33, 36, 35, 39, 38, 42, 41, 44, 43, 46, 45, 48, 49],
      },
      {
        id: "dji",
        symbol: "DJI",
        label: "DOW",
        displayValue: "38,886.27",
        changePercent: 0.3,
        direction: "up",
        sparkline: [40, 44, 42, 49, 46, 45, 43, 47, 46, 50, 51, 49, 54, 53, 56, 54, 58, 57],
      },
      {
        id: "vix",
        symbol: "VIX",
        label: "VIX",
        displayValue: "12.45",
        changePercent: -1.85,
        direction: "down",
        sparkline: [54, 50, 52, 46, 49, 44, 47, 43, 45, 42, 44, 41, 43, 40, 42, 39, 41, 40],
      },
      {
        id: "us10y",
        symbol: "US10Y",
        label: "10Y YIELD",
        displayValue: "4.283%",
        changePercent: -0.01,
        direction: "down",
        sparkline: [49, 48, 46, 47, 44, 42, 43, 45, 44, 48, 50, 47, 51, 49, 52, 50, 53, 51],
      },
    ],
  },
  briefing: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Static UI copy; not investment guidance.",
    greeting: "Good morning, Trader.",
    title: "Here’s what matters today",
    summary: "Large-cap technology leads the fixed demonstration snapshot while volatility stays contained. Review concentration before acting.",
    actionLabel: "See market brief",
    metrics: [
      { label: "Market regime", value: "Expansion", tone: "positive" },
      { label: "Risk environment", value: "Moderate", tone: "caution" },
      { label: "Opportunity score", value: "72 / 100", tone: "positive" },
    ],
  },
  aiInsight: {
    provenance: createAiGeneratedDemoProvenance(),
    dataState: "ai-generated",
    statusMessage: "Static sample generated for visual review; no AI request was made.",
    title: "AI Insight",
    summary: "Momentum in the fixed large-cap technology sample remains constructive. Review NVDA and TSLA levels for visual context only.",
    generatedLabel: "AI-generated sample · Demo",
    relatedSymbols: ["NVDA", "TSLA"],
    actionLabel: "View insight sample",
  },
  portfolio: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Deterministic fixture; not an account balance.",
    currency: "USD",
    totalValue: 124680.35,
    dayChange: 1258.49,
    dayChangePercent: 1.02,
    unrealizedPnl: 3347.21,
    buyingPower: 123190.21,
    cashBalance: 12430.56,
    positionsCount: 12,
    sparkline: [32, 34, 33, 37, 36, 41, 39, 43, 45, 44, 48, 47, 52, 51, 55, 54, 58, 57],
  },
  opportunities: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Static ranked examples without confidence claims.",
    items: [
      { rank: 1, symbol: "NVDA", company: "NVIDIA Corporation", changePercent: 1.62, direction: "up", sparkline: [31, 33, 32, 36, 35, 39, 38, 42] },
      { rank: 2, symbol: "TSLA", company: "Tesla, Inc.", changePercent: 1.37, direction: "up", sparkline: [29, 28, 31, 30, 35, 33, 37, 38] },
      { rank: 3, symbol: "AMD", company: "Advanced Micro Devices", changePercent: 1.16, direction: "up", sparkline: [30, 32, 31, 33, 35, 34, 38, 37] },
    ],
  },
  calendar: {
    provenance: createUnavailableProvenance("CALENDAR_NOT_CONFIGURED", "Calendar provider integration is deferred until after UI approval."),
    dataState: "unavailable",
    statusMessage: "Calendar provider unavailable.",
    dateLabel: "Today",
    events: [],
  },
  chart: {
    provenance: createHistoricalDemoProvenance(),
    dataState: "historical",
    statusMessage: "Fixed historical demonstration series; no streaming.",
    symbol: "SPX",
    name: "S&P 500 Index",
    currency: "USD",
    seriesKind: "candlestick",
    timeframe: "1D",
    intervalLabel: "5 minute",
    availableTimeframes: ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"],
    latestValue: 5278.4,
    displayValue: "5,278.40",
    change: 42.86,
    changePercent: 0.82,
    direction: "up",
    isStatic: true,
    points: chartPoints(),
    capabilities: {
      indicators: true,
      compare: true,
      templates: false,
      expand: true,
      capture: false,
    },
  },
  fearGreed: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Fixed sentiment sample.",
    value: 62,
    label: "Greed",
    dayChange: 6,
  },
  risk: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Derived from fixed UI-1 fixtures.",
    metrics: [
      { label: "Volatility", value: "Moderate", tone: "moderate" },
      { label: "Market risk", value: "Moderate", tone: "moderate" },
      { label: "Correlation", value: "Low", tone: "low" },
      { label: "Liquidity", value: "High", tone: "low" },
    ],
  },
  breadth: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Fixed breadth distribution.",
    advancingPercent: 62,
    decliningPercent: 28,
    unchangedPercent: 10,
  },
  heatmap: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Fixed sector changes.",
    cells: [
      { id: "technology", sector: "TECH", changePercent: 1.28, weight: 1.4 },
      { id: "communication", sector: "COMM", changePercent: 0.97, weight: 1.1 },
      { id: "health", sector: "HEALTH", changePercent: 0.85, weight: 1.15 },
      { id: "financial", sector: "FINANCIAL", changePercent: 0.61, weight: 1.05 },
      { id: "industrials", sector: "INDUSTRIALS", changePercent: 0.41, weight: 1.1 },
      { id: "consumer", sector: "CONS. DISC.", changePercent: -0.27, weight: 0.95 },
      { id: "energy", sector: "ENERGY", changePercent: -0.71, weight: 0.8 },
      { id: "utilities", sector: "UTILITIES", changePercent: -0.4, weight: 0.8 },
      { id: "real-estate", sector: "REAL EST.", changePercent: 0.12, weight: 0.9 },
    ],
  },
  watchlist: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Fixed watchlist fixture.",
    items: [
      { id: "aapl", symbol: "AAPL", company: "Apple Inc.", displayPrice: "196.42", changePercent: 1.35, direction: "up" },
      { id: "msft", symbol: "MSFT", company: "Microsoft Corp.", displayPrice: "415.30", changePercent: 0.81, direction: "up" },
      { id: "amzn", symbol: "AMZN", company: "Amazon.com, Inc.", displayPrice: "184.34", changePercent: 1.21, direction: "up" },
      { id: "tsla", symbol: "TSLA", company: "Tesla, Inc.", displayPrice: "173.91", changePercent: -0.28, direction: "down" },
    ],
  },
  news: {
    provenance: createUnavailableProvenance("NEWS_NOT_CONFIGURED", "News provider integration is deferred until after UI approval."),
    dataState: "unavailable",
    statusMessage: "News intelligence unavailable.",
    items: [],
  },
  providers: [
    {
      provenance: createUnavailableProvenance("MARKET_PROVIDER_DEFERRED", "Market providers are not connected during UI-1."),
      dataState: "unavailable",
      statusMessage: "Deferred until visual approval.",
      providerId: "market-data",
      label: "Market data",
      capabilities: [
        { capability: "quotes", state: "deferred", label: "Deferred" },
        { capability: "historical", state: "deferred", label: "Deferred" },
      ],
    },
    {
      provenance: createUnavailableProvenance("AI_PROVIDER_NOT_CONFIGURED", "No AI provider is configured during UI-1."),
      dataState: "unavailable",
      statusMessage: "No model calls.",
      providerId: "ai",
      label: "AI provider",
      capabilities: [
        { capability: "briefing", state: "not-configured", label: "Not configured" },
      ],
    },
  ],
  system: {
    provenance: createDemoProvenance(),
    dataState: "demo",
    statusMessage: "Local UI preview state only; not production health.",
    label: "UI preview",
    checks: [
      { id: "shell", label: "Visual shell", state: "available" },
      { id: "integrations", label: "Live integrations", state: "deferred" },
      { id: "account", label: "Account session", state: "unavailable" },
    ],
  },
};
