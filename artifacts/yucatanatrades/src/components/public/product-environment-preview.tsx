import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  ChartCandlestick,
  ChevronRight,
  CircleGauge,
  Home,
  Newspaper,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type KeyboardEvent } from "react";
import { Link } from "wouter";
import {
  PublicReveal,
  PublicSectionIntro,
  PublicStateDot,
  PublicTruthBadge,
  type PublicTruthLabel,
} from "./public-primitives";

type PreviewId =
  | "overview"
  | "markets"
  | "charts"
  | "portfolio"
  | "research"
  | "news"
  | "ai";

type PreviewDefinition = {
  id: PreviewId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  truth: PublicTruthLabel;
};

const previews: readonly PreviewDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "DECISION WORKSPACE",
    title: "A composed intelligence brief",
    description:
      "Market, technical, research, risk, and provenance context share one calm operating surface.",
    truth: "Demo",
  },
  {
    id: "markets",
    label: "Markets",
    eyebrow: "MARKET LENS",
    title: "Structure before market noise",
    description:
      "Fixed interface samples demonstrate regime, breadth, volatility, and source-state hierarchy.",
    truth: "Historical",
  },
  {
    id: "charts",
    label: "Charts",
    eyebrow: "ANALYTICAL WORKSPACE",
    title: "Technical context stays attached",
    description:
      "Timeframe, structure, scenario zones, and invalidation context remain part of the chart.",
    truth: "Historical",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    eyebrow: "EXPOSURE INTELLIGENCE",
    title: "Risk without an implied account",
    description:
      "Illustrative allocation and concentration states demonstrate the interface while brokerage remains unavailable.",
    truth: "Estimated",
  },
  {
    id: "research",
    label: "Research",
    eyebrow: "RESEARCH COMMAND",
    title: "The evidence trail becomes the workflow",
    description:
      "Question, thesis, evidence, catalyst, risk, and decision context move through one organized dossier.",
    truth: "Demo",
  },
  {
    id: "news",
    label: "News",
    eyebrow: "SOURCE-FIRST INTELLIGENCE",
    title: "No invented headlines",
    description:
      "The workspace reserves source, freshness, relevance, and impact architecture until an approved provider is connected.",
    truth: "Provider unavailable",
  },
  {
    id: "ai",
    label: "AI Hub",
    eyebrow: "MERIDIAN SYNTHESIS",
    title: "Model output with boundaries",
    description:
      "Static model-style copy demonstrates citations, confidence, and provider labeling without making a production model call.",
    truth: "AI-generated Demo",
  },
];

function WorkspaceChrome({ active }: { active: PreviewId }) {
  const primary = [
    ["overview", Home],
    ["markets", BarChart3],
    ["charts", ChartCandlestick],
    ["portfolio", BriefcaseBusiness],
    ["research", BookOpen],
    ["news", Newspaper],
    ["ai", BrainCircuit],
  ] as const;

  return (
    <>
      <div className="yt24-workspace-rail" aria-hidden="true">
        <span className="yt24-workspace-mark"><Sparkles /></span>
        <div>
          {primary.map(([id, Icon]) => (
            <span key={id} className={active === id ? "is-active" : ""}>
              <Icon />
            </span>
          ))}
        </div>
        <span><Settings /></span>
      </div>
      <div className="yt24-workspace-topbar" aria-hidden="true">
        <strong>YUCATANATRADES</strong>
        <nav>
          {previews.map((preview) => (
            <span className={active === preview.id ? "is-active" : ""} key={preview.id}>
              {preview.label}
            </span>
          ))}
        </nav>
        <div>
          <Search />
          <span>Search Meridian OS</span>
        </div>
        <i />
      </div>
    </>
  );
}

