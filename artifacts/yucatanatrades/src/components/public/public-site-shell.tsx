import * as React from "react";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { BrandMark } from "@/components/app-shell";

export const publicSiteNavigation = [
  { label: "Platform", href: "#platform" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Product preview", href: "#product-preview" },
  { label: "Research", href: "#research" },
  { label: "Risk", href: "#risk" },
] as const;

const mobileNavigationId = "yt-public-ui24-mobile-navigation";

export function PublicSiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const closeMobileNav = React.useCallback((restoreTriggerFocus = false) => {
    setMobileNavOpen(false);
    if (restoreTriggerFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  const selectMobileDestination = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const destinationId = event.currentTarget.hash.slice(1);
      closeMobileNav();
      window.requestAnimationFrame(() => {
        document.getElementById(destinationId)?.focus({ preventScroll: true });
      });
    },
    [closeMobileNav],
  );

  React.useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMobileNav(true);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !headerRef.current?.contains(target)) {
        closeMobileNav();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeMobileNav, mobileNavOpen]);

  React.useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1181px)");
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMobileNav();
    };
    desktopQuery.addEventListener("change", handleDesktopChange);
    return () => desktopQuery.removeEventListener("change", handleDesktopChange);
  }, [closeMobileNav]);

  return (
    <header ref={headerRef} className="yt-public-ui24-header">
      <a
        className="yt-public-ui24-brand"
        href="#public-main"
        aria-label="YucaTanaTrades public home"
      >
        <BrandMark />
        <span>YUCATANATRADES</span>
      </a>

      <nav
        className="yt-public-ui24-desktop-nav"
        aria-label="Public site navigation"
      >
        {publicSiteNavigation.map((item) => (
          <a href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="yt-public-ui24-header-actions">
        <Link
          href="/sign-in"
          className="yt-public-ui24-sign-in"
          aria-label="Sign in to Meridian OS"
          onClick={() => closeMobileNav()}
        >
          Sign in
        </Link>
        <Link
          href="/sign-in"
          className="yt-public-ui24-primary-link"
          onClick={() => closeMobileNav()}
        >
          Open Meridian OS
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <button
        ref={triggerRef}
        type="button"
        className="yt-public-ui24-menu-button yt-public-ui24-mobile-only"
        aria-expanded={mobileNavOpen}
        aria-controls={mobileNavigationId}
        aria-label={mobileNavOpen ? "Close public navigation" : "Open public navigation"}
        onClick={() => setMobileNavOpen((open) => !open)}
      >
        {mobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      <nav
        id={mobileNavigationId}
        className="yt-public-ui24-mobile-nav yt-public-ui24-mobile-only"
        aria-label="Mobile public navigation"
        hidden={!mobileNavOpen}
      >
        {publicSiteNavigation.map((item) => (
          <a
            href={item.href}
            key={item.href}
            onClick={selectMobileDestination}
          >
            <span>{item.label}</span>
            <ChevronRight aria-hidden="true" />
          </a>
        ))}
        <div className="yt-public-ui24-mobile-actions">
          <Link
            href="/sign-in"
            className="yt-public-ui24-sign-in"
            aria-label="Sign in to Meridian OS"
            onClick={() => closeMobileNav()}
          >
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="yt-public-ui24-primary-link"
            onClick={() => closeMobileNav()}
          >
            Open Meridian OS
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="yt-public-ui24-footer">
      <div className="yt-public-ui24-footer-brand">
        <a href="#public-main" aria-label="YucaTanaTrades public home">
          <BrandMark />
          <span>
            <strong>YUCATANATRADES</strong>
            <small>Public market-intelligence experience</small>
          </span>
        </a>
        <p>
          Meridian OS is the authenticated environment for organized market
          research, technical context, portfolio awareness, and risk review.
        </p>
      </div>

      <nav
        className="yt-public-ui24-footer-nav"
        aria-label="Public site footer navigation"
      >
        <a href="#platform">Platform</a>
        <a href="#product-preview">Product preview</a>
        <a href="#research">Research</a>
        <a href="#risk">Risk and provenance</a>
        <Link href="/sign-in">Sign in</Link>
      </nav>

      <div className="yt-public-ui24-footer-status">
        <span>Development preview</span>
        <span>Provider-neutral foundation</span>
        <span>Research intelligence, not trade execution</span>
      </div>

      <Link
        href="/sign-in"
        className="yt-public-ui24-footer-cta"
        aria-label="Open the Meridian OS sign-in page"
      >
        Open Meridian OS
        <ArrowRight aria-hidden="true" />
      </Link>
    </footer>
  );
}
