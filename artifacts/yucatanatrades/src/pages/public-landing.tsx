import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Database,
  Eye,
  FileSearch,
  Fingerprint,
  Gauge,
  Layers3,
  LineChart,
  LockKeyhole,
  Menu,
  Network,
  PieChart,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { BrandMark } from "@/components/app-shell";
import { motionTokens } from "@/lib/motion";
import "@/public-landing.css";

const publicNav = [
  { label: "Platform", href: "#platform" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Markets", href: "#markets" },
  { label: "Research", href: "#research" },
  { label: "Risk", href: "#risk" },
] as const;

const decisionQuestions = [
  { number: "01", question: "What is happening?", detail: "See market structure and the state of every source." },
  { number: "02", question: "Why does it matter?", detail: "Connect movement to risk, research, and portfolio context." },
  { number: "03", question: "What requires attention?", detail: "Prioritize the signals and exposures that deserve review." },
  { number: "04", question: "How confident is the system?", detail: "Keep provenance, freshness, and model state in view." },
] as const;

const pillars = [
  {
    icon: Radar,
    label: "Market intelligence",
    title: "Structure before noise",
    body: "A composed market workspace for regime, breadth, volatility, and source-aware context. Current samples remain clearly marked Demo or Historical.",
  },
  {
    icon: LineChart,
    label: "Chart analysis",
    title: "A disciplined visual language",
    body: "Focused chart controls, comparison foundations, and transparent timeframe states—without presenting deterministic fixtures as live movement.",
  },
  {
    icon: PieChart,
    label: "Portfolio and risk",
    title: "Exposure with context",
    body: "Illustrative portfolio structure surfaces concentration, attribution, and risk contribution while brokerage connectivity remains explicitly unavailable.",
  },
  {
    icon: BookOpen,
    label: "Research organization",
    title: "Build the evidence trail",
    body: "Theses, catalysts, risk factors, notes, and provenance are organized into a repeatable research workflow using deterministic Demo foundations.",
  },
  {
    icon: FileSearch,
    label: "News provenance",
    title: "Source first, headline second",
    body: "The information architecture is ready for freshness and source policies. No publisher feed is represented as connected today.",
  },
  {
    icon: Sparkles,
    label: "AI workflow foundation",
    title: "Intelligence with boundaries",
    body: "Meridian OS preserves space for cited synthesis and confidence states while production AI remains unavailable until an approved provider is connected.",
  },
] as const;

type PreviewId = "overview" | "markets" | "charts" | "portfolio" | "research";

const previews: Array<{
  id: PreviewId;
  label: string;
  state: "Demo" | "Historical" | "Provider unavailable";
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    state: "Demo",
    eyebrow: "Decision workspace",
    title: "A composed morning brief",
    description: "Market structure, portfolio context, and intelligence states share one calm operating surface.",
  },
  {
    id: "markets",
    label: "Markets",
    state: "Historical",
    eyebrow: "Market structure",
    title: "Context without fake-live motion",
    description: "Fixed historical candles and deterministic breadth samples demonstrate the analytical hierarchy.",
  },
  {
    id: "charts",
    label: "Charts",
    state: "Historical",
    eyebrow: "Analytical workspace",
    title: "Controls that stay out of the data",
    description: "Timeframe, indicator, comparison, and crosshair foundations remain explicit and provider-neutral.",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    state: "Demo",
    eyebrow: "Illustrative portfolio",
    title: "Risk before decoration",
    description: "The current fixture demonstrates exposure and attribution; it is not a signed-in user’s account.",
  },
  {
    id: "research",
    label: "Research",
    state: "Provider unavailable",
    eyebrow: "Research command",
    title: "Organize the thesis, then connect sources",
    description: "The worksheet foundation is usable while filings, analyst research, and AI synthesis remain unavailable.",
  },
];

const truthStates = [
  { state: "Live", tone: "live", body: "Reserved for source-verified real-time responses. Not active in this public preview." },
  { state: "Delayed", tone: "delayed", body: "Provider data received outside its real-time window, with delay made visible." },
  { state: "Historical", tone: "historical", body: "Time-stamped past observations used for analytical structure and review." },
  { state: "Demo", tone: "demo", body: "Deterministic product fixtures that demonstrate interface behavior—not an account." },
  { state: "Simulated", tone: "simulated", body: "Modeled scenarios that are explicitly separated from observed market data." },
  { state: "AI-generated", tone: "ai", body: "Model-produced content shown only with provider, citation, and confidence context." },
  { state: "Provider unavailable", tone: "unavailable", body: "An honest boundary when a required source has not been approved or connected." },
] as const;