function OverviewCanvas() {
  return (
    <div className="yt24-canvas yt24-overview-canvas">
      <div className="yt24-canvas-heading">
        <div>
          <span>MORNING INTELLIGENCE</span>
          <h4>Good morning. Your decision context is organized.</h4>
        </div>
        <PublicTruthBadge label="Demo" />
      </div>
      <div className="yt24-overview-grid">
        <article className="yt24-overview-brief">
          <span>MERIDIAN BRIEF</span>
          <h5>Structure, exposure, and evidence in one review sequence.</h5>
          <p>Fixed product copy · no current market observation</p>
          <div>
            <span><PublicStateDot tone="green" /> Market context</span>
            <span><PublicStateDot tone="gold" /> Risk posture</span>
            <span><PublicStateDot tone="blue" /> Research evidence</span>
          </div>
        </article>
        <article className="yt24-overview-line">
          <span>TECHNICAL CONTEXT</span>
          <svg viewBox="0 0 360 120" aria-hidden="true">
            <path d="M5 100 C45 94 54 73 91 79 S149 89 176 59 S222 28 254 44 S305 74 355 22" fill="none" stroke="rgba(228,194,112,.8)" strokeWidth="2" />
            <path d="M5 108 C57 99 74 92 108 94 S166 85 196 72 S252 58 285 61 S326 48 355 42" fill="none" stroke="rgba(93,175,153,.55)" strokeWidth="1.4" />
          </svg>
          <PublicTruthBadge label="Historical" />
        </article>
        <article className="yt24-overview-risk">
          <span>PORTFOLIO RISK</span>
          <strong>Scenario view only</strong>
          <div><i /><i /><i /></div>
          <PublicTruthBadge label="Estimated" />
        </article>
        <article className="yt24-overview-ai">
          <span>AI INTELLIGENCE</span>
          <strong>No production model call</strong>
          <PublicTruthBadge label="Provider unavailable" />
        </article>
      </div>
    </div>
  );
}

function MarketsCanvas() {
  return (
    <div className="yt24-canvas yt24-markets-canvas">
      <div className="yt24-canvas-heading">
        <div>
          <span>GLOBAL MARKET LENS</span>
          <h4>Provider-neutral market structure</h4>
        </div>
        <PublicTruthBadge label="Historical" />
      </div>
      <div className="yt24-market-strip">
        {["Primary benchmark", "Growth benchmark", "Volatility", "Rates context"].map((label, index) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{index === 3 ? "Delayed-state fixture" : "Fixed snapshot"}</strong>
            <svg viewBox="0 0 120 36" aria-hidden="true">
              <path
                d={index % 2 === 0 ? "M2 29 L19 24 L31 26 L46 14 L62 19 L77 8 L92 13 L118 4" : "M2 8 L20 12 L36 9 L52 21 L69 16 L83 27 L101 22 L118 31"}
                fill="none"
                stroke={index % 2 === 0 ? "#72b37a" : "#d96e59"}
                strokeWidth="2"
              />
            </svg>
          </article>
        ))}
      </div>
      <div className="yt24-markets-main">
        <article>
          <div><span>MARKET STRUCTURE</span><PublicTruthBadge label="Demo" /></div>
          <svg viewBox="0 0 600 210" aria-hidden="true">
            {[48, 96, 144, 192].map((y) => <line key={y} x1="10" x2="590" y1={y} y2={y} stroke="rgba(130,168,174,.08)" />)}
            <path d="M12 174 C84 151 109 160 170 123 S268 141 327 91 S425 104 487 54 S551 63 588 34" fill="none" stroke="rgba(225,190,108,.75)" strokeWidth="2" />
            <path d="M12 190 C82 177 134 171 194 157 S302 142 354 119 S460 109 515 83 S558 77 588 70" fill="none" stroke="rgba(90,171,150,.5)" strokeWidth="1.5" />
          </svg>
        </article>
        <aside>
          <span>SESSION STATE</span>
          <CircleGauge aria-hidden="true" />
          <strong>Reference fixture</strong>
          <p>No exchange or market provider is active.</p>
          <PublicTruthBadge label="Provider unavailable" />
        </aside>
      </div>
    </div>
  );
}

function ChartsCanvas() {
  const bars = [42, 55, 48, 68, 61, 76, 63, 84, 72, 92, 86, 104, 93, 112, 103, 124, 116, 132];
  return (
    <div className="yt24-canvas yt24-charts-canvas">
      <div className="yt24-canvas-heading">
        <div>
          <span>STRUCTURE WORKSPACE</span>
          <h4>Technical context with real interface controls</h4>
        </div>
        <PublicTruthBadge label="Historical" />
      </div>
      <div className="yt24-chart-demo">
        <div className="yt24-chart-demo-toolbar">
          <span className="is-active">1D</span><span>1W</span><span>1M</span><span>3M</span><span>YTD</span>
        </div>
        <div className="yt24-chart-demo-zone"><span>REVIEW ZONE · DEMO</span></div>
        <div className="yt24-chart-demo-bars" aria-hidden="true">
          {bars.map((height, index) => (
            <i key={`${height}-${index}`} style={{ height: `${height}px` }} data-down={index % 5 === 2} />
          ))}
        </div>
        <svg viewBox="0 0 720 210" aria-hidden="true">
          <path d="M10 173 C70 147 111 158 164 124 S261 142 320 94 S412 107 478 55 S582 62 710 30" fill="none" stroke="rgba(225,190,108,.72)" strokeWidth="2" />
          <path d="M10 188 C88 177 123 174 195 156 S306 149 370 120 S487 113 553 86 S649 77 710 69" fill="none" stroke="rgba(88,169,149,.52)" strokeWidth="1.5" />
        </svg>
        <div className="yt24-chart-demo-risk"><span>INVALIDATION CONTEXT</span></div>
      </div>
    </div>
  );
}

