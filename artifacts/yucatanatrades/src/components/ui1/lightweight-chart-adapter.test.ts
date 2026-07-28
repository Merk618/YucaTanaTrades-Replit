import { describe, expect, it } from "vitest";

import {
  meridianChartCandleSchema,
  parseMeridianChartSeries,
  type MeridianChartCandle,
  type MeridianChartSeries,
} from "@/contracts/chart";
import {
  parseBooleanFeatureFlag,
  resolveMeridianFeatureFlags,
} from "@/config/feature-flags";

import {
  adaptMeridianChartSeries,
  calculateSimpleMovingAverage,
  isoTimestampToChartTime,
} from "./lightweight-chart-adapter";

function makeCandles(count = 21): MeridianChartCandle[] {
  return Array.from({ length: count }, (_, index) => {
    const close = index + 1;
    const timestamp = new Date(
      Date.UTC(2026, 6, 10, 13, 30 + index),
    ).toISOString();

    return {
      timestamp,
      displayLabel: new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      }).format(new Date(timestamp)),
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume: close * 100,
    };
  });
}

function makeSeries(
  overrides: Partial<MeridianChartSeries> = {},
): MeridianChartSeries {
  return {
    symbol: "SPX",
    timeframe: "1D",
    timeZone: "America/New_York",
    currency: "USD",
    truthState: "historical",
    provenance: {
      state: "historical",
      sourceType: "fixture",
      generatedAt: "2026-07-10T20:00:00.000Z",
      marketAt: "2026-07-10T20:00:00.000Z",
      freshness: "unknown",
      cacheState: "none",
    },
    candles: makeCandles(),
    ...overrides,
  };
}

describe("Meridian chart contracts", () => {
  it("accepts ordered finite OHLCV candles with explicit-offset timestamps", () => {
    const series = makeSeries();

    expect(parseMeridianChartSeries(series)).toEqual(series);
  });

  it("rejects timestamps without an explicit UTC offset or a valid calendar instant", () => {
    const candle = makeCandles(1)[0];
    expect(() => meridianChartCandleSchema.parse({
      ...candle,
      timestamp: "2026-07-10T09:30:00",
    })).toThrow(/explicit UTC offset/);
    expect(() => meridianChartCandleSchema.parse({
      ...candle,
      timestamp: "2026-02-30T09:30:00.000Z",
    })).toThrow(/valid instant/);
  });

  it("rejects non-finite values, invalid OHLC ranges, and negative volume", () => {
    expect(() =>
      meridianChartCandleSchema.parse({
        ...makeCandles(1)[0],
        close: Number.NaN,
      }),
    ).toThrow();
    expect(() =>
      meridianChartCandleSchema.parse({
        ...makeCandles(1)[0],
        open: Number.POSITIVE_INFINITY,
      }),
    ).toThrow();
    const missingOpen = { ...makeCandles(1)[0] } as Record<string, unknown>;
    delete missingOpen.open;
    expect(() => meridianChartCandleSchema.parse(missingOpen)).toThrow();
    expect(() =>
      meridianChartCandleSchema.parse({
        ...makeCandles(1)[0],
        high: -1,
      }),
    ).toThrow(/Candle high/);
    expect(() =>
      meridianChartCandleSchema.parse({
        ...makeCandles(1)[0],
        volume: -1,
      }),
    ).toThrow();
  });

  it("rejects duplicate timestamps", () => {
    const candles = makeCandles(2);
    candles[1] = { ...candles[1], timestamp: candles[0].timestamp };

    expect(() => parseMeridianChartSeries(makeSeries({ candles }))).toThrow(
      /timestamps must be unique/,
    );
  });

  it("rejects out-of-order timestamps", () => {
    expect(() =>
      parseMeridianChartSeries(
        makeSeries({ candles: makeCandles(2).reverse() }),
      ),
    ).toThrow(/ordered by ascending timestamp/);
  });

  it("rejects invalid time zones and provenance/truth-state mismatches", () => {
    expect(() =>
      parseMeridianChartSeries(makeSeries({ timeZone: "New York" })),
    ).toThrow(/valid IANA time zone/);
    expect(() =>
      parseMeridianChartSeries(
        makeSeries({
          truthState: "demo",
        }),
      ),
    ).toThrow(/Provenance state must match/);
  });
});

