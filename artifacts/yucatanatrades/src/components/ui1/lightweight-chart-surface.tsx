import * as React from "react";
import { useReducedMotion } from "framer-motion";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  TrackingModeExitMode,
  createChart,
  type IChartApi,
  type LineData,
  type LogicalRange,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import {
  adaptMeridianChartSeries,
} from "@/components/ui1/lightweight-chart-adapter";
import type {
  MeridianChartCandle,
  MeridianChartSeries,
} from "@/contracts/chart";
import "@/meridian-lightweight-chart.css";

const UP_COLOR = "#78b58b";
const DOWN_COLOR = "#dc6b59";
const VOLUME_UP_COLOR = "rgba(111, 171, 137, 0.38)";
const VOLUME_DOWN_COLOR = "rgba(211, 98, 80, 0.32)";

type AdaptedSeries = ReturnType<typeof adaptMeridianChartSeries>;

interface VisibilityDocument {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(
    type: "visibilitychange",
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: "visibilitychange",
    listener: EventListenerOrEventListenerObject,
  ): void;
}

interface ResizeObserverLike {
  observe(target: Element): void;
  disconnect(): void;
}

type ResizeObserverConstructor = new (
  callback: ResizeObserverCallback,
) => ResizeObserverLike;

export interface LightweightChartRuntimeDependencies {
  createChart?: typeof createChart;
  ResizeObserver?: ResizeObserverConstructor | null;
  requestAnimationFrame?: typeof requestAnimationFrame | null;
  cancelAnimationFrame?: typeof cancelAnimationFrame | null;
  visibilityDocument?: VisibilityDocument | null;
}

export interface MeridianChartControllerUpdate {
  series: MeridianChartSeries;
  showIndicators: boolean;
  showComparison: boolean;
}

export interface MeridianChartController {
  update(update: MeridianChartControllerUpdate): void;
  reconcile(): void;
  destroy(): void;
}

interface CreateControllerOptions {
  reducedMotion?: boolean;
  onInspect?: (
    candle: MeridianChartCandle | null,
    series: MeridianChartSeries | null,
  ) => void;
  dependencies?: LightweightChartRuntimeDependencies;
}

function containerSize(container: HTMLElement) {
  const width = Math.max(1, Math.round(container.clientWidth || 1));
  const height = Math.max(1, Math.round(container.clientHeight || 1));
  return { width, height };
}

