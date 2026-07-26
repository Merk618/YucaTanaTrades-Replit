import { useEffect, useRef } from "react";
import { ProductEnvironmentPreview } from "../components/public/product-environment-preview";
import { PublicHero } from "../components/public/public-hero";
import {
  AiIntelligenceSection,
  MorningIntelligenceSection,
  PortfolioRiskSection,
  ResearchIntelligenceSection,
  TechnicalIntelligenceSection,
  TrustAndConversionSections,
} from "../components/public/public-story-sections";
import {
  PublicSiteFooter,
  PublicSiteHeader,
} from "../components/public/public-site-shell";
import "../public-landing.css";
import "../public-experience-ui24.css";

function usePublicMotionSystem(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.querySelector<HTMLElement>(".yt24-hero");
    if (!root || !hero) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 981px)",
    );
    let heroVisible = true;
    let frame: number | null = null;
    let latestX = 0;
    let latestY = 0;

    const flushPointer = () => {
      frame = null;
      root.style.setProperty("--yt24-pointer-x", latestX.toFixed(4));
      root.style.setProperty("--yt24-pointer-y", latestY.toFixed(4));
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        reducedMotionQuery.matches ||
        !finePointerQuery.matches ||
        !heroVisible
      ) {
        return;
      }

      const bounds = hero.getBoundingClientRect();
      latestX = (event.clientX - bounds.left) / bounds.width - 0.5;
      latestY = (event.clientY - bounds.top) / bounds.height - 0.5;
      if (frame === null) frame = window.requestAnimationFrame(flushPointer);
    };

    const resetPointer = () => {
      root.style.setProperty("--yt24-pointer-x", "0");
      root.style.setProperty("--yt24-pointer-y", "0");
    };

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry?.isIntersecting ?? false;
        if (!heroVisible) resetPointer();
      },
      { threshold: 0.04 },
    );

    const handlePreferenceChange = () => resetPointer();
    const handleVisibilityChange = () => {
      root.classList.toggle("yt24-motion-paused", document.hidden);
      root.classList.toggle("yt-public-motion-paused", document.hidden);
    };

    heroObserver.observe(hero);
    hero.addEventListener("pointermove", handlePointerMove, { passive: true });
    hero.addEventListener("pointerleave", resetPointer);
    reducedMotionQuery.addEventListener("change", handlePreferenceChange);
    finePointerQuery.addEventListener("change", handlePreferenceChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      heroObserver.disconnect();
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetPointer);
      reducedMotionQuery.removeEventListener("change", handlePreferenceChange);
      finePointerQuery.removeEventListener("change", handlePreferenceChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.classList.remove("yt24-motion-paused", "yt-public-motion-paused");
      root.style.removeProperty("--yt24-pointer-x");
      root.style.removeProperty("--yt24-pointer-y");
    };
  }, [rootRef]);
}

export default function PublicLandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePublicMotionSystem(rootRef);

  return (
    <div ref={rootRef} className="yt-public-root yt24-root">
      <a className="yt-public-skip yt24-skip-link" href="#public-main">
        Skip to main content
      </a>

      <PublicSiteHeader />

      <main id="public-main" tabIndex={-1}>
        <PublicHero />
        <MorningIntelligenceSection />
        <TechnicalIntelligenceSection />
        <PortfolioRiskSection />
        <ResearchIntelligenceSection />
        <AiIntelligenceSection />
        <ProductEnvironmentPreview />
        <TrustAndConversionSections />
      </main>

      <PublicSiteFooter />
    </div>
  );
}
