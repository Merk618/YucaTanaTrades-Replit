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

export interface ChartCandleView {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartWorkspaceView {
  symbol: string;
  name: string;
  displayValue: string;
  changePercent: number;
  asOf: string;
  stateLabel: string;
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

export function MarketChart({
  data,
  routeMode = false,
}: {
  data: ChartWorkspaceView;
  routeMode?: boolean;
}) {
  const timeframes = Object.keys(data.timeframes);
  const [timeframe, setTimeframe] = React.useState(timeframes[0] ?? "1D");
  const [showIndicators, setShowIndicators] = React.useState(true);
  const [showComparison, setShowComparison] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const frameRef = React.useRef<number | null>(null);
  const pendingIndexRef = React.useRef<number | null>(null);

  React.useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const points = data.timeframes[timeframe] ?? data.timeframes[timeframes[0] ?? ""] ?? [];
  const W = 960;
  const H = expanded ? 720 : routeMode ? 420 : 204;
  const plot = { left: 10, right: 62, top: 17, bottom: 28 };
  const chartBottom = H - plot.bottom;
  const priceBottom = chartBottom - 28;
  const priceDomain = calculateVisiblePriceDomain(points, 0.07);
  const paddedMin = priceDomain.min;
  const paddedMax = priceDomain.max;
  const paddedRange = Math.max(Number.EPSILON, paddedMax - paddedMin);
  const axisDecimals = paddedRange < 10 ? 2 : paddedRange < 100 ? 1 : 0;
  const maxVolume = Math.max(...points.map((point) => point.volume), 1);
  const step = points.length > 1 ? (W - plot.left - plot.right) / (points.length - 1) : 0;
  const candleWidth = Math.max(3.1, Math.min(8.2, step * 0.62));
  const xAt = (index: number) => plot.left + step * index;
  const yAt = (value: number) => {
    const projected = plot.top + ((paddedMax - value) / paddedRange) * (priceBottom - plot.top);
    return Math.max(plot.top, Math.min(priceBottom, projected));
  };
  const maFast = movingAverage(points, 8);
  const maSlow = movingAverage(points, 21);
  const compare = points.map((point, index) => {
    const normalized = points[0] ? point.close / points[0].close : 1;
    return paddedMin + paddedRange * (0.31 + normalized * 0.26 + Math.sin(index * 0.32) * 0.025);
  });
  const activePoint = hoverIndex === null ? null : points[hoverIndex];
  const activeIsDomainClipped = Boolean(
    activePoint && (activePoint.high > paddedMax || activePoint.low < paddedMin),
  );

  const updateHover = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!points.length) return;
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

