import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  compactUtilitySurfaceIds,
  isCompactUtilitySurfaceId,
  UtilityPanelBody,
  type CompactUtilitySurfaceId,
} from "./utility-dock-surfaces";

function renderSurface(
  surface: CompactUtilitySurfaceId,
  reviewSession = true,
) {
  return renderToStaticMarkup(
    <UtilityPanelBody
      surface={surface}
      reviewSession={reviewSession}
      onClose={vi.fn()}
      onNavigate={vi.fn()}
    />,
  );
}

describe("Meridian compact utility surfaces", () => {
  it("registers exactly the four non-route dock surfaces", () => {
    expect(compactUtilitySurfaceIds).toEqual([
      "scan",
      "watchlist",
      "alerts",
      "help",
    ]);
    for (const id of compactUtilitySurfaceIds) {
      expect(isCompactUtilitySurfaceId(id)).toBe(true);
    }
    expect(isCompactUtilitySurfaceId("settings")).toBe(false);
    expect(isCompactUtilitySurfaceId("journal")).toBe(false);
  });

  it("renders Scan as a Review Access boundary with fixed Demo context", () => {
    const markup = renderSurface("scan");

    expect(markup).toContain('data-utility-surface="scan"');
    expect(markup).toContain("Review Access boundary");
    expect(markup).toContain("Persistent-user scanning is unavailable");
    expect(markup).toContain("Fixed Demo context");
    expect(markup).toContain("Not scan results");
    expect(markup).toContain("No market-data, scanner, or persistent-user request is made");
    expect(markup).not.toContain("Open scanner workspace");
  });

  it("renders Watchlist as truthful local Demo rows rather than saved user data", () => {
    const markup = renderSurface("watchlist");

    expect(markup).toContain('data-utility-surface="watchlist"');
    expect(markup).toContain("Local Demo · not saved");
    expect(markup).toContain("Review Access has no owned watchlist");
    expect(markup).toContain("Historical Demo");
    for (const symbol of ["AAPL", "MSFT", "AMZN", "TSLA"]) {
      expect(markup).toContain(symbol);
    }
    expect(markup).not.toContain("saved successfully");
  });

  it("renders Alerts as a compact unavailable capability center", () => {
    const markup = renderSurface("alerts");

    expect(markup).toContain('data-utility-surface="alerts"');
    expect(markup).toContain("Notification center");
    expect(markup).toContain("No alert events are shown");
    expect(markup).toContain("No background market monitor is active");
    expect(markup).toContain("Review Access does not load persistent alert definitions");
    expect(markup).toContain("Review notification settings");
  });

  it("renders Help as compact local guidance with honest support state", () => {
    const markup = renderSurface("help");

    expect(markup).toContain('data-utility-surface="help"');
    expect(markup).toContain("Workspace navigator");
    expect(markup).toContain("Truth labels");
    expect(markup).toContain("Review sessions");
    expect(markup).toContain("Keyboard access");
    expect(markup).toContain("Documentation provider deferred");
    expect(markup).toContain("Escape closes this panel");
  });

  it("offers the full persistent scanner and watchlist routes only outside Review Access", () => {
    expect(renderSurface("scan", false)).toContain("Open scanner workspace");
    expect(renderSurface("watchlist", false)).toContain(
      "Open watchlist workspace",
    );
  });
});
