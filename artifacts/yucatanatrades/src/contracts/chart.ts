import { z } from "zod";

import type { DataProvenance, DataTruthState } from "@/contracts/dashboard";

const ISO_TIMESTAMP_WITH_OFFSET =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/;

function isValidChartInstant(value: string): boolean {
  const match = value.match(ISO_TIMESTAMP_WITH_OFFSET);
  const instant = Date.parse(value);
  if (!match || !Number.isFinite(instant)) return false;

  const [, year, month, day, hour, minute, second, fraction = "0", offset, sign, offsetHour = "0", offsetMinute = "0"] = match;
  const direction = sign === "-" ? -1 : 1;
  const offsetMinutes = offset === "Z"
    ? 0
    : direction * (Number(offsetHour) * 60 + Number(offsetMinute));
  const local = new Date(instant + offsetMinutes * 60_000);
  const milliseconds = Number(fraction.padEnd(3, "0"));

  return local.getUTCFullYear() === Number(year)
    && local.getUTCMonth() + 1 === Number(month)
    && local.getUTCDate() === Number(day)
    && local.getUTCHours() === Number(hour)
    && local.getUTCMinutes() === Number(minute)
    && local.getUTCSeconds() === Number(second)
    && local.getUTCMilliseconds() === milliseconds;
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

const finiteNumberSchema = z
  .number()
  .refine(Number.isFinite, "Chart values must be finite numbers");

const finiteNonnegativeNumberSchema = z
  .number()
  .nonnegative()
  .refine(Number.isFinite, "Chart values must be finite numbers");

export const dataTruthStateSchema = z.enum([
  "live",
  "delayed",
  "historical",
  "demo",
  "simulated",
  "ai-generated",
  "unavailable",
]);

export const dataProvenanceSchema = z
  .object({
    state: dataTruthStateSchema,
    provider: z.string().trim().min(1).optional(),
    sourceType: z.enum([
      "provider",
      "cache",
      "fixture",
      "user",
      "derived",
      "ai",
    ]),
    generatedAt: z.string().datetime({ offset: true }).optional(),
    receivedAt: z.string().datetime({ offset: true }).optional(),
    marketAt: z.string().datetime({ offset: true }).optional(),
    freshness: z.enum(["fresh", "aging", "stale", "unknown"]),
    delayedByMs: z.number().int().nonnegative().optional(),
    cacheState: z.enum(["hit", "miss", "stale", "none"]),
    error: z
      .object({
        code: z.string().trim().min(1),
        message: z.string().trim().min(1),
        retryable: z.boolean(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const meridianChartTimestampSchema = z
  .string()
  .datetime({ offset: true })
  .refine(
    (value) => ISO_TIMESTAMP_WITH_OFFSET.test(value),
    "Chart timestamps must be ISO 8601 date-times with an explicit UTC offset",
  )
  .refine(
    isValidChartInstant,
    "Chart timestamps must represent a valid instant",
  );

export const meridianChartCandleSchema = z
  .object({
    timestamp: meridianChartTimestampSchema,
    displayLabel: z.string().trim().min(1).optional(),
    open: finiteNumberSchema,
    high: finiteNumberSchema,
    low: finiteNumberSchema,
    close: finiteNumberSchema,
    volume: finiteNonnegativeNumberSchema,
  })
  .strict()
  .superRefine((candle, context) => {
    const upperBody = Math.max(candle.open, candle.close);
    const lowerBody = Math.min(candle.open, candle.close);

    if (candle.high < upperBody || candle.high < candle.low) {
      context.addIssue({
        code: "custom",
        path: ["high"],
        message: "Candle high must be at or above open, close, and low",
      });
    }

    if (candle.low > lowerBody || candle.low > candle.high) {
      context.addIssue({
        code: "custom",
        path: ["low"],
        message: "Candle low must be at or below open, close, and high",
      });
    }
  });

export const meridianChartSeriesSchema = z
  .object({
    symbol: z.string().trim().min(1).max(32),
    timeframe: z.string().trim().min(1).max(16),
    timeZone: z
      .string()
      .trim()
      .min(1)
      .refine(isValidTimeZone, "Chart timeZone must be a valid IANA time zone"),
    currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
    truthState: dataTruthStateSchema,
    provenance: dataProvenanceSchema,
    candles: z.array(meridianChartCandleSchema),
  })
  .strict()
  .superRefine((series, context) => {
    if (series.provenance.state !== series.truthState) {
      context.addIssue({
        code: "custom",
        path: ["provenance", "state"],
        message: "Provenance state must match the chart truth state",
      });
    }

    let previousTimestamp = Number.NEGATIVE_INFINITY;

    series.candles.forEach((candle, index) => {
      const timestamp = Date.parse(candle.timestamp);

      if (timestamp === previousTimestamp) {
        context.addIssue({
          code: "custom",
          path: ["candles", index, "timestamp"],
          message: "Chart candle timestamps must be unique",
        });
      } else if (timestamp < previousTimestamp) {
        context.addIssue({
          code: "custom",
          path: ["candles", index, "timestamp"],
          message: "Chart candles must be ordered by ascending timestamp",
        });
      }

      previousTimestamp = timestamp;
    });
  });

export interface MeridianChartCandle {
  timestamp: string;
  displayLabel?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MeridianChartSeries {
  symbol: string;
  timeframe: string;
  timeZone: string;
  currency?: string;
  truthState: DataTruthState;
  provenance: DataProvenance;
  candles: MeridianChartCandle[];
}

export function parseMeridianChartSeries(input: unknown): MeridianChartSeries {
  return meridianChartSeriesSchema.parse(input) as MeridianChartSeries;
}
