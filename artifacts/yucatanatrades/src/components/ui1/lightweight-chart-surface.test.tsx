import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { IChartApi, Time } from "lightweight-charts";

import type { MeridianChartSeries } from "@/contracts/chart";
import {
  adaptMeridianChartSeries,
  isoTimestampToChartTime,
} from "./lightweight-chart-adapter";
import {
  createMeridianChartController,
  LightweightChartSurface,
  resolveActiveChartCandle,
  type LightweightChartRuntimeDependencies,
} from "./lightweight-chart-surface";

function makeSeries(
  symbol = "SPX",
  startTimestamp = "2026-07-10T13:30:00.000Z",
): MeridianChartSeries {
  const start = Date.parse(startTimestamp);
  const candles = Array.from({ length: 24 }, (_, index) => {
    const open = 100 + index;
    const close = open + (index % 2 === 0 ? 0.75 : -0.4);
    return {
      timestamp: new Date(start + index * 60_000).toISOString(),
      displayLabel: `9:${String(30 + index).padStart(2, "0")} AM`,
      open,
      high: Math.max(open, close) + 1,
      low: Math.min(open, close) - 1,
      close,
      volume: 1_000 + index * 25,
    };
  });

  return {
    symbol,
    timeframe: "1D",
    timeZone: "America/New_York",
    currency: "USD",
    truthState: "demo",
    provenance: {
      state: "demo",
      provider: "Meridian deterministic fixture",
      sourceType: "fixture",
      generatedAt: "2026-07-10T20:00:00.000Z",
      marketAt: "2026-07-10T20:00:00.000Z",
      freshness: "unknown",
      cacheState: "none",
    },
    candles,
  };
}

function createSeriesDouble() {
  let visible = true;
  const pane = { setHeight: vi.fn() };
  return {
    setData: vi.fn(),
    applyOptions: vi.fn((options: { visible?: boolean }) => {
      if (options.visible !== undefined) visible = options.visible;
    }),
    options: vi.fn(() => ({ visible })),
    getPane: vi.fn(() => pane),
    pane,
  };
}

