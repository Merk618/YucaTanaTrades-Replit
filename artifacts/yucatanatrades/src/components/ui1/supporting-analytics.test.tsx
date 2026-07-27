import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupportingAnalytics } from "./supporting-analytics.tsx";

const markup = renderToStaticMarkup(
  <SupportingAnalytics
    breadth={{
      advancing: 62,
      declining: 28,
      unchanged: 10,
      stateLabel: "Demo",
    }}
    heatmap={[
      { sector: "Technology", changePercent: 1.2, weight: 1 },
    ]}
    watchlist={{
      stateLabel: "Demo",
      items: [
        { symbol: "SPX", company: "S&P 500", price: "5,278.40", changePercent: 0.82 },
      ],
    }}
  />,
);

describe("SupportingAnalytics Market Breadth", () => {
  it("keeps the accessible label on the untransformed donut shell", () => {
    expect(markup).toContain(
      'aria-label="62% advancing, 28% declining, 10% unchanged, demo data"',
    );
    expect(markup).toContain('class="yt-breadth-donut"');
    expect(markup).toContain('style="transform:none"');
  });

  it("keeps the upright center overlay outside the rotated arc geometry", () => {
    const rotatedGroupStart = markup.indexOf('class="yt-breadth-ring-arcs"');
    const rotatedGroupEnd = markup.indexOf("</g>", rotatedGroupStart);
    const centerStart = markup.indexOf('class="yt-breadth-center"');

    expect(rotatedGroupStart).toBeGreaterThan(-1);
    expect(rotatedGroupEnd).toBeGreaterThan(rotatedGroupStart);
    expect(centerStart).toBeGreaterThan(rotatedGroupEnd);

    const centerMarkup = markup.slice(centerStart, markup.indexOf("</span>", centerStart));
    expect(centerMarkup).toContain('aria-hidden="true"');
    expect(centerMarkup).toContain('style="transform:none"');
    expect(centerMarkup).not.toContain("rotate");
    expect(centerMarkup).toContain("<strong>62%</strong>");
    expect(centerMarkup).toContain("<small>advancing</small>");
  });

  it("rotates only the SVG arc group and exposes all three proportions", () => {
    expect(markup).toContain('transform="rotate(-90 52 52)"');
    expect(markup).toContain('stroke-dasharray="62 38"');
    expect(markup).toContain('stroke-dasharray="28 72"');
    expect(markup).toContain('stroke-dasharray="10 90"');
  });
});