const safeguards = [
  { icon: Database, title: "Opaque server-side sessions", body: "The browser receives an opaque identifier; session state remains on the server." },
  { icon: LockKeyhole, title: "HttpOnly cookie boundary", body: "Session cookies are inaccessible to browser scripts and follow environment-aware policy." },
  { icon: ShieldCheck, title: "CSRF protection", body: "State-changing requests require the approved synchronizer token and origin checks." },
  { icon: Network, title: "Rotation and revocation", body: "Sessions rotate after authentication and support expiry, sign-out, and all-device revocation." },
  { icon: Fingerprint, title: "Argon2id password hashing", body: "Passwords are verified server-side and are never used as browser session credentials." },
  { icon: Eye, title: "Server-derived identity", body: "Protected ownership and user identity resolve from the authenticated session." },
] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={reducedMotion ? { duration: 0 } : {
        duration: motionTokens.duration.entrance,
        delay,
        ease: motionTokens.ease.out,
      }}
    >
      {children}
    </motion.div>
  );
}

function SignatureVisual() {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className="yt-public-signature"
      role="img"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : {
        ...motionTokens.spring.route,
        delay: motionTokens.delay.briefing,
      }}
      aria-label="Meridian signal, context, and clarity visual"
    >
      <div className="yt-public-signature-grid" aria-hidden="true" />
      <div className="yt-public-signature-meta is-top" aria-hidden="true">
        <span>MERIDIAN / SIGNAL MAP</span>
        <span>PROVENANCE FIRST</span>
      </div>
      <div className="yt-public-orbit-field" aria-hidden="true">
        <span className="yt-public-orbit is-one" />
        <span className="yt-public-orbit is-two" />
        <span className="yt-public-orbit is-three" />
        <span className="yt-public-orbit-node is-one" />
        <span className="yt-public-orbit-node is-two" />
        <span className="yt-public-orbit-node is-three" />
        <span className="yt-public-signature-axis is-horizontal" />
        <span className="yt-public-signature-axis is-vertical" />
        <span className="yt-public-signature-core"><BrandMark /></span>
      </div>
      <div className="yt-public-horizon" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="yt-public-signature-meta is-bottom">
        <span><i /> Signal</span>
        <span><i /> Context</span>
        <span><i /> Clarity</span>
      </div>
    </motion.div>
  );
}