function formatChartTime(time: Time, timeZone: string): string {
  if (typeof time !== "number") {
    return typeof time === "string"
      ? time
      : `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(time * 1_000));
}

function comparisonData(adapted: AdaptedSeries): LineData<UTCTimestamp>[] {
  const firstClose = adapted.candles[0]?.close;
  if (firstClose === undefined || firstClose === 0) return [];

  return adapted.candles.map((candle, index) => {
    const relativeReturn = candle.close / firstClose - 1;
    return {
      time: candle.time,
      value:
        firstClose *
        (1 + relativeReturn * 0.78 + Math.sin(index * 0.19) * 0.0024),
    };
  });
}

function candleAtTime(
  adapted: AdaptedSeries | null,
  event: MouseEventParams<Time>,
): MeridianChartCandle | null {
  if (!adapted || typeof event.time !== "number") return null;
  return adapted.candleByTime.get(event.time as UTCTimestamp) ?? null;
}

/**
 * Owns every imperative Lightweight Charts resource for one mounted surface.
 * Data changes flow through update(); the chart instance and its series remain
 * stable until destroy() performs one complete, idempotent teardown.
 */
export function createMeridianChartController(
  container: HTMLElement,
  {
    reducedMotion = false,
    onInspect,
    dependencies = {},
  }: CreateControllerOptions = {},
): MeridianChartController {
  const createChartInstance = dependencies.createChart ?? createChart;
  const ResizeObserverImpl =
    dependencies.ResizeObserver === undefined
      ? typeof ResizeObserver === "undefined"
        ? null
        : ResizeObserver
      : dependencies.ResizeObserver;
  const requestFrame =
    dependencies.requestAnimationFrame === undefined
      ? typeof requestAnimationFrame === "undefined"
        ? null
        : requestAnimationFrame
      : dependencies.requestAnimationFrame;
  const cancelFrame =
    dependencies.cancelAnimationFrame === undefined
      ? typeof cancelAnimationFrame === "undefined"
        ? null
        : cancelAnimationFrame
      : dependencies.cancelAnimationFrame;
  const visibilityDocument =
    dependencies.visibilityDocument === undefined
      ? typeof document === "undefined"
        ? null
        : document
      : dependencies.visibilityDocument;

  const initialSize = containerSize(container);
  const chart: IChartApi = createChartInstance(container, {
    width: initialSize.width,
    height: initialSize.height,
    autoSize: false,
    layout: {
      background: { type: ColorType.Solid, color: "rgba(2, 17, 24, 0)" },
      textColor: "rgba(160, 184, 186, 0.7)",
      fontFamily:
        '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 10,
      attributionLogo: false,
      panes: {
        enableResize: false,
        separatorColor: "rgba(111, 154, 158, 0.12)",
        separatorHoverColor: "rgba(211, 190, 139, 0.2)",
      },
    },
    grid: {
      vertLines: { color: "rgba(82, 129, 138, 0.09)" },
      horzLines: { color: "rgba(101, 147, 153, 0.12)" },
    },
    rightPriceScale: {
      visible: true,
      borderVisible: false,
      ticksVisible: false,
      minimumWidth: 58,
      scaleMargins: { top: 0.08, bottom: 0.08 },
    },
    leftPriceScale: { visible: false },
    timeScale: {
      rightOffset: 5,
      barSpacing: 7,
      minBarSpacing: 2.25,
      maxBarSpacing: 16,
      borderVisible: false,
      ticksVisible: false,
      timeVisible: true,
      secondsVisible: false,
      rightBarStaysOnScroll: true,
      lockVisibleTimeRangeOnResize: true,
      shiftVisibleRangeOnNewBar: false,
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: "rgba(222, 230, 225, 0.32)",
        style: LineStyle.Dashed,
        width: 1,
        labelBackgroundColor: "#173740",
      },
      horzLine: {
        color: "rgba(222, 230, 225, 0.27)",
        style: LineStyle.Dashed,
        width: 1,
        labelBackgroundColor: "#173740",
      },
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: false,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: true,
      pinch: false,
      axisPressedMouseMove: false,
      axisDoubleClickReset: true,
    },
    kineticScroll: { mouse: !reducedMotion, touch: false },
    trackingMode: { exitMode: TrackingModeExitMode.OnTouchEnd },
  });

  const chartResources = (() => {
    try {
      const candles = chart.addSeries(
    CandlestickSeries,
    {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: "rgba(155, 212, 169, 0.56)",
      borderDownColor: "rgba(239, 132, 111, 0.5)",
      wickUpColor: "#75aa82",
      wickDownColor: "#cf6253",
      priceLineVisible: true,
      priceLineColor: "rgba(224, 203, 148, 0.52)",
      priceLineStyle: LineStyle.Dashed,
      lastValueVisible: true,
    },
    0,
  );
  const volume = chart.addSeries(
    HistogramSeries,
    {
      color: VOLUME_UP_COLOR,
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      lastValueVisible: false,
    },
    1,
  );
  const ma8 = chart.addSeries(
    LineSeries,
    {
      color: "#d7ba70",
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    },
    0,
  );
  const ma21 = chart.addSeries(
    LineSeries,
    {
      color: "#5f9f81",
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    },
    0,
  );
  const comparison = chart.addSeries(
    LineSeries,
    {
      color: "rgba(99, 174, 184, 0.76)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    },
    0,
  );

      const timeScale = chart.timeScale();
      return { candles, volume, ma8, ma21, comparison, timeScale };
    } catch (error) {
      chart.remove();
      throw error;
    }
  })();
  const { candles, volume, ma8, ma21, comparison, timeScale } = chartResources;
  let active: AdaptedSeries | null = null;
  let activeSource: MeridianChartSeries | null = null;
  let destroyed = false;
  let pendingFrame: number | null = null;
  let pendingSize = initialSize;

  const fitVolumePane = (height: number) => {
    const compact = height < 320;
    const target = Math.max(52, Math.min(compact ? 72 : 96, Math.round(height * 0.2)));
    volume.getPane().setHeight(target);
  };

  const commitResize = () => {
    if (destroyed) return;
    chart.resize(pendingSize.width, pendingSize.height);
    fitVolumePane(pendingSize.height);
  };

  const scheduleResize = (width: number, height: number) => {
    pendingSize = {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    };
    if (!requestFrame) {
      commitResize();
      return;
    }
    if (pendingFrame !== null) return;
    pendingFrame = requestFrame(() => {
      pendingFrame = null;
      commitResize();
    });
  };

  const applyData = (adapted: AdaptedSeries, showIndicators: boolean, showComparison: boolean) => {
    candles.setData(adapted.candles);
    volume.setData(
      adapted.volume.map((point, index) => ({
        ...point,
        color:
          adapted.candles[index]?.close >= adapted.candles[index]?.open
            ? VOLUME_UP_COLOR
            : VOLUME_DOWN_COLOR,
      })),
    );
    ma8.setData(showIndicators ? adapted.ma8 : []);
    ma21.setData(showIndicators ? adapted.ma21 : []);
    comparison.setData(showComparison ? comparisonData(adapted) : []);
  };

  const handleCrosshair = (event: MouseEventParams<Time>) => {
    if (destroyed) return;
    onInspect?.(candleAtTime(active, event), activeSource);
  };
  const handleVisibleRange = (range: LogicalRange | null) => {
    if (destroyed) return;
    container.dataset.chartRange = range ? "visible" : "empty";
  };
  const handleVisibilityChange: EventListener = () => {
    if (
      destroyed ||
      !visibilityDocument ||
      visibilityDocument.visibilityState !== "visible"
    ) {
      return;
    }
    if (active) {
      applyData(
        active,
        ma8.options().visible,
        comparison.options().visible,
      );
    }
    const size = containerSize(container);
    scheduleResize(size.width, size.height);
    timeScale.fitContent();
  };

  let crosshairSubscribed = false;
  let rangeSubscribed = false;
  let visibilitySubscribed = false;
  let resizeObserver: ResizeObserverLike | null = null;
  try {
    chart.subscribeCrosshairMove(handleCrosshair);
    crosshairSubscribed = true;
    timeScale.subscribeVisibleLogicalRangeChange(handleVisibleRange);
    rangeSubscribed = true;
    visibilityDocument?.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );
    visibilitySubscribed = Boolean(visibilityDocument);

    resizeObserver = ResizeObserverImpl
      ? new ResizeObserverImpl((entries) => {
          const entry = entries.find((candidate) => candidate.target === container);
          if (!entry) return;
          scheduleResize(entry.contentRect.width, entry.contentRect.height);
        })
      : null;
    resizeObserver?.observe(container);
    fitVolumePane(initialSize.height);
  } catch (error) {
    if (pendingFrame !== null && cancelFrame) cancelFrame(pendingFrame);
    pendingFrame = null;
    resizeObserver?.disconnect();
    if (crosshairSubscribed) chart.unsubscribeCrosshairMove(handleCrosshair);
    if (rangeSubscribed) {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleRange);
    }
    if (visibilitySubscribed) {
      visibilityDocument?.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    }
    chart.remove();
    throw error;
  }

  return {
    update({
      series,
      showIndicators,
      showComparison,
    }: MeridianChartControllerUpdate) {
      if (destroyed) return;
      const adapted = adaptMeridianChartSeries(series);
      active = adapted;
      activeSource = series;

      const timeFormatter = (time: Time) =>
        formatChartTime(time, adapted.metadata.timeZone);
      chart.applyOptions({
        localization: {
          locale: "en-US",
          timeFormatter,
        },
        timeScale: {
          tickMarkFormatter: (time: Time) => timeFormatter(time),
        },
      });
      ma8.applyOptions({ visible: showIndicators });
      ma21.applyOptions({ visible: showIndicators });
      comparison.applyOptions({ visible: showComparison });
      applyData(adapted, showIndicators, showComparison);
      timeScale.fitContent();
      onInspect?.(adapted.latest, series);
    },
    reconcile() {
      if (destroyed) return;
      if (active) {
        applyData(
          active,
          ma8.options().visible,
          comparison.options().visible,
        );
      }
      const size = containerSize(container);
      scheduleResize(size.width, size.height);
      timeScale.fitContent();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (pendingFrame !== null && cancelFrame) {
        cancelFrame(pendingFrame);
      }
      pendingFrame = null;
      resizeObserver?.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshair);
      timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleRange);
      visibilityDocument?.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      active = null;
      activeSource = null;
      onInspect?.(null, null);
      chart.remove();
    },
  };
}

export interface LightweightChartSurfaceProps {
  series: MeridianChartSeries;
  showIndicators?: boolean;
  showComparison?: boolean;
  className?: string;
}

export interface MeridianChartInspection {
  series: MeridianChartSeries;
  candle: MeridianChartCandle;
}

export function resolveActiveChartCandle(
  currentSeries: MeridianChartSeries,
  inspected: MeridianChartInspection | null,
  latest: MeridianChartCandle | null,
): MeridianChartCandle | null {
  return inspected?.series === currentSeries ? inspected.candle : latest;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: Math.min(2, maximumFractionDigits),
  });
}

function formatVolume(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function readableTruthState(value: MeridianChartSeries["truthState"]) {
  return value.replace("-", " ");
}

function candleLabel(candle: MeridianChartCandle, timeZone: string) {
  if (candle.displayLabel) return candle.displayLabel;
  return formatChartTime(
    Math.floor(Date.parse(candle.timestamp) / 1_000) as UTCTimestamp,
    timeZone,
  );
}

export function LightweightChartSurface({
  series,
  showIndicators = true,
  showComparison = false,
  className,
}: LightweightChartSurfaceProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const instanceId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `yt-lwc-title-${instanceId}`;
  const summaryId = `yt-lwc-summary-${instanceId}`;
  const controllerRef = React.useRef<MeridianChartController | null>(null);
  const plotRef = React.useRef<HTMLDivElement | null>(null);
  const [runtimeError, setRuntimeError] = React.useState<string | null>(null);
  const [inspected, setInspected] =
    React.useState<MeridianChartInspection | null>(null);
  const handleInspect = React.useCallback(
    (
      candle: MeridianChartCandle | null,
      inspectedSeries: MeridianChartSeries | null,
    ) => {
      setInspected(
        candle && inspectedSeries
          ? { candle, series: inspectedSeries }
          : null,
      );
    },
    [],
  );

  const adaptation = React.useMemo(() => {
    try {
      return { value: adaptMeridianChartSeries(series), error: null };
    } catch {
      return {
        value: null,
        error: "Chart data could not be validated.",
      };
    }
  }, [series]);

  const hasValidatedData = Boolean(
    adaptation.value && adaptation.value.candles.length > 0,
  );

  React.useEffect(() => {
    const container = plotRef.current;
    if (!container || !hasValidatedData) return undefined;

    try {
      controllerRef.current = createMeridianChartController(container, {
        reducedMotion,
        onInspect: handleInspect,
      });
    } catch {
      setRuntimeError("The analytical chart is temporarily unavailable.");
    }

    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [handleInspect, hasValidatedData, reducedMotion]);

  React.useEffect(() => {
    if (!adaptation.value) {
      setRuntimeError(adaptation.error);
      setInspected(null);
      return;
    }
    if (!adaptation.value.candles.length) {
      setRuntimeError(null);
      setInspected(null);
      return;
    }

    const controller = controllerRef.current;
    if (!controller) return;

    try {
      controller.update({
        series,
        showIndicators,
        showComparison,
      });
      setRuntimeError(null);
    } catch {
      setRuntimeError("The analytical chart is temporarily unavailable.");
      setInspected(null);
    }
  }, [
    adaptation.error,
    adaptation.value,
    series,
    showComparison,
    showIndicators,
  ]);

  const candles = adaptation.value ? series.candles : [];
  const latest = adaptation.value?.latest ?? null;
  const active = resolveActiveChartCandle(series, inspected, latest);
  const [keyboardIndex, setKeyboardIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setKeyboardIndex(null);
  }, [series.symbol, series.timeframe, candles.length]);

  const keyboardInspect = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      !candles.length ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    let next = keyboardIndex ?? candles.length - 1;
    if (event.key === "ArrowLeft") next = Math.max(0, next - 1);
    if (event.key === "ArrowRight") {
      next = Math.min(candles.length - 1, next + 1);
    }
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = candles.length - 1;
    setKeyboardIndex(next);
    const candle = candles[next];
    setInspected(candle ? { candle, series } : null);
  };

  const sourceLabel =
    series.provenance.provider ??
    (series.provenance.sourceType === "fixture"
      ? "Deterministic fixture"
      : series.provenance.sourceType);
  const hasData = candles.length > 0;
  const statusMessage = runtimeError ?? adaptation.error;

  return (
    <div
      className={[
        "yt-lwc-surface",
        className,
        reducedMotion ? "is-reduced-motion" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-chart-engine="lightweight-charts"
      data-chart-status={
        statusMessage ? "unavailable" : hasData ? "ready" : "empty"
      }
      data-truth-state={series.truthState}
      aria-labelledby={titleId}
      aria-describedby={summaryId}
    >
      <h3 id={titleId} className="yt-lwc-visually-hidden">
        {series.symbol} {series.timeframe} analytical candlestick chart
      </h3>
      <p id={summaryId} className="yt-lwc-visually-hidden">
        {hasData && latest
          ? `${candles.length} ${readableTruthState(series.truthState)} intervals. Latest ${candleLabel(latest, series.timeZone)}: open ${formatNumber(latest.open)}, high ${formatNumber(latest.high)}, low ${formatNumber(latest.low)}, close ${formatNumber(latest.close)}, volume ${formatVolume(latest.volume)}. Source: ${sourceLabel}.`
          : `No validated ${series.symbol} ${series.timeframe} chart intervals are available. Source: ${sourceLabel}.`}
      </p>

      <div
        ref={plotRef}
        className="yt-lwc-plot"
        role="group"
        tabIndex={hasData ? 0 : -1}
        aria-label={
          hasData
            ? `${series.symbol} ${series.timeframe} chart. Use Left and Right Arrow keys to inspect intervals; Home and End move to the first and latest interval.`
            : `${series.symbol} ${series.timeframe} chart unavailable`
        }
        onKeyDown={keyboardInspect}
        onBlur={() => {
          setKeyboardIndex(null);
          setInspected(latest ? { candle: latest, series } : null);
        }}
      />

      {statusMessage ? (
        <div className="yt-lwc-state" role="status">
          <strong>Chart unavailable</strong>
          <span>{statusMessage}</span>
        </div>
      ) : !hasData ? (
        <div className="yt-lwc-state" role="status">
          <strong>Historical series unavailable</strong>
          <span>No validated intervals were supplied.</span>
        </div>
      ) : active ? (
        <div className="yt-lwc-readout" aria-hidden="true">
          <strong>{candleLabel(active, series.timeZone)}</strong>
          <span><small>O</small>{formatNumber(active.open)}</span>
          <span><small>H</small>{formatNumber(active.high)}</span>
          <span><small>L</small>{formatNumber(active.low)}</span>
          <span><small>C</small>{formatNumber(active.close)}</span>
          <span className="yt-lwc-readout-volume">
            <small>VOL</small>{formatVolume(active.volume)}
          </span>
        </div>
      ) : null}

      <p className="yt-lwc-visually-hidden" aria-live="polite">
        {keyboardIndex !== null && active
          ? `${candleLabel(active, series.timeZone)}. Open ${formatNumber(active.open)}, high ${formatNumber(active.high)}, low ${formatNumber(active.low)}, close ${formatNumber(active.close)}, volume ${formatVolume(active.volume)}.`
          : ""}
      </p>

      <div className="yt-lwc-footer">
        <span>
          {showIndicators ? "MA 8 · MA 21" : "Indicators hidden"}
          {showComparison ? " · Benchmark Demo" : ""}
        </span>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TradingView Lightweight Charts attribution; opens in a new tab"
        >
          <span>TradingView Lightweight Charts™</span>
          <small>Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/</small>
        </a>
      </div>
    </div>
  );
}