function PortfolioCanvas() {
  return (
    <div className="yt24-canvas yt24-portfolio-canvas">
      <div className="yt24-canvas-heading">
        <div>
          <span>PORTFOLIO INTELLIGENCE</span>
          <h4>Illustrative exposure—not a connected account</h4>
        </div>
        <PublicTruthBadge label="Estimated" />
      </div>
      <div className="yt24-portfolio-preview-grid">
        <article className="yt24-allocation-preview">
          <div className="yt24-allocation-ring" aria-hidden="true"><span>DEMO<br />SLEEVES</span></div>
          <div>
            {["Equity sleeve", "Defensive sleeve", "Cash sleeve", "Unassigned"].map((label, index) => (
              <span key={label}><i data-index={index} /> {label}</span>
            ))}
          </div>
        </article>
        <article className="yt24-concentration-preview">
          <span>CONCENTRATION REVIEW</span>
          {[
            ["Technology sleeve", 78],
            ["Top positions", 62],
            ["Single-name risk", 42],
            ["Liquidity buffer", 55],
          ].map(([label, width]) => (
            <div key={String(label)}>
              <span>{String(label)}</span>
              <i><b style={{ width: `${Number(width)}%` }} /></i>
            </div>
          ))}
        </article>
        <article className="yt24-broker-preview">
          <ShieldAlert aria-hidden="true" />
          <span>BROKERAGE CONNECTION</span>
          <strong>Unavailable</strong>
          <p>No balances, positions, buying power, or account tier are represented.</p>
          <PublicTruthBadge label="Provider unavailable" />
        </article>
      </div>
    </div>
  );
}