function PreviewSurface({ active }: { active: PreviewId }) {
  const fixedBars = [22, 31, 27, 40, 46, 38, 54, 49, 61, 67, 58, 73, 69, 81, 76, 88, 82, 91, 86, 93];

  if (active === "overview") {
    return (
      <div className="yt-public-preview-canvas is-overview" aria-label="Demo Overview interface preview">
        <div className="yt-public-preview-strip">
          {["Market regime", "Risk context", "Opportunity map", "Source state"].map((label, index) => (
            <span key={label}><small>{label}</small><strong>{["Expansion", "Moderate", "Selective", "Demo"][index]}</strong></span>
          ))}
        </div>
        <div className="yt-public-preview-hero">
          <span className="yt-public-preview-kicker">MERIDIAN BRIEF · DEMO</span>
          <strong>Clarity begins with the state of the evidence.</strong>
          <p>Fixed interface copy demonstrates hierarchy without claiming a current market observation.</p>
        </div>
        <div className="yt-public-preview-grid">
          <span><small>MARKET BREADTH</small><b className="yt-public-ring">62</b><em>Demo distribution</em></span>
          <span><small>RISK OVERVIEW</small><b>Moderate</b><em>Fixture-derived</em></span>
          <span><small>AI INSIGHT</small><b>Unavailable</b><em>No model call</em></span>
        </div>
      </div>
    );
  }

  if (active === "portfolio") {
    return (
      <div className="yt-public-preview-canvas is-portfolio" aria-label="Demo Portfolio interface preview">
        <div className="yt-public-preview-port-head">
          <span><small>ILLUSTRATIVE EXPOSURE</small><strong>Demo portfolio context</strong></span>
          <span className="yt-public-state-chip is-unavailable">Brokerage unavailable</span>
        </div>
        <div className="yt-public-preview-allocation">
          <div className="yt-public-allocation-ring"><span>4<small>sleeves</small></span></div>
          <div className="yt-public-allocation-list">
            {[["US equity", "62%"], ["Fixed income", "18%"], ["International", "10%"], ["Cash", "10%"]].map(([label, value]) => (
              <span key={label}><i /><small>{label}</small><b>{value}</b></span>
            ))}
          </div>
        </div>
        <div className="yt-public-preview-table">
          <span><small>CONCENTRATION</small><b>Fixture-derived</b></span>
          <span><small>ATTRIBUTION</small><b>Demo structure</b></span>
          <span><small>ACCOUNT DATA</small><b>Not connected</b></span>
        </div>
      </div>
    );
  }

  if (active === "research") {
    return (
      <div className="yt-public-preview-canvas is-research" aria-label="Demo Research interface preview">
        <div className="yt-public-research-head">
          <span className="yt-public-preview-kicker">RESEARCH DOSSIER · DEMO</span>
          <strong>Build the evidence trail before the conclusion.</strong>
        </div>
        <div className="yt-public-research-columns">
          <div>
            <small>WORKING THESIS</small>
            <p>A structured placeholder keeps thesis, catalysts, and disconfirming evidence in one review surface.</p>
            <span className="yt-public-research-rule"><i /></span>
          </div>
          <div>
            {["Bull case", "Bear case", "Catalyst timeline", "Risk factors"].map((label, index) => (
              <span key={label}><small>0{index + 1}</small><b>{label}</b><ChevronRight aria-hidden="true" /></span>
            ))}
          </div>
        </div>
        <div className="yt-public-provider-row">
          <span>Filing provider <b>Unavailable</b></span>
          <span>Analyst provider <b>Unavailable</b></span>
          <span>AI synthesis <b>Unavailable</b></span>
        </div>
      </div>
    );
  }

  return (
    <div className={`yt-public-preview-canvas is-chart ${active === "markets" ? "is-markets" : ""}`} aria-label={`${active === "markets" ? "Historical Markets" : "Historical Charts"} interface preview`}>
      <div className="yt-public-chart-toolbar">
        <span><small>{active === "markets" ? "PRIMARY BENCHMARK" : "SYMBOL"}</small><strong>SPX</strong></span>
        <div>
          {(["1D", "1W", "1M", "3M", "YTD"] as const).map((range) => <span className={range === "1D" ? "is-active" : ""} key={range}>{range}</span>)}
        </div>
      </div>
      <div className="yt-public-chart-heading">
        <span><strong>S&amp;P 500 Index</strong><small>Fixed historical fixture</small></span>
        <span className="yt-public-state-chip is-historical">Historical</span>
      </div>
      <div className="yt-public-chart-plot">
        <span className="yt-public-chart-average is-short" />
        <span className="yt-public-chart-average is-long" />
        <div className="yt-public-chart-bars">
          {fixedBars.map((height, index) => (
            <i
              key={`${height}-${index}`}
              className={index % 4 === 1 || index % 7 === 0 ? "is-down" : "is-up"}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <span className="yt-public-chart-caption">FIXED HISTORICAL STRUCTURE · NO STREAMING QUOTE</span>
      </div>
    </div>
  );
}

export default function PublicLandingPage() {
  const reducedMotion = Boolean(useReducedMotion());
  const rootRef = React.useRef<HTMLElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [activePreview, setActivePreview] = React.useState<PreviewId>("overview");
  const activePreviewData = previews.find((preview) => preview.id === activePreview) ?? previews[0];

  React.useEffect(() => {
    const updateVisibility = () => {
      rootRef.current?.classList.toggle("yt-public-motion-paused", document.hidden);
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) {
      root?.style.removeProperty("--yt-public-parallax-x");
      root?.style.removeProperty("--yt-public-parallax-y");
      return;
    }

    let frame: number | null = null;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 8;
        const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 6;
        root.style.setProperty("--yt-public-parallax-x", `${x.toFixed(2)}px`);
        root.style.setProperty("--yt-public-parallax-y", `${y.toFixed(2)}px`);
        frame = null;
      });
    };
    const reset = () => {
      root.style.setProperty("--yt-public-parallax-x", "0px");
      root.style.setProperty("--yt-public-parallax-y", "0px");
    };
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", reset);
    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", reset);
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--yt-public-parallax-x");
      root.style.removeProperty("--yt-public-parallax-y");
    };
  }, [reducedMotion]);

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <main ref={rootRef} className="yt-public-root">
      <a className="yt-public-skip" href="#public-main">Skip to main content</a>
      <div className="yt-public-atmosphere" aria-hidden="true" />

      <motion.header
        className="yt-public-header"
        initial={reducedMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : {
          duration: motionTokens.duration.panel,
          delay: motionTokens.delay.topbar,
          ease: motionTokens.ease.out,
        }}
      >
        <a href="#public-main" className="yt-public-brand" aria-label="YucaTanaTrades home">
          <BrandMark />
          <span>YUCATANATRADES</span>
        </a>

        <nav className="yt-public-desktop-nav" aria-label="Public site navigation">
          {publicNav.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>

        <div className="yt-public-header-actions">
          <Link href="/sign-in" className="yt-public-sign-in">Sign in</Link>
          <Link href="/sign-in" className="yt-public-primary-link">Open Meridian OS <ArrowRight aria-hidden="true" /></Link>
        </div>

        <button
          type="button"
          className="yt-public-menu-button"
          aria-expanded={mobileNavOpen}
          aria-controls="yt-public-mobile-nav"
          aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <AnimatePresence initial={false}>
          {mobileNavOpen && (
            <motion.nav
              id="yt-public-mobile-nav"
              className="yt-public-mobile-nav"
              aria-label="Mobile public navigation"
              initial={reducedMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={reducedMotion ? { duration: 0 } : motionTokens.spring.snappy}
            >
              {publicNav.map((item) => (
                <a href={item.href} key={item.href} onClick={() => setMobileNavOpen(false)}>
                  {item.label}<ChevronRight aria-hidden="true" />
                </a>
              ))}
              <div>
                <Link href="/sign-in" onClick={() => setMobileNavOpen(false)}>Sign in</Link>
                <Link href="/sign-in" className="yt-public-primary-link" onClick={() => setMobileNavOpen(false)}>Open Meridian OS <ArrowRight aria-hidden="true" /></Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <div id="public-main">
        <section className="yt-public-hero" aria-labelledby="yt-public-hero-title">
          <div className="yt-public-hero-copy">
            <motion.div
              className="yt-public-eyebrow"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : {
                duration: motionTokens.duration.panel,
                delay: motionTokens.delay.atmosphere,
                ease: motionTokens.ease.out,
              }}
            >
              <span /> YUCATANATRADES · MERIDIAN OS
            </motion.div>
            <motion.h1
              id="yt-public-hero-title"
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : {
                duration: motionTokens.duration.entrance,
                delay: motionTokens.delay.hero,
                ease: motionTokens.ease.out,
              }}
            >
              Where markets<br /><em>meet mastery.</em>
            </motion.h1>
            <motion.p
              className="yt-public-hero-lede"
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : {
                duration: motionTokens.duration.entrance,
                delay: motionTokens.delay.briefing,
                ease: motionTokens.ease.out,
              }}
            >
              Meridian OS brings market structure, research, risk awareness, and source provenance into one focused intelligence environment—so every decision begins with clarity about the evidence.
            </motion.p>
            <motion.div
              className="yt-public-hero-actions"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : {
                duration: motionTokens.duration.panel,
                delay: motionTokens.delay.portfolio,
                ease: motionTokens.ease.out,
              }}
            >
              <Link href="/sign-in" className="yt-public-hero-primary">Open Meridian OS <ArrowRight aria-hidden="true" /></Link>
              <a href="#platform" className="yt-public-hero-secondary">Explore the platform</a>
            </motion.div>
            <motion.p
              className="yt-public-hero-truth"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reducedMotion ? { duration: 0 } : {
                duration: motionTokens.duration.panel,
                delay: motionTokens.delay.chart,
              }}
            >
              <ShieldCheck aria-hidden="true" /> Provider-neutral foundation · Demo and Historical states are labeled in context
            </motion.p>
          </div>
          <SignatureVisual />
        </section>

        <section id="intelligence" className="yt-public-decisions" aria-labelledby="yt-public-decisions-title">
          <Reveal className="yt-public-section-heading is-split">
            <div>
              <span className="yt-public-section-kicker">THE DECISION FRAME</span>
              <h2 id="yt-public-decisions-title">Clarity is a sequence,<br />not a signal.</h2>
            </div>
            <p>Meridian OS is being shaped around four durable questions. Each workspace contributes context without hiding the state or origin of its information.</p>
          </Reveal>
          <div className="yt-public-question-grid">
            {decisionQuestions.map((item, index) => (
              <Reveal className="yt-public-question" delay={index * motionTokens.stagger.compact} key={item.number}>
                <span>{item.number}</span>
                <strong>{item.question}</strong>
                <p>{item.detail}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="platform" className="yt-public-platform" aria-labelledby="yt-public-platform-title">
          <Reveal className="yt-public-section-heading">
            <span className="yt-public-section-kicker">THE PLATFORM</span>
            <h2 id="yt-public-platform-title">One operating environment.<br /><em>Six connected disciplines.</em></h2>
            <p>Built as a provider-neutral foundation, with current capability and unavailable states shown plainly.</p>
          </Reveal>
          <div className="yt-public-pillar-grid">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <Reveal className="yt-public-pillar" delay={(index % 3) * motionTokens.stagger.compact} key={pillar.label}>
                  <div className="yt-public-pillar-icon"><Icon aria-hidden="true" /></div>
                  <span>{pillar.label}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                  <small>0{index + 1}</small>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section id="markets" className="yt-public-showcase" aria-labelledby="yt-public-showcase-title">
          <Reveal className="yt-public-section-heading is-split">
            <div>
              <span className="yt-public-section-kicker">INSIDE MERIDIAN OS</span>
              <h2 id="yt-public-showcase-title">Analysis with its<br />status attached.</h2>
            </div>
            <p>Controlled UI-2 previews demonstrate the authenticated environment. They are interface fixtures, not streaming market or account data.</p>
          </Reveal>

          <Reveal className="yt-public-showcase-frame">
            <div className="yt-public-showcase-tabs" role="tablist" aria-label="Meridian OS workspace previews">
              {previews.map((preview) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreview === preview.id}
                  aria-controls="yt-public-preview-panel"
                  id={`yt-public-preview-tab-${preview.id}`}
                  tabIndex={activePreview === preview.id ? 0 : -1}
                  className={activePreview === preview.id ? "is-active" : ""}
                  onClick={() => setActivePreview(preview.id)}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const currentIndex = previews.findIndex((item) => item.id === preview.id);
                    const nextIndex = event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? previews.length - 1
                        : event.key === "ArrowRight"
                          ? (currentIndex + 1) % previews.length
                          : (currentIndex - 1 + previews.length) % previews.length;
                    const nextPreview = previews[nextIndex];
                    setActivePreview(nextPreview.id);
                    window.requestAnimationFrame(() => {
                      document.getElementById(`yt-public-preview-tab-${nextPreview.id}`)?.focus();
                    });
                  }}
                  key={preview.id}
                >
                  {preview.label}
                </button>
              ))}
            </div>
            <div
              id="yt-public-preview-panel"
              role="tabpanel"
              aria-labelledby={`yt-public-preview-tab-${activePreview}`}
              className="yt-public-showcase-body"
            >
              <div className="yt-public-showcase-copy">
                <span className={`yt-public-state-chip is-${activePreviewData.state.toLowerCase().replace("provider ", "")}`}>{activePreviewData.state}</span>
                <small>{activePreviewData.eyebrow}</small>
                <h3>{activePreviewData.title}</h3>
                <p>{activePreviewData.description}</p>
                <Link href="/sign-in">Open the authenticated workspace <ArrowRight aria-hidden="true" /></Link>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activePreview}
                  className="yt-public-preview-window"
                  initial={reducedMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={reducedMotion ? { duration: 0 } : {
                    duration: motionTokens.duration.interface,
                    ease: motionTokens.ease.out,
                  }}
                >
                  <div className="yt-public-preview-window-bar">
                    <span><BrandMark /> MERIDIAN OS</span>
                    <span>CONTROLLED PREVIEW</span>
                  </div>
                  <PreviewSurface active={activePreview} />
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </section>

        <section id="research" className="yt-public-research" aria-labelledby="yt-public-research-title">
          <Reveal className="yt-public-research-card">
            <div className="yt-public-research-orbit" aria-hidden="true"><BookOpen /><span /><span /></div>
            <div>
              <span className="yt-public-section-kicker">RESEARCH COMMAND</span>
              <h2 id="yt-public-research-title">The conclusion is only as useful as its evidence trail.</h2>
              <p>Build a thesis, record the bull and bear case, track catalysts and risks, and keep source availability visible. Current research organization is a deterministic Demo foundation; filings, licensed analyst content, and production AI synthesis are not connected.</p>
              <div className="yt-public-research-tags">
                <span><Check aria-hidden="true" /> Thesis structure</span>
                <span><Check aria-hidden="true" /> Catalyst timeline</span>
                <span><Check aria-hidden="true" /> Risk factors</span>
                <span><Check aria-hidden="true" /> Provenance foundation</span>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="risk" className="yt-public-truth" aria-labelledby="yt-public-truth-title">
          <Reveal className="yt-public-section-heading is-split">
            <div>
              <span className="yt-public-section-kicker">DATA TRUTH</span>
              <h2 id="yt-public-truth-title">Truth is a<br />risk control.</h2>
            </div>
            <p>A polished interface should never make uncertain or unavailable information look live. Meridian OS gives each state a visible place in the product language.</p>
          </Reveal>
          <div className="yt-public-truth-grid">
            {truthStates.map((item, index) => (
              <Reveal className="yt-public-truth-item" delay={(index % 4) * motionTokens.stagger.compact} key={item.state}>
                <span className={`yt-public-truth-dot is-${item.tone}`} />
                <strong>{item.state}</strong>
                <p>{item.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="yt-public-security" aria-labelledby="yt-public-security-title">
          <Reveal className="yt-public-section-heading">
            <span className="yt-public-section-kicker">IMPLEMENTED SESSION SAFEGUARDS</span>
            <h2 id="yt-public-security-title">Private by design.<br /><em>Specific by description.</em></h2>
            <p>Only safeguards implemented in the current authentication foundation are described here.</p>
          </Reveal>
          <div className="yt-public-security-grid">
            {safeguards.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal className="yt-public-security-item" delay={(index % 3) * motionTokens.stagger.compact} key={item.title}>
                  <Icon aria-hidden="true" />
                  <div><strong>{item.title}</strong><p>{item.body}</p></div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="yt-public-final-cta" aria-labelledby="yt-public-cta-title">
          <div className="yt-public-cta-glow" aria-hidden="true" />
          <Reveal>
            <span className="yt-public-section-kicker">ENTER MERIDIAN OS</span>
            <h2 id="yt-public-cta-title">See the market.<br /><em>Keep the evidence in view.</em></h2>
            <p>Open the authenticated intelligence environment or return to your existing session.</p>
            <div>
              <Link href="/sign-in" className="yt-public-hero-primary">Open Meridian OS <ArrowRight aria-hidden="true" /></Link>
              <Link href="/sign-in" className="yt-public-hero-secondary">Sign in</Link>
            </div>
          </Reveal>
        </section>
      </div>

      <footer className="yt-public-footer">
        <div className="yt-public-footer-brand">
          <BrandMark />
          <div><strong>YUCATANATRADES</strong><span>Meridian OS · intelligence foundation</span></div>
        </div>
        <div className="yt-public-footer-links">
          <a href="#platform">Platform</a>
          <a href="#research">Research</a>
          <a href="#risk">Data truth</a>
          <Link href="/sign-in">Sign in</Link>
        </div>
        <div className="yt-public-footer-legal">
          <span>Privacy · placeholder</span>
          <span>Terms · placeholder</span>
          <span>Product foundation · provider-neutral</span>
        </div>
      </footer>
    </main>
  );
}
