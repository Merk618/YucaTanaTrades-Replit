import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { AppRouter } from "../App";
import {
  publicSiteNavigation,
} from "../components/public/public-site-shell";
import PublicLandingPage from "./public-landing";

vi.mock("../auth/auth-provider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ state: { kind: "guest" } }),
}));

function renderLanding(): string {
  return renderToStaticMarkup(
    <Router ssrPath="/">
      <PublicLandingPage />
    </Router>,
  );
}

function renderPublicAppRoot(): string {
  return renderToStaticMarkup(
    <Router ssrPath="/">
      <AppRouter />
    </Router>,
  );
}

function textContent(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function anchorRecords(markup: string): Array<{ href: string; text: string }> {
  return Array.from(markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g))
    .map((match) => {
      const href = match[1].match(/\shref="([^"]+)"/)?.[1];
      return href ? { href, text: textContent(match[2]) } : null;
    })
    .filter((record): record is { href: string; text: string } => record !== null);
}

describe("UI-2.4 public experience contract", () => {
  it("renders the canonical public landmarks, sections, and editorial headings", () => {
    const markup = renderLanding();
    const text = textContent(markup);

    expect(markup).toContain("<header");
    expect(markup).toContain('<main id="public-main"');
    expect(markup).toContain("<footer");
    expect(markup).toContain('href="#public-main"');

    for (const id of [
      "platform",
      "intelligence",
      "risk",
      "research",
      "ai-intelligence",
      "product-preview",
      "trust",
    ]) {
      expect(markup).toContain(`id="${id}"`);
    }

    for (const heading of [
      "Begin with the whole decision field—not another feed.",
      "Structure that explains the setup—not decoration around it.",
      "Risk becomes useful when it is connected to the decision.",
      "Build the evidence trail before the conclusion.",
      "A synthesis layer that keeps its limits visible.",
      "One operating system. Seven analytical workspaces.",
      "The state of the information is part of the information.",
      "Enter the market with more context—and fewer assumptions.",
    ]) {
      expect(text).toContain(heading);
    }

    expect(text).toContain("Market intelligence,");
    expect(text).toContain("organized around the");
    expect(text).toContain("next decision.");
  });

  it("keeps the public root outside the authenticated shell", () => {
    const markup = renderPublicAppRoot();

    expect(markup).toContain('class="yt-public-root yt24-root"');
    expect(markup).not.toContain('class="yt-app"');
    expect(markup).not.toContain("yt-topbar");
    expect(markup).not.toContain("yt-icon-rail");
    expect(markup).not.toContain('data-scroll-owner="authenticated-route"');
    expect(markup).not.toContain("Global utilities");
    expect(markup).not.toContain("Account session");
  });

  it("contains a deliberate multi-section narrative beyond the opening hero", () => {
    const markup = renderLanding();
    const sectionCount = Array.from(markup.matchAll(/<section\b/g)).length;
    const footerPosition = markup.indexOf("<footer");
    const lastSectionPosition = markup.lastIndexOf("<section");

    expect(sectionCount).toBeGreaterThanOrEqual(7);
    expect(lastSectionPosition).toBeGreaterThan(markup.indexOf("<main"));
    expect(footerPosition).toBeGreaterThan(lastSectionPosition);
    expect(markup).toContain('id="trust"');
  });

  it("keeps the exact public navigation contract and real anchor destinations", () => {
    expect(publicSiteNavigation).toEqual([
      { label: "Platform", href: "#platform" },
      { label: "Intelligence", href: "#intelligence" },
      { label: "Product preview", href: "#product-preview" },
      { label: "Research", href: "#research" },
      { label: "Risk", href: "#risk" },
    ]);

    const markup = renderLanding();
    for (const item of publicSiteNavigation) {
      expect(markup).toContain(`href="${item.href}"`);
      expect(textContent(markup)).toContain(item.label);
    }
  });

  it("routes every Meridian entry action to the canonical sign-in route", () => {
    const entryLabels = new Set([
      "Sign in",
      "Open Meridian OS",
      "Enter Meridian OS",
      "Open the authenticated workspace",
    ]);
    const entryActions = anchorRecords(renderLanding()).filter(({ text }) =>
      entryLabels.has(text)
    );

    expect(entryActions.length).toBeGreaterThan(0);
    expect(entryActions.every(({ href }) => href === "/sign-in")).toBe(true);
  });

  it("offers all seven approved workspace previews as accessible tabs", () => {
    const tabLabels = Array.from(
      renderLanding().matchAll(
        /<button\b[^>]*role="tab"[^>]*>([\s\S]*?)<\/button>/g,
      ),
      (match) => textContent(match[1]).replace(/^0\d/, "").trim(),
    );

    expect(tabLabels).toEqual([
      "Overview",
      "Markets",
      "Charts",
      "Portfolio",
      "Research",
      "News",
      "AI Hub",
    ]);
  });

  it("keeps every permitted truth state visible in the public story", () => {
    const text = textContent(renderLanding());

    for (const state of [
      "Demo",
      "Historical",
      "Estimated",
      "AI-generated Demo",
      "Provider unavailable",
    ]) {
      expect(text).toContain(state);
    }
  });

  it("contains no placeholder policy links or unsupported product claims", () => {
    const text = textContent(renderLanding());

    expect(text).not.toContain("Privacy · placeholder");
    expect(text).not.toContain("Terms · placeholder");
    expect(text).toContain("Research intelligence, not trade execution");

    for (const unsupportedClaim of [
      "Live market data",
      "Live quotes",
      "Live trading",
      "Start trading",
      "Trade now",
      "Execute trades",
      "Connected brokerage",
      "Connect your brokerage",
      "Brokerage integration active",
      "Paid tier",
      "Premium tier",
      "Premium membership",
      "Upgrade to Pro",
    ]) {
      expect(text.toLowerCase()).not.toContain(unsupportedClaim.toLowerCase());
    }
  });
});
