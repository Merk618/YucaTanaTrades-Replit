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
  timeframes: {
    "1D": [
      {
        time: "9:30 AM",
        open: 5_270,
        high: 5_282,
        low: 5_266,
        close: 5_278,
        volume: 100,
      },
      {
        time: "4:00 PM",
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
