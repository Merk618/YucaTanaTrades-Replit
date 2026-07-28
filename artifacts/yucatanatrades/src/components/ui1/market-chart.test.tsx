import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  chartCandleTarget,
  MarketChart,
  type ChartWorkspaceView,
} from "./market-chart.tsx";

const fixture: ChartWorkspaceView = {
  symbol: "SPX",
  name: "S&P 500 Index",
  displayValue: "5,278.40",
  changePercent: 0.82,
  asOf: "Historical demo",
  stateLabel: "Historical · Demo",
  timeZone: "America/New_York",
  currency: "USD",
  truthState: "historical",
  provenance: {
    state: "historical",
    provider: "Meridian deterministic fixture",
    sourceType: "fixture",
    generatedAt: "2026-07-10T20:00:00.000Z",
    marketAt: "2026-07-10T20:00:00.000Z",
    freshness: "unknown",
    cacheState: "none",
  },
  timeframes: {
    "1D": [
      {
        timestamp: "2026-07-10T13:30:00.000Z",
        displayLabel: "9:30 AM",
        open: 5_270,
        high: 5_282,
        low: 5_266,
        close: 5_278,
        volume: 100,
      },
      {
        timestamp: "2026-07-10T20:00:00.000Z",
        displayLabel: "4:00 PM",
        open: 5_278,
        high: 5_286,
        low: 5_274,
        close: 5_281,
        volume: 120,
      },
    ],
  },
};

describe("MarketChart SVG identity", () => {
  it("generates unique SVG and heading ids for coexisting chart instances", () => {
    const markup = renderToStaticMarkup(
      <>
        <MarketChart data={fixture} routeMode />
        <MarketChart data={fixture} routeMode />
      </>,
    );
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const urlTargets = [...markup.matchAll(/url\(#([^)]+)\)/g)].map(
      (match) => match[1],
    );

    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ids).size).toBe(ids.length);
    expect(urlTargets.length).toBeGreaterThanOrEqual(4);
    for (const target of urlTargets) {
      expect(ids).toContain(target);
    }
    expect(markup).not.toContain('id="yt-volume-fill"');
    expect(markup).not.toContain('id="yt-line-glow"');
  });

  it("matches the viewBox to the rendered chart surface instead of stretching SVG labels", () => {
    const markup = renderToStaticMarkup(<MarketChart data={fixture} />);

    expect(markup).toContain('data-chart-scope="overview"');
    expect(markup).toContain('data-render-width="960"');
    expect(markup).toContain('data-render-height="204"');
    expect(markup).toContain('viewBox="0 0 960 204"');
    expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(markup).toContain("visible deterministic intervals with volume, moving averages");
    expect(markup).toContain('vector-effect="non-scaling-stroke"');
    expect(markup).toContain('data-chart-engine="svg"');
  });

  it("enables the V2 plot only through the explicit route engine seam", () => {
    const routeMarkup = renderToStaticMarkup(
      <MarketChart data={fixture} routeMode plotEngine="lightweight" />,
    );
    const overviewMarkup = renderToStaticMarkup(
      <MarketChart data={fixture} plotEngine="lightweight" />,
    );

    expect(routeMarkup).toContain('data-chart-engine="lightweight"');
    expect(routeMarkup).toContain("Preparing analytical chart");
    expect(routeMarkup).toContain("Historical · Demo");
    expect(routeMarkup).toContain("Chart controls");
    expect(routeMarkup).toContain("simulated intervals");
    expect(overviewMarkup).toContain('data-chart-engine="svg"');
    expect(overviewMarkup).not.toContain("Charts by TradingView");
  });

  it("keeps empty and invalid V2 data inside Meridian states without mounting a chart", () => {
    const empty = {
      ...fixture,
      timeframes: { "1D": [] },
    } satisfies ChartWorkspaceView;
    const invalid = {
      ...fixture,
      timeframes: {
        "1D": [
          {
            ...fixture.timeframes["1D"][0],
            timestamp: "not-an-instant",
          },
        ],
      },
    } satisfies ChartWorkspaceView;

    const emptyMarkup = renderToStaticMarkup(
      <MarketChart data={empty} routeMode plotEngine="lightweight" />,
    );
    const invalidMarkup = renderToStaticMarkup(
      <MarketChart data={invalid} routeMode plotEngine="lightweight" />,
    );

    expect(emptyMarkup).toContain("Historical series unavailable");
    expect(emptyMarkup).not.toContain('data-chart-engine="lightweight-charts"');
    expect(invalidMarkup).toContain("Preparing analytical chart");
    expect(invalidMarkup).not.toContain("not-an-instant");
  });
});

describe("MarketChart responsive candle density", () => {
  it("keeps Overview density readable at mobile, desktop, and large desktop widths", () => {
    expect(chartCandleTarget(320, false)).toBe(44);
    expect(chartCandleTarget(430, false)).toBe(60);
    expect(chartCandleTarget(768, false)).toBe(96);
    expect(chartCandleTarget(960, false)).toBe(117);
    expect(chartCandleTarget(1_100, false)).toBe(128);
    expect(chartCandleTarget(1_200, false)).toBe(141);
    expect(chartCandleTarget(1_600, false)).toBe(148);
  });

  it("allows the dedicated Charts route to remain more expansive", () => {
    expect(chartCandleTarget(960, true)).toBe(137);
    expect(chartCandleTarget(1_600, true)).toBe(168);
  });
});
