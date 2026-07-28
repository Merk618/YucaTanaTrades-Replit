import type {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";

import {
  meridianChartTimestampSchema,
  parseMeridianChartSeries,
  type MeridianChartCandle,
  type MeridianChartSeries,
} from "@/contracts/chart";

export interface MeridianMovingAveragePoint {
  timestamp: string;
  value: number;
}

interface LightweightChartMetadata {
  symbol: string;
  timeframe: string;
  timeZone: string;
  currency?: string;
  truthState: MeridianChartSeries["truthState"];
  provenance: MeridianChartSeries["provenance"];
}

interface AdaptedMeridianChartSeries {
  candles: CandlestickData<UTCTimestamp>[];
  volume: HistogramData<UTCTimestamp>[];
  ma8: LineData<UTCTimestamp>[];
  ma21: LineData<UTCTimestamp>[];
  latest: MeridianChartCandle | null;
  candleByTime: ReadonlyMap<UTCTimestamp, MeridianChartCandle>;
  metadata: LightweightChartMetadata;
}

export function isoTimestampToChartTime(timestamp: string): UTCTimestamp {
  const parsedTimestamp = meridianChartTimestampSchema.parse(timestamp);
  return Math.floor(Date.parse(parsedTimestamp) / 1_000) as UTCTimestamp;
}

export function calculateSimpleMovingAverage(
  candles: readonly MeridianChartCandle[],
  period: number,
): MeridianMovingAveragePoint[] {
  if (!Number.isInteger(period) || period <= 0) {
    throw new RangeError("Moving-average period must be a positive integer");
  }

  if (candles.length < period) {
    return [];
  }

  const points: MeridianMovingAveragePoint[] = [];
  let rollingClose = 0;

  candles.forEach((candle, index) => {
    if (!Number.isFinite(candle.close)) {
      throw new TypeError("Moving-average close values must be finite");
    }

    meridianChartTimestampSchema.parse(candle.timestamp);
    rollingClose += candle.close;

    if (index >= period) {
      rollingClose -= candles[index - period].close;
    }

    if (index >= period - 1) {
      points.push({
        timestamp: candle.timestamp,
        value: rollingClose / period,
      });
    }
  });

  return points;
}

export function adaptMeridianChartSeries(
  input: unknown,
): AdaptedMeridianChartSeries {
  const series = parseMeridianChartSeries(input);
  const candles: CandlestickData<UTCTimestamp>[] = [];
  const volume: HistogramData<UTCTimestamp>[] = [];
  const candleByTime = new Map<UTCTimestamp, MeridianChartCandle>();

  series.candles.forEach((candle) => {
    const time = isoTimestampToChartTime(candle.timestamp);

    if (candleByTime.has(time)) {
      throw new Error(
        "Chart candle timestamps must remain unique at whole-second precision",
      );
    }

    candles.push({
      time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });
    volume.push({ time, value: candle.volume });
    candleByTime.set(time, candle);
  });

  const movingAverageToLineData = (
    point: MeridianMovingAveragePoint,
  ): LineData<UTCTimestamp> => ({
    time: isoTimestampToChartTime(point.timestamp),
    value: point.value,
  });

  const latest = series.candles.at(-1) ?? null;
  const metadata: LightweightChartMetadata = {
    symbol: series.symbol,
    timeframe: series.timeframe,
    timeZone: series.timeZone,
    truthState: series.truthState,
    provenance: series.provenance,
    ...(series.currency === undefined ? {} : { currency: series.currency }),
  };

  return {
    candles,
    volume,
    ma8: calculateSimpleMovingAverage(series.candles, 8).map(
      movingAverageToLineData,
    ),
    ma21: calculateSimpleMovingAverage(series.candles, 21).map(
      movingAverageToLineData,
    ),
    latest,
    candleByTime,
    metadata,
  };
}
