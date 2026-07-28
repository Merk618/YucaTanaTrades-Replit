import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  GitCompareArrows,
  Layers3,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
} from "lucide-react";
import { motionTokens } from "@/lib/motion";
import { calculateVisiblePriceDomain } from "@/components/ui1/chart-domain";
import type {
  MeridianChartCandle,
  MeridianChartSeries,
} from "@/contracts/chart";
import "@/meridian-eclipse-chart.css";

const LightweightChartSurface = React.lazy(async () => {
  const module = await import("@/components/ui1/lightweight-chart-surface");
  return { default: module.LightweightChartSurface };
});

export type ChartCandleView = MeridianChartCandle;
export type ChartPlotEngine = "svg" | "lightweight";

export interface ChartWorkspaceView {
  symbol: string;
  name: string;
  displayValue: string;
  changePercent: number;
  asOf: string;
  stateLabel: string;
  timeZone: string;
  currency?: string;
  truthState: MeridianChartSeries["truthState"];
  provenance: MeridianChartSeries["provenance"];
  timeframes: Record<string, ChartCandleView[]>;
}

function movingAverage(points: ChartCandleView[], period: number) {
  return points.map((point, index) => {
    const start = Math.max(0, index - period + 1);
    const window = points.slice(start, index + 1);
    return window.reduce((sum, item) => sum + item.close, 0) / window.length;
  });
}

function linePath(values: number[], xAt: (index: number) => number, yAt: (value: number) => number) {
  return values.map((value, index) => `${index ? "L" : "M"} ${xAt(index).toFixed(2)} ${yAt(value).toFixed(2)}`).join(" ");
}

interface RenderCandle extends ChartCandleView {
  derived: boolean;
  sourcePosition: number;
}

type DensityBand = "mobile" | "compact" | "tablet" | "desktop" | "wide";

function densityBandForWidth(width: number): DensityBand {
  if (width >= 1180) return "wide";
  if (width >= 860) return "desktop";
  if (width >= 620) return "tablet";
  if (width >= 390) return "compact";
  return "mobile";
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Keeps the Overview candle cadence tied to its rendered container rather
 * than the viewport. Standard desktop cards resolve to roughly 90–130
 * intervals, with the 150 interval ceiling reserved for genuinely large
 * Overview surfaces. The dedicated Charts route retains its denser range.
 */
export function chartCandleTarget(width: number, routeMode: boolean) {
  const safeWidth = Math.max(280, Number.isFinite(width) ? width : 960);

  if (routeMode) {
    return clamp(Math.round(safeWidth / 7), 48, safeWidth >= 1180 ? 168 : 144);
  }
  if (safeWidth < 620) {
    return clamp(Math.round(safeWidth / 7.2), 44, 72);
  }
  if (safeWidth < 900) {
    return clamp(Math.round(safeWidth / 7.8), 72, 96);
  }
  if (safeWidth < 1200) {
    return clamp(Math.round(safeWidth / 8.2), 96, 128);
  }
  return clamp(Math.round(safeWidth / 8.5), 110, 148);
}

function parseTimeMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridian = match[3]?.toUpperCase();
  if (meridian === "PM" && hour < 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function interpolateDisplayLabel(
  left: string | undefined,
  right: string | undefined,
  ratio: number,
) {
  if (!left) return right;
  if (!right) return left;
  const leftMinutes = parseTimeMinutes(left);
  const rightMinutes = parseTimeMinutes(right);
  if (leftMinutes === null || rightMinutes === null) return ratio < 0.5 ? left : right;
  const total = Math.round(leftMinutes + (rightMinutes - leftMinutes) * ratio);
  const hour24 = Math.floor(total / 60) % 24;
  const minute = ((total % 60) + 60) % 60;
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
}

function interpolateTimestamp(left: string, right: string, ratio: number) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
    return ratio < 0.5 ? left : right;
  }
  return new Date(Math.round(leftTime + (rightTime - leftTime) * ratio)).toISOString();
}

