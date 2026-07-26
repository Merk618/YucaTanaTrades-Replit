import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import {
  utilityRoutes,
  type UtilityRoute,
} from "../navigation/workspace-navigation";
import { UtilityStatusRoute } from "./utility-status-route";

function renderBoundary(
  route: UtilityRoute,
  reason:
    | "deferred"
    | "provider_unavailable"
    | "persistent_user_required",
) {
  return renderToStaticMarkup(
    <Router ssrPath={route.href}>
      <UtilityStatusRoute route={route} reason={reason} />
    </Router>,
  );
}

describe("utility capability boundary routes", () => {
  it("renders meaningful deferred-state identity, reason, future support, and recovery", () => {
    for (const route of utilityRoutes.filter(
      (candidate) => candidate.access === "deferred",
    )) {
      const markup = renderBoundary(route, "deferred");
      expect(markup).toContain(route.label);
      expect(markup).toContain(route.title);
      expect(markup).toContain(route.description);
      expect(markup).toContain(route.availableNow);
      expect(markup).toContain(route.futureCapability);
      expect(markup).toContain("What remains available");
      expect(markup).toContain("Return to Overview");
      expect(markup).toContain(route.alternativeLabel);
      expect(markup).toContain(`href="${route.alternativeHref}"`);
      expect(markup).not.toMatch(/Loading quotes|Loading positions|Loading data/);
    }
  });

  it("renders provider-unavailable states with provider class, state, configuration, and local behavior", () => {
    for (const route of utilityRoutes.filter(
      (candidate) => candidate.access === "provider_unavailable",
    )) {
      const markup = renderBoundary(route, "provider_unavailable");
      expect(markup).toContain("Provider unavailable");
      expect(markup).toContain(route.providerClass);
      expect(markup).toContain(route.providerState);
      expect(markup).toContain(
        route.configurationLocation.replaceAll("&", "&amp;"),
      );
      expect(markup).toContain(route.availableNow);
      expect(markup).toContain("No provider request");
      expect(markup).toContain("Return to Overview");
    }
  });

  it("renders Review Access restrictions without mounting persistent utility data", () => {
    for (const route of utilityRoutes.filter(
      (candidate) => candidate.access === "persistent_user",
    )) {
      const markup = renderBoundary(route, "persistent_user_required");
      expect(markup).toContain("Review Access restricted");
      expect(markup).toContain("Local review · persistence none");
      expect(markup).toContain("What remains available");
      expect(markup).toContain(route.availableNow);
      expect(markup).toContain(route.futureCapability);
      expect(markup).toContain(route.alternativeLabel);
      expect(markup).not.toMatch(/Loading quotes|Loading positions|Loading data/);
    }
  });
});
