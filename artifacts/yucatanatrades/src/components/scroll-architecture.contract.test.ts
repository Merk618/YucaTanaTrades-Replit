import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("UI-2.4.1 scroll and pointer architecture", () => {
  it("restores public-only document scrolling without relaxing the authenticated body lock", () => {
    const shellCss = source("../ui1.css");
    const publicCss = source("../public-landing.css");

    expect(shellCss).toMatch(/body\s*\{[\s\S]*?overflow:\s*hidden;/);
    expect(publicCss).toMatch(
      /html:has\(\.yt-public-root\),\s*body:has\(\.yt-public-root\)\s*\{[\s\S]*?overflow-y:\s*auto;/,
    );
  });

  it("keeps the stable route frame as the sole authenticated vertical scroll owner", () => {
    const shellCss = source("../ui1.css");
    const shellSource = source("./app-shell.tsx");

    expect(shellCss).toMatch(
      /\.yt-route-frame\s*\{[\s\S]*?overflow-y:\s*auto;/,
    );
    expect(shellCss).toMatch(
      /\.yt-route-content\s*\{[\s\S]*?position:\s*relative;[\s\S]*?overflow:\s*visible;/,
    );
    expect(shellSource).toContain(
      'data-scroll-owner="authenticated-route"',
    );
    expect(shellSource).toContain("routeScrollRef.current?.scrollTo");
    expect(shellSource).toContain("initialRouteRef");
    expect(shellSource).toContain("documentOwnsFocus");
    expect(shellSource).toContain(
      "routeScrollRef.current?.focus({ preventScroll: true })",
    );
  });

  it("does not leave a competing root scroller in implemented utility routes", () => {
    for (const path of [
      "../pages/scanners.tsx",
      "../pages/watchlist.tsx",
      "../pages/journal.tsx",
      "../pages/bots.tsx",
      "../pages/risk.tsx",
    ]) {
      expect(source(path)).not.toContain(
        'className="h-full overflow-y-auto',
      );
    }
  });

  it("keeps full-shell decorative layers out of pointer hit testing", () => {
    const atmosphereCss = source("../meridian-atmosphere.css");
    const transitionCss = source("../auth-entry-transition.css");
    const shellCss = source("../ui1.css");

    expect(atmosphereCss).toMatch(
      /\.yt-meridian-atmosphere\s*\{[\s\S]*?pointer-events:\s*none;/,
    );
    expect(transitionCss).toMatch(
      /\.yt-auth-entry-transition\s*\{[\s\S]*?pointer-events:\s*none;/,
    );
    expect(shellCss).toMatch(
      /\.yt-rail-active\s*\{[\s\S]*?pointer-events:\s*none;/,
    );
  });
});