/**
 * Adds deterministic visual resolution between fixture candles. The source
 * series and its endpoints stay unchanged; no clock, random value, or provider
 * request participates in this rendering-only expansion.
 */
function densifyCandles(source: ChartCandleView[], target: number): RenderCandle[] {
  if (!source.length) return [];
  if (source.length === 1 || source.length >= target) {
    return source.map((point, index) => ({ ...point, derived: false, sourcePosition: index }));
  }

  const result: RenderCandle[] = [];
  const segmentCount = source.length - 1;
  const derivedCount = target - source.length;
  const derivedPerSegment = Math.floor(derivedCount / segmentCount);
  const derivedRemainder = derivedCount % segmentCount;

  for (let leftIndex = 0; leftIndex < segmentCount; leftIndex += 1) {
    const rightIndex = leftIndex + 1;
    const left = source[leftIndex]!;
    const right = source[rightIndex]!;
    result.push({ ...left, derived: false, sourcePosition: leftIndex });

    const segmentDerivedCount = derivedPerSegment + (leftIndex < derivedRemainder ? 1 : 0);
    for (let derivedIndex = 1; derivedIndex <= segmentDerivedCount; derivedIndex += 1) {
      const ratio = derivedIndex / (segmentDerivedCount + 1);
      const sourcePosition = leftIndex + ratio;
      const lerp = (a: number, b: number) => a + (b - a) * ratio;
      const sourceRange = Math.max(left.high, right.high) - Math.min(left.low, right.low);
      const bridge = Math.sin(Math.PI * ratio)
        * Math.sin((leftIndex + 1) * 2.173 + ratio * Math.PI * 2)
        * sourceRange
        * 0.045;
      const close = lerp(left.close, right.close) + bridge;
      const open = result.at(-1)?.close ?? lerp(left.open, right.open);
      const upperWick = Math.max(0.45, lerp(left.high - Math.max(left.open, left.close), right.high - Math.max(right.open, right.close)) * 0.62);
      const lowerWick = Math.max(0.45, lerp(Math.min(left.open, left.close) - left.low, Math.min(right.open, right.close) - right.low) * 0.62);

      result.push({
        timestamp: interpolateTimestamp(left.timestamp, right.timestamp, ratio),
        displayLabel: interpolateDisplayLabel(
          left.displayLabel,
          right.displayLabel,
          ratio,
        ),
        open,
        close,
        high: Math.max(open, close) + upperWick,
        low: Math.min(open, close) - lowerWick,
        volume: Math.max(1, lerp(left.volume, right.volume) * (0.88 + Math.sin((result.length + 1) * 1.73) * 0.06)),
        derived: true,
        sourcePosition,
      });
    }
  }
  result.push({ ...source.at(-1)!, derived: false, sourcePosition: source.length - 1 });
  return result;
}

