import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardDemo } from "@/data/ui1-demo";

const authFixture = vi.hoisted(() => ({
  displayName: "Visual Review" as string | null,
}));

vi.mock("@/auth/auth-provider", () => ({
  useAuth: () => ({
    state: {
      kind: "authenticated",
      user: {
        displayName: authFixture.displayName,
      },
    },
  }),
}));

import {
  AtmosphericHero,
  overviewDayPeriod,
  overviewGreeting,
  safeOverviewDisplayName,
} from "./atmospheric-hero";

afterEach(() => {
  authFixture.displayName = "Visual Review";
  vi.useRealTimers();
});

describe("Overview personalized briefing", () => {
  it("selects the time-aware day period at each boundary", () => {
    expect(overviewDayPeriod(0)).toBe("morning");
    expect(overviewDayPeriod(11)).toBe("morning");
    expect(overviewDayPeriod(12)).toBe("afternoon");
    expect(overviewDayPeriod(17)).toBe("afternoon");
    expect(overviewDayPeriod(18)).toBe("evening");
    expect(overviewDayPeriod(23)).toBe("evening");
  });

  it("uses only the normalized session display name and falls back safely", () => {
    expect(safeOverviewDisplayName("  Visual\u200B   Review  ")).toBe("Visual Review");
    expect(safeOverviewDisplayName(null)).toBe("Trader");
    expect(safeOverviewDisplayName(" \n\t ")).toBe("Trader");
    expect(safeOverviewDisplayName("x".repeat(49))).toBe("Trader");
    expect(overviewGreeting(undefined, 14)).toBe("Good afternoon, Trader.");
  });

  it("renders the authenticated Review Access identity without using the demo greeting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 26, 14, 0, 0));

    const markup = renderToStaticMarkup(
      <AtmosphericHero data={dashboardDemo.briefing} />,
    );

    expect(markup).toContain("Good afternoon, Visual Review.");
    expect(markup).not.toContain(dashboardDemo.briefing.greeting);
    expect(markup).toContain('data-personalization="session-profile"');
    expect(markup).toContain("yt-hero-greeting-word");
  });

  it("renders the Trader fallback when the profile contract has no safe display name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 26, 19, 0, 0));
    authFixture.displayName = null;

    const markup = renderToStaticMarkup(
      <AtmosphericHero data={dashboardDemo.briefing} />,
    );

    expect(markup).toContain("Good evening, Trader.");
    expect(markup).toContain('data-personalization="fallback"');
  });
});
