export interface PriceDomainPoint {
  low: number;
  high: number;
  close: number;
}

export interface VisiblePriceDomain {
  min: number;
  max: number;
  rawMin: number;
  rawMax: number;
  clippedLow: boolean;
  clippedHigh: boolean;
}

function quantile(sorted: number[], ratio: number) {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const weight = index - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

function finite(values: number[]) {
  return values.filter(Number.isFinite).sort((a, b) => a - b);
}

export function calculateVisiblePriceDomain(
  points: PriceDomainPoint[],
  paddingRatio = 0.07,
): VisiblePriceDomain {
  const lows = finite(points.map((point) => point.low));
  const highs = finite(points.map((point) => point.high));
  const closes = finite(points.map((point) => point.close));

  if (!lows.length || !highs.length || !closes.length) {
    return {
      min: 0,
      max: 1,
      rawMin: 0,
      rawMax: 1,
      clippedLow: false,
      clippedHigh: false,
    };
  }

  const rawMin = lows[0]!;
  const rawMax = highs[highs.length - 1]!;
  const closeQ1 = quantile(closes, 0.25);
  const closeQ3 = quantile(closes, 0.75);
  const closeIqr = Math.max(closeQ3 - closeQ1, Number.EPSILON);
  const candleRanges = finite(points.map((point) => Math.max(0, point.high - point.low)));
  const typicalCandleRange = Math.max(quantile(candleRanges, 0.5), Number.EPSILON);

  // A broad 3×IQR / 4×median-candle fence preserves legitimate trend and wicks
  // while preventing one malformed candle from flattening every other candle.
  const fenceDistance = Math.max(closeIqr * 3, typicalCandleRange * 4);
  const lowerFence = closeQ1 - fenceDistance;
  const upperFence = closeQ3 + fenceDistance;
  let visibleMin = Math.max(rawMin, lowerFence);
  let visibleMax = Math.min(rawMax, upperFence);

  if (!Number.isFinite(visibleMin) || !Number.isFinite(visibleMax) || visibleMax <= visibleMin) {
    visibleMin = rawMin;
    visibleMax = rawMax;
  }

  const visibleRange = Math.max(
    visibleMax - visibleMin,
    Math.max(Math.abs(visibleMax), 1) * 0.001,
  );
  const safePaddingRatio = Math.min(0.08, Math.max(0.05, paddingRatio));
  const padding = visibleRange * safePaddingRatio;

  return {
    min: visibleMin - padding,
    max: visibleMax + padding,
    rawMin,
    rawMax,
    clippedLow: rawMin < visibleMin,
    clippedHigh: rawMax > visibleMax,
  };
}
