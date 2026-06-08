import type { AssetClass, MarketSessionState } from "./types";
import { getEquitySession } from "./session";

// ─── Freshness policy ────────────────────────────────────────────────────────
// Centralizes how old a data point may be before it's considered stale, per
// asset class. Equity staleness is session-aware: during regular hours a
// delayed feed should refresh within ~20 min; when the market is closed the
// last close is the freshest legitimate value and is NOT stale.

// Max acceptable data age in seconds before "stale".
const STALE_THRESHOLD_SECONDS: Record<AssetClass, number> = {
  crypto: 120, // CoinGecko free updates ~1-2 min
  equity: 20 * 60, // delayed ~15 min + slack during open
  etf: 20 * 60,
  fundamentals: 24 * 60 * 60,
  ai: 0,
};

export function computeFreshness(params: {
  assetClass: AssetClass;
  timestamp: string | null;
  now?: Date;
}): { isStale: boolean; ageSeconds: number | null; marketSession: MarketSessionState } {
  const now = params.now ?? new Date();

  if (params.assetClass === "crypto") {
    const ageSeconds = params.timestamp
      ? Math.max(0, (now.getTime() - new Date(params.timestamp).getTime()) / 1000)
      : null;
    const isStale =
      ageSeconds != null && ageSeconds > STALE_THRESHOLD_SECONDS.crypto;
    return { isStale, ageSeconds, marketSession: "24h" };
  }

  // Equity / ETF: session-aware.
  const session = getEquitySession(now);
  const ageSeconds = params.timestamp
    ? Math.max(0, (now.getTime() - new Date(params.timestamp).getTime()) / 1000)
    : null;

  // When closed/pre/post, the last regular close is expected and not "stale".
  if (!session.isOpen) {
    return { isStale: false, ageSeconds, marketSession: session.state };
  }

  const threshold = STALE_THRESHOLD_SECONDS[params.assetClass] ?? 20 * 60;
  const isStale = ageSeconds != null && ageSeconds > threshold;
  return { isStale, ageSeconds, marketSession: session.state };
}

// Confidence heuristic used in quote metadata (0..1).
export function computeConfidence(params: {
  implemented: boolean;
  isStale: boolean;
  isFallback: boolean;
  hasError: boolean;
}): number {
  if (params.hasError) return 0;
  let c = params.implemented ? 0.9 : 0.4;
  if (params.isStale) c -= 0.4;
  if (params.isFallback) c -= 0.15;
  return Math.max(0, Math.min(1, Number(c.toFixed(2))));
}