describe("Lightweight Charts adapter", () => {
  it("converts candles and volume without mutating the Meridian series", () => {
    const series = makeSeries();
    const before = structuredClone(series);
    const adapted = adaptMeridianChartSeries(series);
    const firstTime = isoTimestampToChartTime(series.candles[0].timestamp);

    expect(adapted.candles[0]).toEqual({
      time: firstTime,
      open: 1,
      high: 2,
      low: 0,
      close: 1,
    });
    expect(adapted.volume[0]).toEqual({ time: firstTime, value: 100 });
    expect(adapted.latest).toEqual(series.candles.at(-1));
    expect(adapted.candleByTime.get(firstTime)).toEqual(series.candles[0]);
    expect(adapted.metadata.truthState).toBe("historical");
    expect(adapted.metadata.provenance).toEqual(series.provenance);
    expect(series).toEqual(before);
  });

  it("preserves empty, Demo, and simulated Meridian state without mutation", () => {
    const empty = makeSeries({ candles: [] });
    const adaptedEmpty = adaptMeridianChartSeries(empty);
    expect(adaptedEmpty.candles).toEqual([]);
    expect(adaptedEmpty.volume).toEqual([]);
    expect(adaptedEmpty.latest).toBeNull();

    const demo = makeSeries({
      truthState: "demo",
      provenance: {
        ...makeSeries().provenance,
        state: "demo",
      },
    });
    const simulated = makeSeries({
      truthState: "simulated",
      provenance: {
        ...makeSeries().provenance,
        state: "simulated",
        sourceType: "derived",
      },
    });
    expect(adaptMeridianChartSeries(demo).metadata.truthState).toBe("demo");
    expect(adaptMeridianChartSeries(demo).metadata.provenance).toEqual(demo.provenance);
    expect(adaptMeridianChartSeries(simulated).metadata.truthState).toBe("simulated");
    expect(adaptMeridianChartSeries(simulated).metadata.provenance).toEqual(simulated.provenance);
  });

  it("calculates deterministic MA8 and MA21 data", () => {
    const candles = makeCandles();
    const ma8 = calculateSimpleMovingAverage(candles, 8);
    const ma21 = calculateSimpleMovingAverage(candles, 21);

    expect(ma8).toHaveLength(14);
    expect(ma8[0]).toEqual({
      timestamp: candles[7].timestamp,
      value: 4.5,
    });
    expect(ma8.at(-1)?.value).toBe(17.5);
    expect(ma21).toEqual([
      {
        timestamp: candles[20].timestamp,
        value: 11,
      },
    ]);

    const adapted = adaptMeridianChartSeries(makeSeries({ candles }));
    expect(adapted.ma8).toHaveLength(14);
    expect(adapted.ma21).toHaveLength(1);
  });

  it("returns no average before a full window and rejects invalid periods", () => {
    expect(calculateSimpleMovingAverage(makeCandles(7), 8)).toEqual([]);
    expect(() => calculateSimpleMovingAverage(makeCandles(), 0)).toThrow(
      RangeError,
    );
    expect(() => calculateSimpleMovingAverage(makeCandles(), 1.5)).toThrow(
      RangeError,
    );
  });

  it("rejects timestamps that collide at Lightweight Charts second precision", () => {
    const candles = makeCandles(2);
    candles[0] = {
      ...candles[0],
      timestamp: "2026-07-10T13:30:00.100Z",
    };
    candles[1] = {
      ...candles[1],
      timestamp: "2026-07-10T13:30:00.900Z",
    };

    expect(() =>
      adaptMeridianChartSeries(makeSeries({ candles })),
    ).toThrow(/whole-second precision/);
  });
});

describe("Meridian feature flags", () => {
  it("defaults the chart engine off and accepts only strict boolean values", () => {
    expect(resolveMeridianFeatureFlags({})).toEqual({ chartV2: false });
    expect(
      resolveMeridianFeatureFlags({
        VITE_ENABLE_MERIDIAN_CHART_V2: "true",
      }),
    ).toEqual({ chartV2: true });
    expect(
      resolveMeridianFeatureFlags({
        VITE_ENABLE_MERIDIAN_CHART_V2: "false",
      }),
    ).toEqual({ chartV2: false });
    expect(parseBooleanFeatureFlag("FLAG", true)).toBe(false);
  });

  it("fails closed for ambiguous feature-flag values", () => {
    for (const value of ["TRUE", "1", " true ", 1, null]) {
      expect(parseBooleanFeatureFlag("FLAG", value)).toBe(false);
    }
  });
});