  return (
    <motion.section
      className={`yt-chart-workspace ${routeMode ? "is-route" : ""} ${expanded ? "is-expanded" : ""}`}
      aria-labelledby={routeMode ? "yt-route-chart-title" : "yt-dashboard-chart-title"}
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
                <strong id="yt-route-chart-title">{data.name}</strong>
                <small>{data.symbol}</small>
              </span>
            </div>
          ) : (
            <button className="yt-symbol-select" type="button" aria-label="Select symbol, preview fixed to S&P 500">
              <span>
                <strong id="yt-dashboard-chart-title">{data.name}</strong>
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
                onClick={() => setTimeframe(label)}
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
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={expanded ? "Exit expanded chart" : "Expand chart"}
            aria-pressed={expanded}
          >
            {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div className="yt-chart-canvas">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={timeframe}
            className="yt-chart-svg-wrap"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
            transition={{ duration: reducedMotion ? 0.06 : motionTokens.duration.interface }}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${data.name} ${timeframe} deterministic historical demo candlestick chart`}
              onPointerMove={updateHover}
              onPointerLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="yt-volume-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8eb9a0" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#8eb9a0" stopOpacity="0.08" />
                </linearGradient>
                <filter id="yt-line-glow" x="-20%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="1.4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {points.length > 0 && Array.from({ length: 5 }).map((_, index) => {
                const y = plot.top + ((priceBottom - plot.top) / 4) * index;
                const labelValue = paddedMax - (paddedRange / 4) * index;
                return (
                  <g key={`y-${index}`}>
                    <line className="yt-chart-grid" x1={plot.left} x2={W - plot.right} y1={y} y2={y} />
                    <text className="yt-chart-axis" x={W - 5} y={y + 3} textAnchor="end">
                      {labelValue.toLocaleString(undefined, { minimumFractionDigits: axisDecimals, maximumFractionDigits: axisDecimals })}
                    </text>
                  </g>
                );
              })}
              {points.length > 0 && Array.from({ length: 7 }).map((_, index) => {
                const x = plot.left + ((W - plot.left - plot.right) / 6) * index;
                return <line key={`x-${index}`} className="yt-chart-grid is-vertical" x1={x} x2={x} y1={plot.top} y2={chartBottom} />;
              })}

              {points.map((point, index) => {
                const x = xAt(index);
                const rising = point.close >= point.open;
                const bodyTop = yAt(Math.max(point.open, point.close));
                const bodyBottom = yAt(Math.min(point.open, point.close));
                const bodyHeight = Math.max(1.3, bodyBottom - bodyTop);
                const volumeHeight = (point.volume / maxVolume) * 24;
                return (
                  <g key={`${timeframe}-${point.time}-${index}`} className={rising ? "is-up" : "is-down"}>
                    <rect
                      className="yt-chart-volume"
                      x={x - candleWidth / 2}
                      y={chartBottom - volumeHeight}
                      width={candleWidth}
                      height={volumeHeight}
                    />
                    <line className="yt-candle-wick" x1={x} x2={x} y1={yAt(point.high)} y2={yAt(point.low)} />
                    <rect
                      className="yt-candle-body"
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      rx="0.8"
                    />
                  </g>
                );
              })}

              {showIndicators && points.length > 0 && (
                <>
                  <path className="yt-ma-line is-fast" d={linePath(maFast, xAt, yAt)} />
                  <path className="yt-ma-line is-slow" d={linePath(maSlow, xAt, yAt)} />
                </>
              )}
              {showComparison && points.length > 0 && (
                <path className="yt-compare-line" d={linePath(compare, xAt, yAt)} />
              )}

              {points.filter((_, index) => index % Math.max(1, Math.ceil(points.length / 6)) === 0).map((point, labelIndex) => {
                const originalIndex = points.indexOf(point);
                return (
                  <text key={`label-${labelIndex}`} className="yt-chart-axis is-time" x={xAt(originalIndex)} y={H - 7} textAnchor={originalIndex === 0 ? "start" : "middle"}>
                    {point.time}
                  </text>
                );
              })}

              {activePoint && hoverIndex !== null && (
                <g className="yt-crosshair">
                  <line x1={xAt(hoverIndex)} x2={xAt(hoverIndex)} y1={plot.top} y2={chartBottom} />
                  <line x1={plot.left} x2={W - plot.right} y1={yAt(activePoint.close)} y2={yAt(activePoint.close)} />
                  <circle cx={xAt(hoverIndex)} cy={yAt(activePoint.close)} r="3" />
                </g>
              )}
            </svg>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {activePoint && hoverIndex !== null && (
            <motion.div
              className="yt-chart-tooltip"
              style={{
                left: `${Math.min(82, Math.max(3, (xAt(hoverIndex) / W) * 100))}%`,
                top: `${Math.max(7, (yAt(activePoint.high) / H) * 100 - 8)}%`,
              }}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.04 : motionTokens.duration.micro }}
            >
              <strong>{activePoint.time}</strong>
              <span>O {activePoint.open.toFixed(2)}</span>
              <span>H {activePoint.high.toFixed(2)}</span>
              <span>L {activePoint.low.toFixed(2)}</span>
              <span>C {activePoint.close.toFixed(2)}</span>
              {activeIsDomainClipped && <small className="yt-chart-tooltip-note">Extreme range clipped on axis</small>}
            </motion.div>
          )}
        </AnimatePresence>

        {(priceDomain.clippedHigh || priceDomain.clippedLow) && points.length > 0 && (
          <div className="yt-chart-domain-note" role="status">Extreme candle range clipped to preserve readable scale</div>
        )}

        <div className="yt-chart-legend" aria-hidden="true">
          <span><i className="is-fast" />MA 8</span>
          <span><i className="is-slow" />MA 21</span>
          {showComparison && <span><i className="is-compare" />Benchmark demo</span>}
        </div>
        {!points.length && (
          <div className="yt-chart-empty"><BarChart3 aria-hidden="true" />Historical series unavailable</div>
        )}
      </div>
    </motion.section>
  );
}
