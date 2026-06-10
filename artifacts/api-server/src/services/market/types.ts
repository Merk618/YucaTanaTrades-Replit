// ─── Market data trust architecture: shared server-side types ────────────────
// These describe providers, their health, and the metadata attached to every
// quote so the frontend can honestly label source + freshness. None of this is
// exposed directly to the client — the API contract (OpenAPI) defines the wire
// shape; these are internal.

export type AssetClass = "equity" | "etf" | "crypto" | "fundamentals" | "ai";

export type MarketSessionState = "open" | "pre" | "post" | "closed" | "holiday" | "24h";

export type ProviderCapability =
  | "quotes"
  | "fundamentals"
  | "news"
  | "filings"
  | "analysis"
  | "trading";

// Full status model for a provider, surfaced honestly in Settings.
export type ProviderStatusCode =
  | "connected" // health check passed, returning data
  | "delayed" // connected but data is delayed (e.g. Yahoo ~15min)
  | "read_only" // connected, trading-capable but locked read-only
  | "missing_api_key" // requires a key that is not configured
  | "auth_failed" // key present but rejected
  | "health_check_failed" // network/health check failed
  | "rate_limited" // provider returned 429 / throttle
  | "stale" // last data is past the freshness threshold
  | "not_connected" // requires unreachable infra (e.g. local OpenD gateway)
  | "disabled" // intentionally turned off
  | "future_ready"; // implemented as a stub, ready to wire when keys/infra exist

export interface ProviderDescriptor {
  id: string;
  name: string;
  assetClasses: AssetClass[];
  capabilities: ProviderCapability[];
  // Env vars required to activate this provider (never their values).
  envVars: string[];
  requiresKey: boolean;
  // Requires local/self-hosted infra unreachable from Replit cloud (OpenD).
  requiresGateway: boolean;
  // True if the provider can place trades — we still force read-only.
  isTradingCapable: boolean;
  readOnly: boolean;
  // Lower number = higher priority within an asset class.
  priority: number;
  // Can this source ever legitimately be labeled "LIVE"?
  liveCapable: boolean;
  // Is the data feed inherently delayed (regulatory or tier-based)?
  // true = show DELAYED badge; false = show LIVE or REFERENCE depending on liveCapable.
  isDelayed: boolean;
  // Is a real adapter implemented today (vs a future-ready stub)?
  implemented: boolean;
  // Human label shown next to prices, e.g. "Delayed · Yahoo".
  sourceLabel: string;
  description: string;
}

export interface ProviderHealth {
  id: string;
  name: string;
  status: ProviderStatusCode;
  assetClasses: AssetClass[];
  capabilities: ProviderCapability[];
  configured: boolean; // are required env vars / infra present?
  readOnly: boolean;
  isTradingCapable: boolean;
  liveCapable: boolean;
  envVars: string[];
  sourceLabel: string;
  message: string;
  lastCheckedAt: string; // ISO
  lastSuccessAt: string | null; // ISO
  latencyMs: number | null;
  detail: string | null;
}

// Normalized quote with full trust metadata.
export interface Quote {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  change: number;
  changePercent: number;
  provider: string; // provider id that served this quote
  sourceLabel: string;
  timestamp: string; // ISO of the data point
  isLive: boolean;
  isDelayed: boolean;
  isStale: boolean;
  isFallback: boolean;
  isDemo: boolean;
  marketSession: MarketSessionState;
  confidence: number; // 0..1
  error: string | null;
  // OHLC + volume — present when the upstream provider supplies them.
  // All null when the provider only returns a last-trade price.
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
}

// Raw result returned by a provider adapter before router-level enrichment.
export interface RawQuote {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  change: number;
  changePercent: number;
  // Data timestamp from the provider, ISO. Null = unknown.
  timestamp: string | null;
  // OHLC + volume — optional; providers set these when available.
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
}

export interface MarketSessionInfo {
  equities: {
    state: MarketSessionState;
    isOpen: boolean;
    label: string;
    nextChange: string | null; // ISO of next open/close transition
    timezone: string;
  };
  crypto: {
    state: MarketSessionState; // always "24h"
    isOpen: boolean;
    label: string;
  };
  asOf: string; // ISO
}