function formatPrice(value: number, decimals: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function MarketChart({
  data,
  routeMode = false,
  plotEngine = "svg",
}: {
  data: ChartWorkspaceView;
  routeMode?: boolean;
  plotEngine?: ChartPlotEngine;
}) {
  const chartInstanceId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chartTitleId = `yt-chart-title-${chartInstanceId}`;
  const chartSummaryId = `yt-chart-summary-${chartInstanceId}`;
  const volumeGradientId = `yt-volume-fill-${chartInstanceId}`;
  const lineGlowId = `yt-line-glow-${chartInstanceId}`;
  const timeframes = Object.keys(data.timeframes);
  const [timeframe, setTimeframe] = React.useState(timeframes[0] ?? "1D");
  const [showIndicators, setShowIndicators] = React.useState(true);
  const [showComparison, setShowComparison] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [chartSize, setChartSize] = React.useState({ width: 960, height: routeMode ? 420 : 204 });
  const reducedMotion = useReducedMotion();
  const workspaceRef = React.useRef<HTMLElement | null>(null);
  const chartWrapRef = React.useRef<HTMLDivElement | null>(null);
  const expandButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const pendingIndexRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const workspace = workspaceRef.current;
    const chartWrap = chartWrapRef.current;
    if (!workspace || !chartWrap || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const chartEntry = entries.find((entry) => entry.target === chartWrap);
      if (!chartEntry) return;
      const nextSize = {
        width: Math.max(280, Math.round(chartEntry.contentRect.width)),
        height: Math.max(140, Math.round(chartEntry.contentRect.height)),
      };
      setChartSize((current) => (
        current.width === nextSize.width && current.height === nextSize.height
          ? current
          : nextSize
      ));
    });
    observer.observe(chartWrap);
    return () => observer.disconnect();
  }, [expanded, timeframe]);

  React.useEffect(() => {
    if (!expanded) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setExpanded(false);
      requestAnimationFrame(() => expandButtonRef.current?.focus());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

  React.useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const sourcePoints = data.timeframes[timeframe] ?? data.timeframes[timeframes[0] ?? ""] ?? [];
  const densityBand = densityBandForWidth(chartSize.width);
  const candleTarget = chartCandleTarget(chartSize.width, routeMode);
  const points = React.useMemo(
    () => densifyCandles(sourcePoints, candleTarget),
    [candleTarget, sourcePoints],
  );
  React.useEffect(() => {
    setHoverIndex((current) => current === null ? null : Math.min(current, Math.max(0, points.length - 1)));
  }, [points.length]);
  const useLightweight = routeMode && plotEngine === "lightweight";
  const hasDerivedPoints = points.some((point) => point.derived);
  const lightweightSeries = React.useMemo<MeridianChartSeries>(() => {
    const truthState = hasDerivedPoints ? "simulated" : data.truthState;
    const provenance = hasDerivedPoints
      ? {
          ...data.provenance,
          state: "simulated" as const,
          sourceType: "derived" as const,
          freshness: "unknown" as const,
          cacheState: "none" as const,
        }
      : data.provenance;

    return {
      symbol: data.symbol,
      timeframe,
      timeZone: data.timeZone,
      ...(data.currency ? { currency: data.currency } : {}),
      truthState,
      provenance,
      candles: points.map((point) => ({
        timestamp: point.timestamp,
        ...(point.displayLabel ? { displayLabel: point.displayLabel } : {}),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
      })),
    };
  }, [
    data.currency,
    data.provenance,
    data.symbol,
    data.timeZone,
    data.truthState,
    hasDerivedPoints,
    points,
    timeframe,
  ]);
  const W = chartSize.width;
  const H = chartSize.height;
  const plot = { left: 10, right: 62, top: 17, bottom: 28 };
  const chartBottom = H - plot.bottom;
  const volumeBandHeight = clamp(Math.round(H * 0.115), 24, 56);
  const priceBottom = chartBottom - volumeBandHeight - 8;
  const priceDomain = calculateVisiblePriceDomain(points, 0.07);
  const paddedMin = priceDomain.min;
  const paddedMax = priceDomain.max;
  const paddedRange = Math.max(Number.EPSILON, paddedMax - paddedMin);
  const axisDecimals = paddedRange < 10 ? 2 : paddedRange < 100 ? 1 : 0;
  const maxVolume = Math.max(...points.map((point) => point.volume), 1);
  const step = points.length > 1 ? (W - plot.left - plot.right) / (points.length - 1) : 0;
  const candleWidth = Math.max(1.7, Math.min(6.4, step * 0.64));
  const xAt = (index: number) => plot.left + step * index;
  const crispLine = (value: number) => Math.round(value) + 0.5;
  const yAt = (value: number) => {
    const projected = plot.top + ((paddedMax - value) / paddedRange) * (priceBottom - plot.top);
    return Math.max(plot.top, Math.min(priceBottom, projected));
  };
  const maFast = movingAverage(points, 8);
  const maSlow = movingAverage(points, 21);
  const comparisonBase = points[0]?.close ?? 1;
  const compare = points.map((point, index) => {
    const relativeReturn = point.close / comparisonBase - 1;
    return comparisonBase * (1 + relativeReturn * 0.78 + Math.sin(index * 0.19) * 0.0024);
  });
  const activePoint = hoverIndex === null ? null : points[hoverIndex];
  const lastPoint = points.at(-1) ?? null;
  const timeTickCount = densityBand === "mobile" || densityBand === "compact" ? 4 : 7;
  const timeTickIndexes = Array.from({ length: Math.min(timeTickCount, points.length) }, (_, index) => (
    Math.round((index * (points.length - 1)) / Math.max(1, Math.min(timeTickCount, points.length) - 1))
  ));
  const activeIsDomainClipped = Boolean(
    activePoint && (activePoint.high > paddedMax || activePoint.low < paddedMin),
  );

  const updateHover = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!points.length || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = ((event.clientX - rect.left) / rect.width) * W;
    const nextIndex = Math.max(0, Math.min(points.length - 1, Math.round((localX - plot.left) / Math.max(step, 1))));
    pendingIndexRef.current = nextIndex;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      setHoverIndex(pendingIndexRef.current);
      frameRef.current = null;
    });
  };

  const clearHover = () => {
    pendingIndexRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setHoverIndex(null);
  };

  const moveKeyboardCrosshair = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!points.length || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    setHoverIndex((current) => Math.max(0, Math.min(points.length - 1, (current ?? points.length - 1) + direction)));
  };

  return (
    <motion.section
      ref={workspaceRef}
      className={`yt-chart-workspace ${routeMode ? "is-route" : ""} ${expanded ? "is-expanded" : ""}`}
      aria-labelledby={chartTitleId}
      aria-describedby={chartSummaryId}
      data-density={densityBand}
      data-chart-scope={routeMode ? "route" : "overview"}
      data-chart-engine={useLightweight ? "lightweight" : "svg"}
      data-candle-count={points.length}
      data-render-width={W}
      data-render-height={H}
      layout={!reducedMotion}
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion
        ? { duration: 0 }
        : { ...motionTokens.spring.panel, delay: routeMode ? motionTokens.delay.routeSurface : motionTokens.delay.chart }}
    >
      <header className="yt-chart-header">
        <div className="yt-chart-identity">
          {routeMode ? (
            <div className="yt-symbol-select is-static" aria-label={`${data.name}, ${data.symbol}, selected in the chart workspace`}>
              <span>
                <strong id={chartTitleId}>{data.name}</strong>
                <small>{data.symbol}</small>
              </span>
            </div>
          ) : (
            <button className="yt-symbol-select" type="button" aria-label="Select symbol, preview fixed to S&P 500">
              <span>
                <strong id={chartTitleId}>{data.name}</strong>
                <small>{data.symbol}</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </button>
          )}
          <div className="yt-chart-quote">
            <strong>{data.displayValue}</strong>
            <span className={data.changePercent >= 0 ? "is-positive" : "is-negative"}>
              {data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%
            </span>
          </div>
          <span className="yt-state-pill is-historical">{data.stateLabel}</span>
          <span className="yt-chart-asof">{data.asOf}</span>
        </div>

        <div className="yt-chart-controls" aria-label="Chart controls">
          <div className="yt-timeframes" role="group" aria-label="Timeframe">
            {timeframes.map((label) => (
              <button
                key={label}
                type="button"
                className={timeframe === label ? "is-active" : undefined}
                aria-pressed={timeframe === label}
                onClick={() => {
                  clearHover();
                  setTimeframe(label);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className={showIndicators ? "is-active" : undefined}
            type="button"
            aria-pressed={showIndicators}
            onClick={() => setShowIndicators((current) => !current)}
            title="Toggle moving averages"
          >
            <SlidersHorizontal aria-hidden="true" /><span>Indicators</span>
          </button>
          <button
            className={showComparison ? "is-active" : undefined}
            type="button"
            aria-pressed={showComparison}
            onClick={() => setShowComparison((current) => !current)}
            title="Toggle deterministic benchmark comparison"
          >
            <GitCompareArrows aria-hidden="true" /><span>Compare</span>
          </button>
          <button type="button" disabled title="Chart templates are unavailable in UI-1">
            <Layers3 aria-hidden="true" /><span>Templates</span>
          </button>
          <button
            ref={expandButtonRef}
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={expanded ? "Exit expanded chart" : "Expand chart"}
            aria-pressed={expanded}
            aria-expanded={expanded}
            title={expanded ? "Exit expanded chart (Escape)" : "Expand chart"}
          >
            {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </button>
        </div>
      </header>

      <p id={chartSummaryId} className="sr-only">
        {points.length && lastPoint
          ? `${data.name} ${timeframe}. ${points.length} ${hasDerivedPoints ? "simulated" : data.truthState} intervals. Latest open ${formatPrice(lastPoint.open, axisDecimals)}, high ${formatPrice(lastPoint.high, axisDecimals)}, low ${formatPrice(lastPoint.low, axisDecimals)}, close ${formatPrice(lastPoint.close, axisDecimals)}, volume ${Math.round(lastPoint.volume).toLocaleString()}. Source: ${data.provenance.provider ?? data.provenance.sourceType}.`
          : `${data.name} ${timeframe}. Historical series unavailable. Source: ${data.provenance.provider ?? data.provenance.sourceType}.`}
      </p>

      <div className="yt-chart-canvas">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            ref={chartWrapRef}
            key={useLightweight ? "lightweight-chart" : timeframe}
            className={`yt-chart-svg-wrap ${useLightweight ? "has-lightweight" : ""}`}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
            transition={{ duration: reducedMotion ? 0.06 : motionTokens.duration.interface }}
          >
            {useLightweight ? (
              points.length ? (
                <React.Suspense
                  fallback={(
                    <div className="yt-chart-empty" role="status">
                      <BarChart3 aria-hidden="true" />Preparing analytical chart
                    </div>
                  )}
                >
                  <LightweightChartSurface
                    series={lightweightSeries}
                    showIndicators={showIndicators}
                    showComparison={showComparison}
                  />
                </React.Suspense>
              ) : null
            ) : (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              tabIndex={0}
              aria-label={`${data.name} ${timeframe} deterministic historical demo candlestick chart`}
              onPointerMove={updateHover}
              onPointerDown={updateHover}
              onPointerLeave={clearHover}
              onBlur={clearHover}
              onKeyDown={moveKeyboardCrosshair}
            >
              <desc>
                {points.length} visible deterministic intervals with volume, moving averages, and a current price of{" "}
                {lastPoint ? formatPrice(lastPoint.close, axisDecimals) : "unavailable"}.
              </desc>
              <defs>
                <linearGradient id={volumeGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8eb9a0" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#8eb9a0" stopOpacity="0.08" />
                </linearGradient>
                <filter id={lineGlowId} x="-20%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="1.4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              <rect
                className="yt-chart-plot-wash"
                x={plot.left}
                y={plot.top}
                width={W - plot.left - plot.right}
                height={priceBottom - plot.top}
              />

              {points.length > 0 && Array.from({ length: 6 }).map((_, index) => {
                const y = plot.top + ((priceBottom - plot.top) / 5) * index;
                const labelValue = paddedMax - (paddedRange / 5) * index;
                return (
                  <g key={`y-${index}`}>
                    <line
                      className="yt-chart-grid"
                      x1={plot.left}
                      x2={W - plot.right}
                      y1={crispLine(y)}
                      y2={crispLine(y)}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text className="yt-chart-axis" x={W - 5} y={y + 3} textAnchor="end">
                      {formatPrice(labelValue, axisDecimals)}
                    </text>
                  </g>
                );
              })}
              {points.length > 0 && Array.from({ length: 9 }).map((_, index) => {
                const x = plot.left + ((W - plot.left - plot.right) / 8) * index;
                return (
                  <line
                    key={`x-${index}`}
                    className="yt-chart-grid is-vertical"
                    x1={crispLine(x)}
                    x2={crispLine(x)}
                    y1={plot.top}
                    y2={chartBottom}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              <line
                className="yt-chart-volume-separator"
                x1={plot.left}
                x2={W - plot.right}
                y1={crispLine(priceBottom + 4)}
                y2={crispLine(priceBottom + 4)}
                vectorEffect="non-scaling-stroke"
              />

              {points.map((point, index) => {
                const x = xAt(index);
                const rising = point.close >= point.open;
                const bodyTop = yAt(Math.max(point.open, point.close));
                const bodyBottom = yAt(Math.min(point.open, point.close));
                const bodyHeight = Math.max(1.3, bodyBottom - bodyTop);
                const volumeHeight = (point.volume / maxVolume) * volumeBandHeight;
                return (
                  <g
                    key={`${timeframe}-${point.sourcePosition.toFixed(4)}-${index}`}
                    className={`${rising ? "is-up" : "is-down"} ${index === points.length - 1 ? "is-current" : ""}`}
                  >
                    <rect
                      className="yt-chart-volume"
                      x={x - candleWidth / 2}
                      y={chartBottom - volumeHeight}
                      width={candleWidth}
                      height={volumeHeight}
                      style={{ fill: `url(#${volumeGradientId})` }}
                    />
                    <line
                      className="yt-candle-wick"
                      x1={crispLine(x)}
                      x2={crispLine(x)}
                      y1={yAt(point.high)}
                      y2={yAt(point.low)}
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      className="yt-candle-body"
                      x={Math.round(x - candleWidth / 2)}
                      y={bodyTop}
                      width={Math.max(2, Math.round(candleWidth))}
                      height={bodyHeight}
                      rx="0.6"
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="geometricPrecision"
                    />
                  </g>
                );
              })}

              <AnimatePresence initial={false}>
                {showIndicators && points.length > 0 && (
                  <motion.g
                    key="moving-averages"
                    initial={reducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.18 }}
                  >
                    <motion.path
                      className="yt-ma-line is-fast"
                      d={linePath(maFast, xAt, yAt)}
                      style={{ filter: `url(#${lineGlowId})` }}
                      initial={reducedMotion ? false : { pathLength: 0.76 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: reducedMotion ? 0 : 0.28, ease: "easeOut" }}
                    />
                    <motion.path
                      className="yt-ma-line is-slow"
                      d={linePath(maSlow, xAt, yAt)}
                      initial={reducedMotion ? false : { pathLength: 0.76 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: reducedMotion ? 0 : 0.34, ease: "easeOut" }}
                    />
                  </motion.g>
                )}
                {showComparison && points.length > 0 && (
                  <motion.path
                    key="benchmark-comparison"
                    className="yt-compare-line"
                    d={linePath(compare, xAt, yAt)}
                    initial={reducedMotion ? false : { opacity: 0, pathLength: 0.7 }}
                    animate={{ opacity: 0.72, pathLength: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.26, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              {lastPoint && (
                <g className={`yt-last-price ${lastPoint.close >= lastPoint.open ? "is-up" : "is-down"}`}>
                  <line
                    x1={plot.left}
                    x2={W - plot.right}
                    y1={crispLine(yAt(lastPoint.close))}
                    y2={crispLine(yAt(lastPoint.close))}
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect x={W - plot.right + 4} y={yAt(lastPoint.close) - 8} width={plot.right - 8} height="16" rx="4" />
                  <text x={W - 5} y={yAt(lastPoint.close) + 3} textAnchor="end">
                    {formatPrice(lastPoint.close, axisDecimals)}
                  </text>
                  <circle className="yt-current-price-pulse" cx={xAt(points.length - 1)} cy={yAt(lastPoint.close)} r="3" />
                </g>
              )}

              {timeTickIndexes.map((originalIndex, labelIndex) => {
                const point = points[originalIndex]!;
                return (
                  <text
                    key={`label-${labelIndex}`}
                    className="yt-chart-axis is-time"
                    x={xAt(originalIndex)}
                    y={H - 7}
                    textAnchor={originalIndex === 0 ? "start" : originalIndex === points.length - 1 ? "end" : "middle"}
                  >
                    {point.displayLabel ?? ""}
                  </text>
                );
              })}

              {activePoint && hoverIndex !== null && (
                <g className="yt-crosshair">
                  <line x1={xAt(hoverIndex)} x2={xAt(hoverIndex)} y1={plot.top} y2={chartBottom} />
                  <line x1={plot.left} x2={W - plot.right} y1={yAt(activePoint.close)} y2={yAt(activePoint.close)} />
                  <circle cx={xAt(hoverIndex)} cy={yAt(activePoint.close)} r="3" />
                  <rect className="yt-crosshair-price-bg" x={W - plot.right + 4} y={yAt(activePoint.close) - 7} width={plot.right - 8} height="14" rx="3" />
                  <text className="yt-crosshair-price" x={W - 5} y={yAt(activePoint.close) + 3} textAnchor="end">
                    {formatPrice(activePoint.close, axisDecimals)}
                  </text>
                </g>
              )}
            </svg>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {!useLightweight && activePoint && hoverIndex !== null && (
            <motion.div
              className="yt-chart-tooltip"
              data-side={(xAt(hoverIndex) / W) * 100 > 72 ? "right" : "center"}
              style={{
                left: `${Math.min(94, Math.max(6, (xAt(hoverIndex) / W) * 100))}%`,
                top: `${Math.max(7, (yAt(activePoint.high) / H) * 100 - 8)}%`,
              }}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.04 : motionTokens.duration.micro }}
            >
              <strong>{activePoint.displayLabel ?? "Selected interval"}</strong>
              <span>O {activePoint.open.toFixed(2)}</span>
              <span>H {activePoint.high.toFixed(2)}</span>
              <span>L {activePoint.low.toFixed(2)}</span>
              <span>C {activePoint.close.toFixed(2)}</span>
              <span className="yt-chart-tooltip-volume">Vol {Math.round(activePoint.volume).toLocaleString()}</span>
              {activePoint.derived && <small className="yt-chart-tooltip-derived">Simulated interval</small>}
              {activeIsDomainClipped && <small className="yt-chart-tooltip-note">Extreme range clipped on axis</small>}
            </motion.div>
          )}
        </AnimatePresence>

        {!useLightweight && (priceDomain.clippedHigh || priceDomain.clippedLow) && points.length > 0 && (
          <div className="yt-chart-domain-note" role="status">Extreme candle range clipped to preserve readable scale</div>
        )}

        {!useLightweight && (
          <div className="yt-chart-legend" aria-hidden="true">
            {showIndicators && <span><i className="is-fast" />MA 8</span>}
            {showIndicators && <span><i className="is-slow" />MA 21</span>}
            {showComparison && <span><i className="is-compare" />Benchmark demo</span>}
          </div>
        )}
        <div className="yt-chart-density-note" aria-hidden="true">
          {hasDerivedPoints ? "Simulated · " : "Historical Demo · "}{sourcePoints.length} fixture anchors · {points.length} intervals
        </div>
        {!points.length && (
          <div className="yt-chart-empty"><BarChart3 aria-hidden="true" />Historical series unavailable</div>
        )}
      </div>
    </motion.section>
  );
}
