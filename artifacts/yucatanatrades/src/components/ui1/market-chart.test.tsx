import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
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
});
