import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Route, Router, Switch } from "wouter";
import {
  footerUtilityRoutes,
  moreWorkspaceRoutes,
  navigableUtilityRoutes,
  primaryWorkspaceRoutes,
  protectedRoutePaths,
  railUtilityRoutes,
  utilityAvailabilityForSession,
  utilityRoutes,
  workspaceRoutes,
} from "./workspace-navigation.ts";
import { sanitizeReturnTo } from "../auth/return-to.ts";

function renderRegisteredRoute(path: string): string {
  return renderToStaticMarkup(
    <Router ssrPath={path}>
      <Switch>
        {protectedRoutePaths.map((registeredPath) => (
          <Route key={registeredPath} path={registeredPath}>
            <span data-route={registeredPath}>matched</span>
          </Route>
        ))}
        <Route>
          <span data-route="not-found">not found</span>
        </Route>
      </Switch>
    </Router>,
  );
}

describe("Meridian workspace navigation registry", () => {
  it("keeps the seven approved primary workspaces in one exact order", () => {
    expect(workspaceRoutes.map((route) => route.label)).toEqual([
      "Overview",
      "Markets",
      "Charts",
      "Portfolio",
      "Research",
      "News",
      "AI Hub",
    ]);
    expect(primaryWorkspaceRoutes.map((route) => route.label)).toEqual([
      "Overview",
      "Markets",
      "Charts",
      "Portfolio",
      "Research",
    ]);
    expect(moreWorkspaceRoutes.map((route) => route.label)).toEqual([
      "News",
      "AI Hub",
    ]);
  });

  it("registers each rail and footer control as a real, unique destination", () => {
    expect(railUtilityRoutes.map((route) => route.label)).toEqual([
      "Ask Meridian",
      "Scan",
      "Watchlist",
      "Alerts",
      "Journal",
      "Calendar",
    ]);
    expect(footerUtilityRoutes.map((route) => route.label)).toEqual([
      "Settings",
      "Help",
    ]);

    const ids = utilityRoutes.map((route) => route.id);
    const paths = utilityRoutes.map((route) => route.href);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("does not duplicate a primary workspace in the utility rail", () => {
    const primaryPaths = new Set<string>(
      workspaceRoutes.map((route) => route.href),
    );
    expect(
      navigableUtilityRoutes.filter((route) => primaryPaths.has(route.href)),
    ).toEqual([]);
  });

  it("gives every deferred destination honest status and recovery metadata", () => {
    const deferred = utilityRoutes.filter(
      (route) => route.access === "deferred",
    );
    expect(deferred.map((route) => route.label)).toEqual([
      "Ask Meridian",
      "Alerts",
      "Calendar",
      "Help",
    ]);
    for (const route of deferred) {
      expect(route.status).toBe("Deferred");
      expect(route.description).toMatch(/No |not |deferred|not been/i);
      expect(route.recoveryHref).toBe("/overview");
    }
  });

  it("keeps Review Access inside normal route rules without granting persistence", () => {
    for (const route of utilityRoutes) {
      const availability = utilityAvailabilityForSession(
        route,
        "development_review",
      );
      if (route.access === "persistent_user") {
        expect(availability).toBe("persistent_user_required");
      } else if (route.access === "deferred") {
        expect(availability).toBe("deferred");
      } else {
        expect(availability).toBe("available");
      }
    }
  });

  it("matches every registered route and alias in the same SSR router", () => {
    for (const path of protectedRoutePaths) {
      const markup = renderRegisteredRoute(path);
      expect(markup).toContain(`data-route="${path}"`);
      expect(markup).not.toContain('data-route="not-found"');
      expect(sanitizeReturnTo(path)).toBe(path);
    }
  });

  it("fails an unknown protected route closed to the branded not-found branch", () => {
    expect(renderRegisteredRoute("/unregistered-workspace")).toContain(
      'data-route="not-found"',
    );
    expect(sanitizeReturnTo("/unregistered-workspace")).toBe("/overview");
  });
});