function createHarness(
  options: { failSeriesIndex?: number; throwOnObserve?: boolean } = {},
) {
  const containerShape = {
    clientWidth: 960,
    clientHeight: 420,
    dataset: {} as Record<string, string>,
  };
  const container = containerShape as unknown as HTMLElement;
  const series = Array.from({ length: 5 }, createSeriesDouble);
  let seriesIndex = 0;
  const crosshairHandlers = new Set<(event: { time?: Time }) => void>();
  const rangeHandlers = new Set<(range: { from: number; to: number } | null) => void>();
  const visibilityHandlers = new Set<EventListenerOrEventListenerObject>();

  const timeScale = {
    fitContent: vi.fn(),
    subscribeVisibleLogicalRangeChange: vi.fn(
      (handler: (range: { from: number; to: number } | null) => void) => {
        rangeHandlers.add(handler);
      },
    ),
    unsubscribeVisibleLogicalRangeChange: vi.fn(
      (handler: (range: { from: number; to: number } | null) => void) => {
        rangeHandlers.delete(handler);
      },
    ),
  };
  const chart = {
    addSeries: vi.fn(() => {
      if (seriesIndex === options.failSeriesIndex) {
        throw new Error("series construction failed");
      }
      return series[seriesIndex++];
    }),
    timeScale: vi.fn(() => timeScale),
    resize: vi.fn(),
    applyOptions: vi.fn(),
    subscribeCrosshairMove: vi.fn((handler: (event: { time?: Time }) => void) => {
      crosshairHandlers.add(handler);
    }),
    unsubscribeCrosshairMove: vi.fn((handler: (event: { time?: Time }) => void) => {
      crosshairHandlers.delete(handler);
    }),
    remove: vi.fn(),
  };
  const createChart = vi.fn(() => chart as unknown as IChartApi);

  let resizeCallback: ResizeObserverCallback | null = null;
  const observe = vi.fn(() => {
    if (options.throwOnObserve) throw new Error("observer setup failed");
  });
  const disconnect = vi.fn();
  class ResizeObserverDouble {
    constructor(callback: ResizeObserverCallback) {
      resizeCallback = callback;
    }
    observe = observe;
    disconnect = disconnect;
  }

  let nextFrame = 1;
  const frames = new Map<number, FrameRequestCallback>();
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  const cancelAnimationFrame = vi.fn((id: number) => {
    frames.delete(id);
  });
  const flushFrames = () => {
    const queued = [...frames.entries()];
    frames.clear();
    queued.forEach(([, callback]) => callback(0));
  };

  let visibilityState: DocumentVisibilityState = "visible";
  const visibilityDocument = {
    get visibilityState() {
      return visibilityState;
    },
    addEventListener: vi.fn(
      (_type: "visibilitychange", listener: EventListenerOrEventListenerObject) => {
        visibilityHandlers.add(listener);
      },
    ),
    removeEventListener: vi.fn(
      (_type: "visibilitychange", listener: EventListenerOrEventListenerObject) => {
        visibilityHandlers.delete(listener);
      },
    ),
  };
  const dispatchVisibility = (state: DocumentVisibilityState) => {
    visibilityState = state;
    const event = new Event("visibilitychange");
    visibilityHandlers.forEach((listener) => {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    });
  };

  const dependencies = {
    createChart,
    ResizeObserver: ResizeObserverDouble,
    requestAnimationFrame,
    cancelAnimationFrame,
    visibilityDocument,
  } as unknown as LightweightChartRuntimeDependencies;

  return {
    container,
    containerShape,
    chart,
    series,
    timeScale,
    createChart,
    ResizeObserver: ResizeObserverDouble,
    observe,
    disconnect,
    resize: (width: number, height: number) => {
      resizeCallback?.([
        {
          target: container,
          contentRect: { width, height },
        } as unknown as ResizeObserverEntry,
      ], {} as ResizeObserver);
    },
    flushFrames,
    frames,
    requestAnimationFrame,
    cancelAnimationFrame,
    crosshairHandlers,
    rangeHandlers,
    visibilityDocument,
    visibilityHandlers,
    dispatchVisibility,
  };
}