function ResearchCanvas() {
  return (
    <div className="yt24-canvas yt24-research-canvas">
      <div className="yt24-canvas-heading">
        <div>
          <span>RESEARCH COMMAND</span>
          <h4>Question to decision context</h4>
        </div>
        <PublicTruthBadge label="Demo" />
      </div>
      <div className="yt24-research-preview-grid">
        <article>
          <span>WORKING THESIS · FIXED UI COPY</span>
          <h5>Test durable demand against valuation and concentration risk.</h5>
          <p>Illustrative prompt · not an analyst recommendation</p>
          <div className="yt24-research-confidence">
            <span>Evidence structure</span><i><b /></i><em>Demo</em>
          </div>
        </article>
        <aside>
          {["Question framed", "Thesis stated", "Evidence attached", "Catalyst tracked", "Risk defined", "Decision context"].map((step, index) => (
            <div key={step}><span>0{index + 1}</span><strong>{step}</strong><ChevronRight /></div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function NewsCanvas() {
  return (
    <div className="yt24-canvas yt24-news-canvas">
      <div className="yt24-canvas-heading">
        <div>
          <span>NEWS INTELLIGENCE</span>
          <h4>Source first. Headline second.</h4>
        </div>
        <PublicTruthBadge label="Provider unavailable" />
      </div>
      <div className="yt24-news-empty">
        <div className="yt24-news-orbit" aria-hidden="true"><Newspaper /></div>
        <span>PROVIDER NOT CONFIGURED</span>
        <h5>No invented headlines. No ambiguous freshness.</h5>
        <p>
          Source, publish time, market time, relevance, and impact classification
          will appear only after an approved news provider is connected.
        </p>
        <div>
          <span><i /> Source attribution</span>
          <span><i /> Freshness state</span>
          <span><i /> Watchlist relevance</span>
          <span><i /> Impact context</span>
        </div>
      </div>
    </div>
  );
}

function AiCanvas() {
  return (
    <div className="yt24-canvas yt24-ai-canvas">
      <div className="yt24-canvas-heading">
        <div>
          <span>MERIDIAN AI HUB</span>
          <h4>Cited synthesis with visible model state</h4>
        </div>
        <PublicTruthBadge label="AI-generated Demo" />
      </div>
      <div className="yt24-ai-canvas-grid">
        <aside>
          {["Morning synthesis", "Research tension", "Risk context", "Evidence gaps"].map((item, index) => (
            <div className={index === 0 ? "is-active" : ""} key={item}>
              <BrainCircuit />
              <span>{item}</span>
              <ChevronRight />
            </div>
          ))}
        </aside>
        <article>
          <span>STATIC SAMPLE · NO MODEL CALL</span>
          <h5>What evidence would most materially change this view?</h5>
          <p>
            Prioritize disconfirming evidence before adding confidence. This fixed
            copy exists only to demonstrate the intended answer hierarchy.
          </p>
          <div>
            <span><i /> Citations required</span>
            <span><i /> Confidence visible</span>
            <span><i /> Provider identity visible</span>
          </div>
          <PublicTruthBadge label="Provider unavailable" />
        </article>
      </div>
    </div>
  );
}

function PreviewCanvas({ id }: { id: PreviewId }) {
  switch (id) {
    case "markets":
      return <MarketsCanvas />;
    case "charts":
      return <ChartsCanvas />;
    case "portfolio":
      return <PortfolioCanvas />;
    case "research":
      return <ResearchCanvas />;
    case "news":
      return <NewsCanvas />;
    case "ai":
      return <AiCanvas />;
    default:
      return <OverviewCanvas />;
  }
}

export function ProductEnvironmentPreview() {
  const [activeId, setActiveId] = useState<PreviewId>("overview");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const activeIndex = previews.findIndex((preview) => preview.id === activeId);
  const active = previews[activeIndex] ?? previews[0];

  const choosePreview = (index: number) => {
    const preview = previews[index];
    if (!preview) return;
    setActiveId(preview.id);
    const tab = tabRefs.current[index];
    tab?.focus();
    tab?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (activeIndex + 1) % previews.length;
    if (event.key === "ArrowLeft") nextIndex = (activeIndex - 1 + previews.length) % previews.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = previews.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    choosePreview(nextIndex);
  };

  return (
    <section
      id="product-preview"
      tabIndex={-1}
      className="yt24-section yt24-product-section"
      aria-labelledby="yt24-product-title"
      data-recording="product-preview"
    >
      <div className="yt24-shell">
        <PublicReveal>
          <PublicSectionIntro
            index="06"
            eyebrow="THE PRODUCT ENVIRONMENT"
            title={
              <span id="yt24-product-title">
                One operating system. Seven analytical workspaces.
              </span>
            }
            body="Explore the approved Meridian OS route system through controlled UI fixtures. The authenticated shell remains the real application; these public previews do not make live provider, account, or model claims."
            align="center"
          />
        </PublicReveal>

        <PublicReveal className="yt24-product-stage" delay={0.08}>
          <div
            className="yt24-product-tabs"
            role="tablist"
            aria-label="Meridian OS workspace previews"
          >
            {previews.map((preview, index) => (
              <button
                key={preview.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`yt-public-preview-tab-${preview.id}`}
                type="button"
                role="tab"
                aria-selected={preview.id === activeId}
                aria-controls="yt-public-preview-panel"
                tabIndex={preview.id === activeId ? 0 : -1}
                onClick={() => choosePreview(index)}
                onKeyDown={handleTabKeyDown}
              >
                <span>0{index + 1}</span>
                {preview.label}
              </button>
            ))}
          </div>

          <div className="yt24-product-frame">
            <WorkspaceChrome active={active.id} />
            <div
              id="yt-public-preview-panel"
              className="yt24-product-panel"
              role="tabpanel"
              aria-labelledby={`yt-public-preview-tab-${active.id}`}
              tabIndex={0}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  className="yt24-product-panel-inner"
                  key={active.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.24,
                    ease: [0.2, 0.78, 0.24, 1],
                  }}
                >
                  <div className="yt24-product-copy">
                    <div>
                      <span>{active.eyebrow}</span>
                      <PublicTruthBadge label={active.truth} />
                    </div>
                    <h3>{active.title}</h3>
                    <p>{active.description}</p>
                    <Link href="/sign-in">
                      Open the authenticated workspace
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="yt24-product-canvas">
                    <PreviewCanvas id={active.id} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="yt24-product-caption">
            <span>CONTROLLED PRODUCT PREVIEW</span>
            <p>All values, states, and product copy shown here are deterministic interface fixtures.</p>
            <div>
              <PublicTruthBadge label="Demo" />
              <PublicTruthBadge label="Historical" />
              <PublicTruthBadge label="Provider unavailable" />
            </div>
          </div>
        </PublicReveal>
      </div>
    </section>
  );
}
