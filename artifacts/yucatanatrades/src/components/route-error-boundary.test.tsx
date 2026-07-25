import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import {
  RouteErrorBoundary,
  RouteFailureSurface,
} from "./route-error-boundary.tsx";

describe("route error recovery", () => {
  it("keeps recovery inside the shell without exposing a stack trace", () => {
    const markup = renderToStaticMarkup(
      <Router ssrPath="/settings">
        <RouteFailureSurface route="/settings" onReload={() => undefined} />
      </Router>,
    );

    expect(markup).toContain("/settings");
    expect(markup).toContain("Return to Overview");
    expect(markup).toContain("Reload route");
    expect(markup).not.toContain("componentStack");
    expect(markup).not.toContain("Error:");
  });

  it("enters its contained fallback state after a child render failure", () => {
    expect(RouteErrorBoundary.getDerivedStateFromError()).toEqual({
      hasError: true,
    });
  });
});
