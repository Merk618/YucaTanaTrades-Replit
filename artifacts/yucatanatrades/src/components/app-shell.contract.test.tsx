import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { AppShell } from "./app-shell";

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

describe("Meridian authenticated shell contract", () => {
  it("renders exactly one stable, focusable workspace scroll owner", () => {
    const markup = renderToStaticMarkup(
      <Router ssrPath="/overview">
        <AppShell>
          <section aria-label="Route contract content">route content</section>
        </AppShell>
      </Router>,
    );

    expect(
      markup.match(/data-scroll-owner="authenticated-route"/g),
    ).toHaveLength(1);
    expect(markup).toContain(
      '<main class="yt-route-frame" tabindex="-1" data-scroll-owner="authenticated-route"',
    );
    expect(markup).toContain('class="yt-route-content"');
    expect(markup).toContain('aria-label="Route contract content"');
  });

  it("keeps primary workspaces out of the utility rail", () => {
    const markup = renderToStaticMarkup(
      <Router ssrPath="/overview">
        <AppShell>content</AppShell>
      </Router>,
    );
    const rail = markup.match(
      /<nav class="yt-rail-routes">([\s\S]*?)<\/nav>/,
    )?.[1];

    expect(rail).toBeTruthy();
    for (const label of [
      "Overview",
      "Markets",
      "Charts",
      "Portfolio",
      "Research",
      "News",
      "AI Hub",
    ]) {
      expect(rail).not.toContain(`aria-label="${label}"`);
    }
  });

  it("renders the approved compact utility dock without sparse route links", () => {
    const markup = renderToStaticMarkup(
      <Router ssrPath="/overview">
        <AppShell>content</AppShell>
      </Router>,
    );

    for (const control of [
      "scan",
      "watchlist",
      "alerts",
      "settings",
      "help",
      "account",
    ]) {
      expect(markup).toContain(`data-utility-dock-control="${control}"`);
    }

    for (const hiddenControl of [
      "ask-meridian",
      "journal",
      "calendar",
    ]) {
      expect(markup).not.toContain(
        `data-utility-dock-control="${hiddenControl}"`,
      );
    }

    for (const surfaceControl of ["scan", "watchlist", "alerts"]) {
      const button = markup.match(
        new RegExp(
          `<button[^>]*data-utility-dock-control="${surfaceControl}"[^>]*>`,
        ),
      )?.[0];
      expect(button).toBeTruthy();
      expect(button).toContain('aria-pressed="false"');
    }
    expect(markup).toContain(
      'data-utility-dock-control="settings"',
    );
    expect(markup).toContain('href="/settings"');
  });

  it("keeps alerts and account/session controls in the utility architecture, not the desktop top bar", () => {
    const markup = renderToStaticMarkup(
      <Router ssrPath="/overview">
        <AppShell>content</AppShell>
      </Router>,
    );
    const topbar = markup.match(
      /<header[^>]*class="yt-topbar"[^>]*>([\s\S]*?)<\/header>/,
    )?.[1];
    const rail = markup.match(
      /<aside[^>]*aria-label="Global utilities"[^>]*>([\s\S]*?)<\/aside>/,
    )?.[1];

    expect(topbar).toBeTruthy();
    expect(topbar).not.toContain("Notifications unavailable");
    expect(topbar).not.toContain("yt-notification-control");
    expect(topbar).not.toContain("yt-account-control");
    expect(rail).toContain('aria-label="Alerts"');
    expect(rail).toContain("Visual Review · Local development session");
  });

  it("keeps canonical workspace chrome active for compatible deep-link aliases", () => {
    const aiMarkup = renderToStaticMarkup(
      <Router ssrPath="/ai-hub">
        <AppShell>AI alias route</AppShell>
      </Router>,
    );
    expect(aiMarkup).toContain("yt-topnav-more is-active");
    expect(aiMarkup).toContain('data-route="ai-hub"');

    const marketsMarkup = renderToStaticMarkup(
      <Router ssrPath="/markets/stocks">
        <AppShell>Markets alias route</AppShell>
      </Router>,
    );
    const activeMarketsLink = marketsMarkup.match(
      /<a[^>]*aria-current="page"[^>]*href="\/markets"[^>]*>/,
    )?.[0];
    expect(activeMarketsLink).toContain('class="is-active"');
    expect(marketsMarkup).toContain('data-route="markets"');
  });
});
