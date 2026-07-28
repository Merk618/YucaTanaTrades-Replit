import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { WorkspaceRoutes } from "../App";
import Home from "./home";
import { MarketsRoute } from "./markets-ui2";
import { ChartsRoute } from "./charts-ui2";
import {
  AIHubRoute,
  NewsRoute,
  PortfolioRoute,
  ResearchRoute,
} from "./intelligence-routes-ui2";
import SettingsPage from "./settings";
import {
  utilityRoutes,
  workspaceRoutes,
} from "../navigation/workspace-navigation";

vi.mock("../auth/auth-provider", () => ({
  useAuth: () => ({
    state: {
      kind: "authenticated",
      status: {
        available: true,
        features: {
          registrationEnabled: true,
          passwordResetEnabled: true,
          emailVerificationEnabled: true,
          reviewAccessEnabled: true,
        },
        message: null,
      },
      session: {
        state: "authenticated",
        sessionType: "development_review",
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "review@example.test",
          displayName: "Visual Review",
          emailVerified: true,
        },
        expiresAt: "2026-07-25T18:00:00.000Z",
        csrfToken: "test-csrf-token-test-csrf-token-0001",
      },
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        email: "review@example.test",
        displayName: "Visual Review",
        emailVerified: true,
      },
    },
    signOut: vi.fn(),
    signOutAllDevices: vi.fn(),
  }),
}));

vi.mock("@/pages/scanners", () => ({
  default: () => {
    throw new Error("Persistent-user utility mounted during Review Access");
  },
}));
vi.mock("@/pages/watchlist", () => ({
  default: () => {
    throw new Error("Persistent-user utility mounted during Review Access");
  },
}));
vi.mock("@/pages/journal", () => ({
  default: () => {
    throw new Error("Persistent-user utility mounted during Review Access");
  },
}));
vi.mock("@/pages/bots", () => ({
  default: () => {
    throw new Error("Persistent-user utility mounted during Review Access");
  },
}));
vi.mock("@/pages/risk", () => ({
  default: () => {
    throw new Error("Persistent-user utility mounted during Review Access");
  },
}));

const routeCases = [
  {
    label: "Overview",
    Component: Home,
    landmarks: [
      "Morning Briefing · Demo",
      "S&amp;P 500 Index",
      "Portfolio value",
      "Next actions",
      "Calendar provider unavailable",
    ],
  },
  {
    label: "Markets",
    Component: MarketsRoute,
    landmarks: [
      "Session status",
      "Index overview",
      "Sector leadership",
      "Market breadth",
      "Opportunity watchlist context",
      "No provider or exchange connection is active",
    ],
  },
  {
    label: "Charts",
    Component: ChartsRoute,
    landmarks: [
      "Chart workspace controls",
      "S&amp;P 500 Index",
      "Timeframe",
      "Indicators",
      "Watchlist context",
      "Saved layouts",
      "Entry &amp; risk zones",
    ],
  },
  {
    label: "Portfolio",
    Component: PortfolioRoute,
    landmarks: [
      "Portfolio value",
      "Performance",
      "Asset allocation",
      "Concentration &amp; risk",
      "Demo portfolio",
      "Broker unavailable",
    ],
  },
  {
    label: "Research",
    Component: ResearchRoute,
    landmarks: [
      "Research dossier",
      "Working thesis",
      "Evidence quality",
      "Catalyst timeline",
      "Risk factors",
      "Saved research",
    ],
  },
  {
    label: "News",
    Component: NewsRoute,
    landmarks: [
      "News provider unavailable",
      "Intelligence feed",
      "Impact filter",
      "Sentiment filter",
      "Source &amp; freshness architecture",
      "Provider connection",
    ],
  },
  {
    label: "AI Hub",
    Component: AIHubRoute,
    landmarks: [
      "Prompt library",
      "Meridian conversation",
      "AI-generated Demo",
      "Provider unavailable",
      "Provenance &amp; limitations",
    ],
  },
  {
    label: "Settings",
    Component: SettingsPage,
    landmarks: [
      "Settings scope",
      "Profile &amp; current session",
      "Data providers &amp; health",
      "Display, appearance &amp; motion",
      "Application &amp; integrations",
      "Local development",
    ],
  },
] as const;

describe("authenticated workspace route content", () => {
  for (const { label, Component, landmarks } of routeCases) {
    it(`mounts substantive ${label} landmarks`, () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const markup = renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );

      for (const landmark of landmarks) {
        expect(markup).toContain(landmark);
      }
      expect(markup.length).toBeGreaterThan(2_000);
      if (label === "Overview" || label === "Markets" || label === "Charts") {
        expect(markup).toContain('data-chart-engine="svg"');
      }
      if (label === "Overview" || label === "Markets") {
        expect(markup).not.toContain("TradingView Lightweight Charts™");
      }
    });
  }

  it("renders the real AI Hub workspace through its compatible deep-link alias", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Router ssrPath="/ai-hub">
          <WorkspaceRoutes />
        </Router>
      </QueryClientProvider>,
    );

    expect(markup).toContain("Meridian conversation");
    expect(markup).toContain('data-route="ai-hub"');
    expect(markup).not.toContain("Page not found");
  });

  it("resolves every registered workspace path through the real route switch", () => {
    for (const route of workspaceRoutes) {
      for (const path of [route.href, ...route.aliases]) {
        const queryClient = new QueryClient({
          defaultOptions: { queries: { retry: false } },
        });
        const markup = renderToStaticMarkup(
          <QueryClientProvider client={queryClient}>
            <Router ssrPath={path}>
              <WorkspaceRoutes />
            </Router>
          </QueryClientProvider>,
        );

        expect(markup).not.toContain("Workspace not found");
        expect(markup).toContain(route.label);
        expect(markup.length).toBeGreaterThan(2_000);
      }
    }
  });

  it("resolves every utility through its real Review Access boundary without mounting persistent-user pages", () => {
    for (const route of utilityRoutes) {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const markup = renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <Router ssrPath={route.href}>
            <WorkspaceRoutes />
          </Router>
        </QueryClientProvider>,
      );

      expect(markup).not.toContain("Workspace not found");
      expect(markup).toContain(route.label);
      if (route.classification === "Implemented") {
        expect(markup).toContain("Settings scope");
      } else {
        expect(markup).toContain(route.availableNow);
        expect(markup).toContain("Return to Overview");
      }
    }
  });

  it("renders the real unknown-route recovery surface inside the shell", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Router ssrPath="/unregistered-workspace">
          <WorkspaceRoutes />
        </Router>
      </QueryClientProvider>,
    );

    expect(markup).toContain("Workspace not found");
    expect(markup).toContain("/unregistered-workspace");
    expect(markup).toContain("Return to Overview");
  });
});