describe("Meridian Lightweight Charts surface", () => {
  it("retains semantic chart context and visible TradingView attribution", () => {
    const markup = renderToStaticMarkup(
      <LightweightChartSurface series={makeSeries()} />,
    );

    expect(markup).toContain("SPX 1D analytical candlestick chart");
    expect(markup).toContain("24 demo intervals");
    expect(markup).toContain("Latest 9:53 AM");
    expect(markup).toContain("TradingView Lightweight Charts™");
    expect(markup).toContain(
      "Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/",
    );
    expect(markup).toContain('href="https://www.tradingview.com/"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("ignores an inspection that belongs to the prior series", () => {
    const prior = makeSeries("SPX");
    const current = makeSeries("NVDA");
    const priorLatest = prior.candles.at(-1)!;
    const currentLatest = current.candles.at(-1)!;

    expect(
      resolveActiveChartCandle(
        current,
        { candle: priorLatest, series: prior },
        currentLatest,
      ),
    ).toBe(currentLatest);
  });

  it("contains invalid input in an unavailable state", () => {
    const series = makeSeries();
    const invalid = {
      ...series,
      candles: [
        {
          ...series.candles[0],
          timestamp: "not-an-instant",
        },
      ],
    } satisfies MeridianChartSeries;
    const markup = renderToStaticMarkup(
      <LightweightChartSurface series={invalid} />,
    );

    expect(markup).toContain("Chart unavailable");
    expect(markup).toContain("Chart data could not be validated");
    expect(markup).not.toContain("not-an-instant");
  });
});

describe("Meridian Lightweight Charts lifecycle", () => {
  it("creates one chart and stable series while replacing symbol data", () => {
    const harness = createHarness();
    const inspected = vi.fn();
    const controller = createMeridianChartController(harness.container, {
      reducedMotion: true,
      onInspect: inspected,
      dependencies: harness as unknown as LightweightChartRuntimeDependencies,
    });
    const first = makeSeries();
    const second = makeSeries("NVDA", "2026-07-11T13:30:00.000Z");

    expect(harness.createChart).toHaveBeenCalledTimes(1);
    const chartOptions = (
      harness.createChart.mock.calls[0] as unknown[] | undefined
    )?.[1];
    expect(chartOptions).toMatchObject({
      kineticScroll: { mouse: false, touch: false },
    });
    expect(harness.chart.addSeries).toHaveBeenCalledTimes(5);
    expect((harness.chart.addSeries.mock.calls as unknown[][]).map((call) => call[2])).toEqual([
      0, 1, 0, 0, 0,
    ]);
    expect(harness.crosshairHandlers.size).toBe(1);
    expect(harness.rangeHandlers.size).toBe(1);
    expect(harness.visibilityHandlers.size).toBe(1);
    expect(harness.observe).toHaveBeenCalledWith(harness.container);

    controller.update({
      series: first,
      showIndicators: true,
      showComparison: true,
    });
    const firstAdapted = adaptMeridianChartSeries(first);
    expect(harness.series[0].setData).toHaveBeenLastCalledWith(firstAdapted.candles);
    expect(harness.series[1].setData.mock.calls.at(-1)?.[0]).toHaveLength(24);
    expect(harness.series[2].setData).toHaveBeenLastCalledWith(firstAdapted.ma8);
    expect(harness.series[3].setData).toHaveBeenLastCalledWith(firstAdapted.ma21);
    expect(harness.series[4].setData.mock.calls.at(-1)?.[0]).toHaveLength(24);
    expect(inspected).toHaveBeenLastCalledWith(first.candles.at(-1), first);

    controller.update({
      series: second,
      showIndicators: false,
      showComparison: false,
    });
    const secondAdapted = adaptMeridianChartSeries(second);
    expect(harness.createChart).toHaveBeenCalledTimes(1);
    expect(harness.chart.addSeries).toHaveBeenCalledTimes(5);
    expect(harness.series[0].setData).toHaveBeenLastCalledWith(secondAdapted.candles);
    expect(harness.series[2].setData).toHaveBeenLastCalledWith([]);
    expect(harness.series[3].setData).toHaveBeenLastCalledWith([]);
    expect(harness.series[4].setData).toHaveBeenLastCalledWith([]);
    expect(harness.series[2].applyOptions).toHaveBeenLastCalledWith({ visible: false });
    expect(harness.series[4].applyOptions).toHaveBeenLastCalledWith({ visible: false });

    const crosshair = [...harness.crosshairHandlers][0];
    crosshair?.({ time: isoTimestampToChartTime(first.candles[0].timestamp) });
    expect(inspected).toHaveBeenLastCalledWith(null, second);
    crosshair?.({ time: isoTimestampToChartTime(second.candles[0].timestamp) });
    expect(inspected).toHaveBeenLastCalledWith(second.candles[0], second);
  });

  it("omits comparison data when the baseline close is zero", () => {
    const harness = createHarness();
    const controller = createMeridianChartController(harness.container, {
      dependencies: harness as unknown as LightweightChartRuntimeDependencies,
    });
    const zeroBaseline = makeSeries();
    zeroBaseline.candles[0] = {
      ...zeroBaseline.candles[0]!,
      open: 0,
      high: 1,
      low: 0,
      close: 0,
    };

    controller.update({
      series: zeroBaseline,
      showIndicators: true,
      showComparison: true,
    });

    expect(harness.series[4].setData).toHaveBeenLastCalledWith([]);
    controller.destroy();
  });

  it("removes a chart when series construction fails", () => {
    const harness = createHarness({ failSeriesIndex: 2 });

    expect(() =>
      createMeridianChartController(harness.container, {
        dependencies: harness as unknown as LightweightChartRuntimeDependencies,
      }),
    ).toThrow("series construction failed");
    expect(harness.chart.remove).toHaveBeenCalledTimes(1);
    expect(harness.crosshairHandlers.size).toBe(0);
    expect(harness.visibilityHandlers.size).toBe(0);
  });

  it("rolls back registered resources when observer setup fails", () => {
    const harness = createHarness({ throwOnObserve: true });

    expect(() =>
      createMeridianChartController(harness.container, {
        dependencies: harness as unknown as LightweightChartRuntimeDependencies,
      }),
    ).toThrow("observer setup failed");
    expect(harness.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.chart.unsubscribeCrosshairMove).toHaveBeenCalledTimes(1);
    expect(harness.timeScale.unsubscribeVisibleLogicalRangeChange).toHaveBeenCalledTimes(1);
    expect(harness.visibilityDocument.removeEventListener).toHaveBeenCalledTimes(1);
    expect(harness.crosshairHandlers.size).toBe(0);
    expect(harness.rangeHandlers.size).toBe(0);
    expect(harness.visibilityHandlers.size).toBe(0);
    expect(harness.chart.remove).toHaveBeenCalledTimes(1);
  });

  it("coalesces resizing and reconciles after the document becomes visible", () => {
    const harness = createHarness();
    const controller = createMeridianChartController(harness.container, {
      dependencies: harness as unknown as LightweightChartRuntimeDependencies,
    });
    controller.update({
      series: makeSeries(),
      showIndicators: true,
      showComparison: false,
    });

    harness.resize(900, 440);
    harness.resize(640, 360);
    expect(harness.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(harness.chart.resize).not.toHaveBeenCalled();
    harness.flushFrames();
    expect(harness.chart.resize).toHaveBeenLastCalledWith(640, 360);
    expect(harness.series[1].pane.setHeight).toHaveBeenCalled();

    const range = [...harness.rangeHandlers][0];
    range?.({ from: 0, to: 20 });
    expect(harness.containerShape.dataset.chartRange).toBe("visible");
    range?.(null);
    expect(harness.containerShape.dataset.chartRange).toBe("empty");

    harness.containerShape.clientWidth = 720;
    harness.containerShape.clientHeight = 380;
    harness.dispatchVisibility("hidden");
    expect(harness.frames.size).toBe(0);
    harness.dispatchVisibility("visible");
    expect(harness.frames.size).toBe(1);
    harness.flushFrames();
    expect(harness.chart.resize).toHaveBeenLastCalledWith(720, 380);
    expect(harness.timeScale.fitContent).toHaveBeenCalled();

    controller.destroy();
  });

  it("removes every observer, listener, frame, and chart exactly once", () => {
    const harness = createHarness();
    const inspected = vi.fn();
    const controller = createMeridianChartController(harness.container, {
      onInspect: inspected,
      dependencies: harness as unknown as LightweightChartRuntimeDependencies,
    });
    controller.update({
      series: makeSeries(),
      showIndicators: true,
      showComparison: false,
    });
    harness.resize(700, 360);

    controller.destroy();
    controller.destroy();
    controller.reconcile();
    controller.update({
      series: makeSeries("AAPL"),
      showIndicators: false,
      showComparison: true,
    });

    expect(harness.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(harness.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.chart.unsubscribeCrosshairMove).toHaveBeenCalledTimes(1);
    expect(harness.timeScale.unsubscribeVisibleLogicalRangeChange).toHaveBeenCalledTimes(1);
    expect(harness.visibilityDocument.removeEventListener).toHaveBeenCalledTimes(1);
    expect(harness.crosshairHandlers.size).toBe(0);
    expect(harness.rangeHandlers.size).toBe(0);
    expect(harness.visibilityHandlers.size).toBe(0);
    expect(inspected).toHaveBeenLastCalledWith(null, null);
    expect(harness.chart.remove).toHaveBeenCalledTimes(1);
    harness.flushFrames();
    expect(harness.chart.resize).not.toHaveBeenCalled();
  });
});