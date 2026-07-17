import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CloudOff,
  Database,
  Eye,
  FileText,
  Filter,
  Gauge,
  Layers3,
  LoaderCircle,
  MessageSquare,
  Newspaper,
  PieChart,
  Pin,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { PortfolioBand } from "@/components/ui1/portfolio-band";
import { dashboardDemo } from "@/data/ui1-demo";
import { motionTokens, panelReveal, staggerContainer } from "@/lib/motion";

type TruthTone = "demo" | "historical" | "ai" | "unavailable" | "neutral";

function TruthPill({ tone, children }: { tone: TruthTone; children: ReactNode }) {
  return <span className={`yt-ui2-truth is-${tone}`}>{children}</span>;
}

function RouteHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  truth,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof BriefcaseBusiness;
  truth: ReactNode;
}) {
  return (
    <motion.header className="yt-ui2-route-header" variants={panelReveal}>
      <div className="yt-ui2-route-title">
        <span className="yt-ui2-route-icon" aria-hidden="true"><Icon /></span>
        <div>
          <span className="yt-ui2-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="yt-ui2-route-truth">{truth}</div>
    </motion.header>
  );
}

function Panel({
  title,
  icon: Icon,
  meta,
  action,
  className = "",
  children,
}: {
  title: string;
  icon?: typeof BriefcaseBusiness;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section className={`yt-ui2-panel ${className}`} variants={panelReveal}>
      <header className="yt-ui2-panel-head">
        <div>
          {Icon ? <Icon aria-hidden="true" /> : null}
          <h2>{title}</h2>
          {meta}
        </div>
        {action}
      </header>
      {children}
    </motion.section>
  );
}

function SegmentedControl({
  label,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`yt-ui2-segments${compact ? " is-compact" : ""}`} aria-label={label} role="group">
      {options.map((option) => (
        <button
          aria-pressed={option === value}
          className={option === value ? "is-active" : undefined}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Metric({ label, value, detail, tone = "neutral", icon: Icon }: {
  label: string;
  value: string;
  detail?: string;
  tone?: "positive" | "negative" | "neutral" | "gold";
  icon?: typeof BriefcaseBusiness;
}) {
  return (
    <div className={`yt-ui2-metric is-${tone}`}>
      <span>{Icon ? <Icon aria-hidden="true" /> : null}{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function RouteMotion({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reducedMotion = Boolean(useReducedMotion());
  return (
    <motion.div
      className={`yt-ui2-route ${className}`}
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

const portfolioRanges = ["1M", "3M", "YTD", "1Y", "All"] as const;
const performanceByRange: Record<string, { portfolio: number[]; reference: number[] }> = {
  "1M": {
    portfolio: [100, 99.2, 100.8, 101.4, 100.9, 102.2, 102.8, 103.1, 104.0, 103.7, 104.8, 105.2],
    reference: [100, 99.6, 100.3, 100.8, 100.5, 101.4, 101.8, 102.1, 102.9, 102.7, 103.3, 103.7],
  },
  "3M": {
    portfolio: [100, 101.1, 99.8, 102.4, 101.7, 104.2, 103.8, 105.1, 104.4, 106.8, 107.2, 108.5],
    reference: [100, 100.7, 99.9, 101.8, 101.2, 103.1, 102.8, 103.9, 103.5, 105.2, 105.7, 106.4],
  },
  YTD: {
    portfolio: [100, 98.7, 101.8, 103.4, 101.2, 105.9, 107.4, 106.1, 109.8, 111.3, 110.6, 113.4],
    reference: [100, 99.1, 101.2, 102.5, 101.4, 104.2, 105.4, 104.8, 107.3, 109.1, 108.7, 110.8],
  },
  "1Y": {
    portfolio: [100, 104.8, 102.1, 108.7, 111.2, 109.6, 116.4, 119.1, 117.8, 122.2, 125.1, 128.4],
    reference: [100, 103.5, 102.4, 106.8, 108.9, 107.7, 112.8, 115.4, 114.6, 118.3, 120.5, 123.1],
  },
  All: {
    portfolio: [100, 94.2, 102.6, 98.4, 111.8, 107.3, 121.4, 118.6, 132.2, 128.9, 141.5, 149.7],
    reference: [100, 96.8, 101.1, 99.2, 107.4, 105.1, 114.3, 112.7, 121.6, 120.2, 130.4, 138.2],
  },
};

function seriesReturn(values: number[]) {
  return ((values.at(-1)! / values[0]) - 1) * 100;
}

function signedPercent(value: number) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
}

function signedMoney(value: number) {
  return `${value >= 0 ? "+" : "−"}${money(Math.abs(value))}`;
}

function PerformanceChart({ range }: { range: string }) {
  const reducedMotion = Boolean(useReducedMotion());
  const values = performanceByRange[range].portfolio;
  const width = 760;
  const height = 222;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const path = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * (height - 30) - 15;
    return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lastY = height - ((values.at(-1)! - min) / (max - min)) * (height - 30) - 15;

  return (
    <div className="yt-ui2-performance-chart" role="img" aria-label={`${range} deterministic demo portfolio performance line`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`yt-ui2-performance-${range}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#77b77a" stopOpacity=".28" />
            <stop offset="1" stopColor="#77b77a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[.2, .4, .6, .8].map((at) => <line key={at} x1="0" x2={width} y1={height * at} y2={height * at} className="yt-ui2-grid-line" />)}
        <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#yt-ui2-performance-${range})`} />
        <motion.path
          key={range}
          d={path}
          fill="none"
          stroke="#87c18a"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: motionTokens.duration.entrance, ease: motionTokens.ease.out }}
        />
        <circle cx={width} cy={lastY} r="4" fill="#f1d39a" />
      </svg>
      <div className="yt-ui2-chart-axis"><span>Start</span><span>Deterministic fixture</span><span>Current demo point</span></div>
    </div>
  );
}

const demoPositions = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 82, value: 16106.44, pnl: 1284.60, risk: 14.2, sleeve: "US equity · Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 36, value: 14950.80, pnl: 986.12, risk: 13.8, sleeve: "US equity · Technology" },
  { symbol: "NVDA", name: "NVIDIA Corp.", shares: 104, value: 13426.40, pnl: 1842.31, risk: 21.6, sleeve: "US equity · Semiconductors" },
  { symbol: "TSLA", name: "Tesla, Inc.", shares: 58, value: 10086.78, pnl: -412.68, risk: 18.9, sleeve: "US equity · Consumer" },
  { symbol: "BND", name: "Bond market demo sleeve", shares: 140, value: 10684.80, pnl: 116.24, risk: 4.1, sleeve: "Fixed income · Broad market" },
];

const allocation = [
  { label: "US equity", value: 62, color: "#7eb784" },
  { label: "Fixed income", value: 18, color: "#65aeb9" },
  { label: "International", value: 10, color: "#d9bb7a" },
  { label: "Cash", value: 10, color: "#71848c" },
];

export function PortfolioRoute() {
  const [range, setRange] = useState("YTD");
  const [positionView, setPositionView] = useState("Positions");
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const portfolio = dashboardDemo.portfolio;
  const selectedPerformance = performanceByRange[range];
  const portfolioReturn = seriesReturn(selectedPerformance.portfolio);
  const referenceReturn = seriesReturn(selectedPerformance.reference);
  const relativeReturn = portfolioReturn - referenceReturn;
  const displayedTopThreeWeight = demoPositions
    .map((position) => position.value)
    .sort((left, right) => right - left)
    .slice(0, 3)
    .reduce((total, value) => total + value, 0) / portfolio.totalValue * 100;

  return (
    <RouteMotion className="yt-ui2-portfolio-route">
      <RouteHeader
        eyebrow="Meridian OS · Portfolio intelligence"
        title="Portfolio"
        description="A complete analytical workspace built from a deterministic fixture. No brokerage, custody, or account provider is connected."
        icon={BriefcaseBusiness}
        truth={<><TruthPill tone="demo">Demo portfolio</TruthPill><TruthPill tone="unavailable">Broker unavailable</TruthPill></>}
      />

      <motion.div variants={panelReveal} className="yt-ui2-source-banner">
        <Database aria-hidden="true" />
        <div><strong>Fixed UI-2 portfolio fixture</strong><span>Values are illustrative and never represent a signed-in user’s holdings.</span></div>
        <TruthPill tone="demo">Not linked</TruthPill>
      </motion.div>

      <motion.div variants={panelReveal}><PortfolioBand data={portfolio} /></motion.div>

      <div className="yt-ui2-portfolio-overview">
        <Panel
          title="Performance"
          icon={TrendingUp}
          meta={<TruthPill tone="demo">Demo</TruthPill>}
          className="yt-ui2-performance-panel"
          action={<SegmentedControl label="Performance range" options={portfolioRanges} value={range} onChange={setRange} compact />}
        >
          <div className="yt-ui2-performance-summary">
            <div><span>Portfolio return</span><strong>{signedPercent(portfolioReturn)}</strong><small>{range} fixed series</small></div>
            <div><span>Reference index</span><strong>{signedPercent(referenceReturn)}</strong><small>{range} historical demo</small></div>
            <div><span>Relative</span><strong>{signedPercent(relativeReturn)}</strong><small>Fixture-derived spread</small></div>
          </div>
          <PerformanceChart range={range} />
        </Panel>

        <div className="yt-ui2-allocation-stack">
          <Panel title="Asset allocation" icon={PieChart} meta={<TruthPill tone="demo">Demo</TruthPill>}>
            <div className="yt-ui2-allocation-body">
              <div className="yt-ui2-allocation-donut" style={{ background: `conic-gradient(${allocation.map((item, index) => {
                const start = allocation.slice(0, index).reduce((sum, entry) => sum + entry.value, 0);
                return `${item.color} ${start}% ${start + item.value}%`;
              }).join(", ")})` }} aria-label="Demo portfolio allocation chart"><span><strong>4</strong>sleeves</span></div>
              <div className="yt-ui2-legend">
                {allocation.map((item) => <div key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{item.value}%</strong></div>)}
              </div>
            </div>
          </Panel>
          <Panel title="Account distribution" icon={WalletCards} meta={<TruthPill tone="demo">Illustrative</TruthPill>}>
            <div className="yt-ui2-distribution-list">
              {[{ label: "Taxable sleeve", value: 68 }, { label: "Retirement sleeve", value: 22 }, { label: "Cash sleeve", value: 10 }].map((item) => (
                <div key={item.label}><span>{item.label}</span><strong>{item.value}%</strong><i><b style={{ width: `${item.value}%` }} /></i></div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Holdings intelligence"
        icon={Layers3}
        meta={<TruthPill tone="demo">5 of 12 demo positions</TruthPill>}
        className="yt-ui2-holdings-panel"
        action={<SegmentedControl label="Holdings view" options={["Positions", "Sector exposure", "Risk contribution"]} value={positionView} onChange={setPositionView} compact />}
      >
        <AnimatePresence mode="wait" initial={false}>
          {positionView === "Positions" ? (
            <motion.div key="positions" className="yt-ui2-position-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: motionTokens.duration.fast }}>
              <div className="yt-ui2-position-row is-head"><span>Asset</span><span>Quantity</span><span>Demo value</span><span>Weight</span><span>Unrealized P&amp;L</span><span>Risk contribution</span></div>
              {demoPositions.map((position) => {
                const expanded = expandedPosition === position.symbol;
                const detailsId = `yt-ui2-position-details-${position.symbol.toLowerCase()}`;
                const weight = (position.value / portfolio.totalValue) * 100;
                const averageBasis = (position.value - position.pnl) / position.shares;
                return (
                  <div className={`yt-ui2-position-entry${expanded ? " is-expanded" : ""}`} key={position.symbol}>
                    <button
                      aria-controls={detailsId}
                      aria-expanded={expanded}
                      className="yt-ui2-position-row"
                      onClick={() => setExpandedPosition(expanded ? null : position.symbol)}
                      type="button"
                    >
                      <span className="yt-ui2-symbol-cell"><b>{position.symbol}</b><small>{position.name}</small></span>
                      <span>{position.shares}</span><span>{money(position.value)}</span><span>{weight.toFixed(1)}%</span>
                      <span className={position.pnl >= 0 ? "is-positive" : "is-negative"}>{signedMoney(position.pnl)}</span>
                      <span className="yt-ui2-position-risk-cell"><span>{position.risk.toFixed(1)}%</span><ChevronRight aria-hidden="true" /></span>
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded ? (
                        <motion.div
                          animate={{ height: "auto", opacity: 1 }}
                          aria-label={`${position.symbol} fixed demo position details`}
                          className="yt-ui2-position-details"
                          exit={{ height: 0, opacity: 0 }}
                          id={detailsId}
                          initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                          role="region"
                          transition={reducedMotion ? { duration: 0 } : { duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
                        >
                          <div><span>Demo mark</span><strong>{money(position.value / position.shares)}</strong><small>Fixed value per share</small></div>
                          <div><span>Illustrative basis</span><strong>{money(averageBasis)}</strong><small>Derived from fixture P&amp;L</small></div>
                          <div><span>Portfolio denominator</span><strong>{money(portfolio.totalValue)}</strong><small>Used for displayed weight</small></div>
                          <div><span>Sleeve</span><strong>{position.sleeve}</strong><small>Deterministic classification</small></div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key={positionView} className="yt-ui2-exposure-view" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: motionTokens.duration.fast }}>
              {(positionView === "Sector exposure" ? [
                ["Technology", 48, "+1.2%"], ["Consumer", 15, "−0.3%"], ["Financials", 12, "+0.4%"], ["Health care", 8, "+0.7%"], ["Other / cash", 17, "0.0%"],
              ] : [
                ["NVDA", 22, "High"], ["TSLA", 19, "High"], ["AAPL", 14, "Moderate"], ["MSFT", 14, "Moderate"], ["Other positions", 31, "Diversified"],
              ]).map(([label, value, note]) => (
                <div key={label}><span>{label}</span><i><b style={{ width: `${Number(value) * 1.75}%` }} /></i><strong>{value}%</strong><small>{note}</small></div>
              ))}
              <p>Derived only from the fixed UI-2 portfolio fixture.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      <div className="yt-ui2-portfolio-bottom">
        <Panel title="Concentration & risk" icon={Gauge} meta={<TruthPill tone="demo">Fixture-derived</TruthPill>}>
          <div className="yt-ui2-risk-matrix">
            <Metric label="Top 3 shown" value={`${displayedTopThreeWeight.toFixed(1)}%`} detail="Displayed fixture rows" tone="gold" icon={Target} />
            <Metric label="Cash buffer" value="10.0%" detail="Illustrative" icon={CircleDollarSign} />
            <Metric label="Risk score" value="64 / 100" detail="Moderate demo state" tone="gold" icon={ShieldAlert} />
          </div>
          <div className="yt-ui2-risk-note"><AlertTriangle aria-hidden="true" /><span><strong>Technology concentration</strong> contributes 63% of modeled fixture risk. This is UI copy, not advice.</span></div>
        </Panel>
        <Panel title="Portfolio intelligence" icon={BrainCircuit} meta={<TruthPill tone="ai">AI-generated Demo</TruthPill>}>
          <div className="yt-ui2-intelligence-copy">
            <span>Static sample · no model call</span>
            <h3>Concentration is carrying more risk than position count suggests.</h3>
            <p>The fixed portfolio has twelve positions, while four technology names account for most modeled risk. Review sleeve limits before using this pattern.</p>
            <div><TruthPill tone="neutral">Confidence sample 72%</TruthPill><TruthPill tone="demo">Fixture only</TruthPill></div>
          </div>
        </Panel>
        <Panel title="Brokerage connection" icon={CloudOff} meta={<TruthPill tone="unavailable">Unavailable</TruthPill>} className="yt-ui2-provider-card">
          <p>No broker or custody provider is configured. Balances, tax lots, buying power, and orders cannot be synchronized.</p>
          <button disabled type="button"><CloudOff aria-hidden="true" /> Provider phase deferred</button>
        </Panel>
      </div>
    </RouteMotion>
  );
}

const researchProfiles = {
  NVDA: {
    company: "NVIDIA Corporation",
    thesis: "Use the fixed worksheet to test whether durable platform demand can offset valuation and concentration risk.",
    confidence: 72,
    tags: ["Semiconductors", "AI infrastructure", "Large cap"],
    risks: ["Multiple compression", "Customer concentration", "Supply constraints", "Cyclical demand"],
  },
  AAPL: {
    company: "Apple Inc.",
    thesis: "Use the fixed worksheet to examine ecosystem durability against hardware-cycle and geographic concentration risk.",
    confidence: 66,
    tags: ["Consumer technology", "Services", "Large cap"],
    risks: ["Hardware cycle", "Regulatory exposure", "Geographic mix", "Margin pressure"],
  },
  MSFT: {
    company: "Microsoft Corporation",
    thesis: "Use the fixed worksheet to test cloud and software durability against capacity investment and valuation sensitivity.",
    confidence: 70,
    tags: ["Software", "Cloud", "Large cap"],
    risks: ["Capacity spend", "Cloud competition", "Regulatory exposure", "Valuation sensitivity"],
  },
} as const;

type ResearchSymbol = keyof typeof researchProfiles;

const savedResearch = [
  {
    title: "Quality & momentum worksheet",
    scope: "ACTIVE SYMBOL",
    state: "Draft",
    summary: "Selected working dossier with a fixed thesis, catalyst framework, and disconfirming-risk checklist.",
  },
  {
    title: "Concentration review",
    scope: "PORTFOLIO",
    state: "Saved",
    summary: "Deterministic portfolio concentration artifact. It does not contain brokerage holdings or connected account data.",
  },
  {
    title: "Catalyst planning template",
    scope: "WATCHLIST",
    state: "Template",
    summary: "Reusable local planning structure for source reconciliation before, during, and after a market event.",
  },
] as const;

function riskFrameworkDetail(index: number) {
  return index < 2
    ? "Primary fixture risk. Document the disconfirming evidence and the threshold that would force a thesis review."
    : "Monitoring fixture. Record a source, timestamp, and change threshold before treating this factor as decision-relevant.";
}

export function ResearchRoute() {
  const [symbol, setSymbol] = useState<ResearchSymbol>("NVDA");
  const [query, setQuery] = useState("NVDA");
  const [saved, setSaved] = useState(true);
  const [selectedReport, setSelectedReport] = useState(0);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const profile = researchProfiles[symbol];
  const report = savedResearch[selectedReport];

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const candidate = query.trim().toUpperCase();
    if (candidate in researchProfiles) {
      setSymbol(candidate as ResearchSymbol);
      setExpandedRisk(null);
    }
  }

  return (
    <RouteMotion className="yt-ui2-research-route">
      <RouteHeader
        eyebrow="Meridian OS · Research command"
        title="Research"
        description="Organize a thesis, catalysts, risk, and provenance without presenting provider content as live analysis."
        icon={BookOpen}
        truth={<><TruthPill tone="demo">Demo workspace</TruthPill><TruthPill tone="unavailable">Analyst feeds unavailable</TruthPill></>}
      />

      <motion.section className="yt-ui2-research-command" variants={panelReveal}>
        <div className="yt-ui2-command-copy">
          <span>Research command</span><strong>Build the evidence trail before the conclusion.</strong>
        </div>
        <form onSubmit={submitSearch} role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="yt-ui2-research-search">Search demo research symbols</label>
          <input id="yt-ui2-research-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search NVDA, AAPL, or MSFT" />
          <button type="submit">Open worksheet <ArrowRight aria-hidden="true" /></button>
        </form>
        <div className="yt-ui2-research-watchlist" aria-label="Demo research watchlist">
          <span>Watchlist intelligence</span>
          {(Object.keys(researchProfiles) as ResearchSymbol[]).map((item) => (
            <button key={item} type="button" className={symbol === item ? "is-active" : undefined} aria-pressed={symbol === item} onClick={() => { setSymbol(item); setQuery(item); setExpandedRisk(null); }}>
              <b>{item}</b><small>{item === "NVDA" ? "Priority" : "Saved"}</small>
            </button>
          ))}
        </div>
      </motion.section>

      <div className="yt-ui2-research-grid">
        <Panel title="Research dossier" icon={FileText} meta={<TruthPill tone="demo">Demo worksheet</TruthPill>} className="yt-ui2-dossier">
          <div className="yt-ui2-dossier-identity">
            <div><span>{symbol}</span><div><h3>{profile.company}</h3><p>{profile.tags.join(" · ")}</p></div></div>
            <button type="button" aria-pressed={saved} onClick={() => setSaved((value) => !value)}><Pin aria-hidden="true" />{saved ? "Saved" : "Save"}</button>
          </div>
          <div className="yt-ui2-thesis">
            <span>Working thesis · fixed UI copy</span>
            <blockquote>{profile.thesis}</blockquote>
            <div><TruthPill tone="demo">User-editable foundation</TruthPill><span>Last organized in this local preview</span></div>
          </div>
          <div className="yt-ui2-confidence">
            <div><span>Confidence framework</span><strong>{profile.confidence}<small>/100</small></strong></div>
            <i><b style={{ width: `${profile.confidence}%` }} /></i>
            <p>Illustrative UI score. It is not produced by an analyst, model, or connected data source.</p>
          </div>
        </Panel>

        <Panel title="Saved research" icon={BookOpen} meta={<TruthPill tone="demo">Local demo organization</TruthPill>} className="yt-ui2-saved-research">
          <div className="yt-ui2-report-list">
            {savedResearch.map((item, index) => (
              <button
                aria-controls="yt-ui2-saved-research-selection"
                aria-pressed={selectedReport === index}
                className={selectedReport === index ? "is-active" : undefined}
                key={item.title}
                onClick={() => setSelectedReport(index)}
                type="button"
              >
                <FileText aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.scope === "ACTIVE SYMBOL" ? symbol : item.scope} · deterministic artifact</small></span><TruthPill tone="neutral">{item.state}</TruthPill><ChevronRight aria-hidden="true" />
              </button>
            ))}
          </div>
          <div aria-label="Selected saved research details" className="yt-ui2-report-selection" id="yt-ui2-saved-research-selection" role="region" aria-live="polite">
            <span>Selected local artifact</span>
            <strong>{report.title}</strong>
            <p>{report.summary}</p>
          </div>
          <div className="yt-ui2-provenance-strip"><Database aria-hidden="true" /><span><b>Provenance:</b> UI-2 deterministic fixture</span><TruthPill tone="demo">No provider request</TruthPill></div>
        </Panel>
      </div>

      <div className="yt-ui2-research-analysis">
        <Panel title="Catalyst timeline" icon={CalendarDays} meta={<TruthPill tone="demo">Planning template</TruthPill>}>
          <div className="yt-ui2-timeline">
            {[
              ["T−30", "Frame the question", "Write the disconfirming evidence first."],
              ["T−7", "Reconcile sources", "Confirm source, timestamp, and freshness."],
              ["Event", "Observe the evidence", "Live event provider remains unavailable."],
              ["T+1", "Review the thesis", "Record what changed and why."],
            ].map(([time, title, body], index) => <div key={time} className={index === 2 ? "is-unavailable" : undefined}><span>{time}</span><i /><section><strong>{title}</strong><p>{body}</p></section></div>)}
          </div>
        </Panel>

        <Panel title="Risk factors" icon={ShieldAlert} meta={<TruthPill tone="demo">Framework</TruthPill>}>
          <div className="yt-ui2-risk-factor-list">
            {profile.risks.map((risk, index) => {
              const expanded = expandedRisk === risk;
              const detailsId = `yt-ui2-risk-details-${symbol.toLowerCase()}-${index}`;
              return (
                <div className={expanded ? "is-expanded" : undefined} key={risk}>
                  <button
                    aria-controls={detailsId}
                    aria-expanded={expanded}
                    onClick={() => setExpandedRisk(expanded ? null : risk)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span><strong>{risk}</strong><small>{index < 2 ? "Primary" : "Monitor"}</small><ChevronRight aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <motion.div
                        animate={{ height: "auto", opacity: 1 }}
                        aria-label={`${risk} demo framework details`}
                        className="yt-ui2-risk-factor-detail"
                        exit={{ height: 0, opacity: 0 }}
                        id={detailsId}
                        initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                        role="region"
                        transition={reducedMotion ? { duration: 0 } : { duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
                      >
                        <p>{riskFrameworkDetail(index)}</p>
                        <span>Demo framework · no provider evidence attached</span>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Evidence quality" icon={Eye} meta={<TruthPill tone="unavailable">Provider boundary</TruthPill>}>
          <div className="yt-ui2-evidence-list">
            <div><span>Company filings</span><strong>Unavailable</strong><small>No filing provider configured</small></div>
            <div><span>Analyst research</span><strong>Unavailable</strong><small>No licensed feed configured</small></div>
            <div><span>Market observations</span><strong>Historical demo</strong><small>Fixed UI fixture only</small></div>
            <div><span>User notes</span><strong>Foundation</strong><small>Local organization surface</small></div>
          </div>
        </Panel>
      </div>

      <div className="yt-ui2-provider-boundary">
        <motion.article variants={panelReveal}><UserRound aria-hidden="true" /><div><TruthPill tone="unavailable">Analyst content unavailable</TruthPill><h2>Licensed research is not connected.</h2><p>No ratings, targets, estimates, or analyst commentary are shown.</p></div></motion.article>
        <motion.article variants={panelReveal}><Sparkles aria-hidden="true" /><div><TruthPill tone="unavailable">AI synthesis unavailable</TruthPill><h2>No model has evaluated this thesis.</h2><p>The worksheet preserves space for cited synthesis after provider approval.</p></div></motion.article>
      </div>
    </RouteMotion>
  );
}

type NewsReviewState = "Unavailable" | "Empty" | "Loading";

export function NewsRoute() {
  const [state, setState] = useState<NewsReviewState>("Unavailable");
  const [impact, setImpact] = useState("All impact");
  const [sentiment, setSentiment] = useState("All sentiment");

  return (
    <RouteMotion className="yt-ui2-news-route">
      <RouteHeader
        eyebrow="Meridian OS · News intelligence"
        title="News"
        description="A provenance-first news workspace that stays intentionally empty until a licensed source is configured."
        icon={Newspaper}
        truth={<TruthPill tone="unavailable">News provider unavailable</TruthPill>}
      />

      <motion.section variants={panelReveal} className="yt-ui2-news-unavailable">
        <div className="yt-ui2-provider-orbit" aria-hidden="true"><Newspaper /></div>
        <div>
          <TruthPill tone="unavailable">Provider not configured</TruthPill>
          <h2>No invented headlines. No ambiguous freshness.</h2>
          <p>Meridian OS will show source, publish time, market time, watchlist relevance, and impact classification only after the news provider phase is approved.</p>
          <div className="yt-ui2-news-guarantees"><span><Check />Source attribution</span><span><Check />Freshness state</span><span><Check />Watchlist relevance</span><span><Check />Impact classification</span></div>
        </div>
        <aside><span>Provider state</span><strong>Unavailable</strong><small>0 live headlines · 0 requests</small></aside>
      </motion.section>

      <Panel title="Intelligence feed" icon={Activity} meta={<TruthPill tone="unavailable">No source connected</TruthPill>} className="yt-ui2-news-feed" action={<SegmentedControl label="News state preview" options={["Unavailable", "Empty", "Loading"]} value={state} onChange={(value) => setState(value as NewsReviewState)} compact />}>
        <div className="yt-ui2-news-toolbar">
          <div><Filter aria-hidden="true" /><span>Filter architecture</span></div>
          <SegmentedControl label="Impact filter" options={["All impact", "High", "Medium", "Low"]} value={impact} onChange={setImpact} compact />
          <SegmentedControl label="Sentiment filter" options={["All sentiment", "Positive", "Neutral", "Negative"]} value={sentiment} onChange={setSentiment} compact />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {state === "Loading" ? (
            <motion.div className="yt-ui2-news-loading" key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-label="News loading state preview">
              {[0, 1, 2].map((item) => <div key={item}><i /><span><b /><b /><b /></span></div>)}
              <p><LoaderCircle aria-hidden="true" /> Loading-state preview only · no request in progress</p>
            </motion.div>
          ) : (
            <motion.div className="yt-ui2-news-empty" key={state} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {state === "Unavailable" ? <CloudOff aria-hidden="true" /> : <Newspaper aria-hidden="true" />}
              <div><strong>{state === "Unavailable" ? "Feed unavailable" : "No items match this review state"}</strong><p>{state === "Unavailable" ? "Connect an approved provider before source-bearing items can appear." : `No deterministic items for ${impact.toLowerCase()} and ${sentiment.toLowerCase()}.`}</p></div>
              <TruthPill tone={state === "Unavailable" ? "unavailable" : "neutral"}>{state}</TruthPill>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      <div className="yt-ui2-news-grid">
        <Panel title="Source & freshness architecture" icon={Database} meta={<TruthPill tone="neutral">Contract ready</TruthPill>}>
          <div className="yt-ui2-source-flow">
            {[
              ["01", "Source", "Publisher + canonical URL"],
              ["02", "Freshness", "Published + observed timestamps"],
              ["03", "Relevance", "Symbols + portfolio overlap"],
              ["04", "Impact", "Category + confidence"],
            ].map(([step, title, body], index) => <div key={step}><span>{step}</span><section><strong>{title}</strong><p>{body}</p></section>{index < 3 ? <ChevronRight aria-hidden="true" /> : null}</div>)}
          </div>
        </Panel>
        <Panel title="Watchlist relevance" icon={Target} meta={<TruthPill tone="demo">Structure preview</TruthPill>}>
          <div className="yt-ui2-relevance-list">
            {dashboardDemo.watchlist.items.slice(0, 4).map((item) => <div key={item.symbol}><b>{item.symbol}</b><span>{item.company}</span><strong>0 sourced items</strong><TruthPill tone="unavailable">Unavailable</TruthPill></div>)}
          </div>
        </Panel>
      </div>

      <div className="yt-ui2-news-categories">
        {[
          [BarChart3, "Earnings", "Financial results and guidance", "High impact"],
          [Gauge, "Macro", "Rates, inflation, and policy", "Market-wide"],
          [ShieldAlert, "Regulatory", "Filings and policy actions", "Event risk"],
          [Activity, "Company", "Operations and leadership", "Issuer-specific"],
        ].map(([Icon, title, body, meta]) => (
          <motion.article key={String(title)} variants={panelReveal}><span><Icon aria-hidden="true" /></span><div><h3>{String(title)}</h3><p>{String(body)}</p></div><small>{String(meta)}</small><b>0</b></motion.article>
        ))}
      </div>
    </RouteMotion>
  );
}

type AIReviewState = "Generated demo" | "Loading" | "Unavailable" | "Error";

const aiPrompts = [
  {
    id: "brief",
    icon: Sparkles,
    label: "Morning briefing",
    prompt: "Frame the fixed market snapshot for a morning review.",
    title: "Technology leadership is constructive, but concentration deserves the first look.",
    body: "The deterministic UI fixture shows positive breadth and contained volatility. In the demo portfolio, technology names contribute more modeled risk than their position count suggests.",
    evidence: ["Historical demo chart", "Demo breadth fixture", "Demo portfolio fixture"],
    confidence: 74,
  },
  {
    id: "move",
    icon: Activity,
    label: "Explain a move",
    prompt: "Explain the fixed SPX demonstration move.",
    title: "The sample advance is broad enough to support the move, with leadership concentrated in technology.",
    body: "This explanation is composed from static UI values. It does not inspect news, order flow, live quotes, or a model response.",
    evidence: ["Historical demo chart", "Demo heatmap", "No news provider"],
    confidence: 67,
  },
  {
    id: "risk",
    icon: ShieldAlert,
    label: "Portfolio risk",
    prompt: "Review concentration in the demo portfolio.",
    title: "Four technology positions dominate the fixed portfolio’s modeled risk contribution.",
    body: "The sample suggests reviewing sleeve limits and correlated exposure. It is a visual demonstration, not advice or an analysis of a real account.",
    evidence: ["Demo holdings", "Fixture-derived risk", "No brokerage connection"],
    confidence: 72,
  },
  {
    id: "scan",
    icon: Search,
    label: "Opportunity scan",
    prompt: "Scan the fixed watchlist for review priorities.",
    title: "NVDA is the first sample to review because momentum and portfolio concentration overlap.",
    body: "The static ranking demonstrates information hierarchy only. No model, screener, provider, or recommendation engine was called.",
    evidence: ["Demo watchlist", "Demo opportunities", "Static ranking"],
    confidence: 64,
  },
  {
    id: "research",
    icon: BookOpen,
    label: "Research synthesis",
    prompt: "Synthesize the NVDA demo thesis and risks.",
    title: "Platform demand is the working thesis; valuation and customer concentration are the disconfirming tests.",
    body: "This is fixed interface copy designed to show how citations, confidence, and limitations will be presented after provider approval.",
    evidence: ["Demo research worksheet", "Static risk factors", "Analyst feed unavailable"],
    confidence: 69,
  },
] as const;

export function AIHubRoute() {
  const [selectedId, setSelectedId] = useState("brief");
  const [reviewState, setReviewState] = useState<AIReviewState>("Generated demo");
  const [draft, setDraft] = useState("");
  const selected = useMemo(() => aiPrompts.find((item) => item.id === selectedId) ?? aiPrompts[0], [selectedId]);

  function submitPrompt(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setReviewState("Unavailable");
    setDraft("");
  }

  return (
    <RouteMotion className="yt-ui2-ai-route">
      <RouteHeader
        eyebrow="Meridian OS · Intelligence workspace"
        title="AI Hub"
        description="A provider-neutral conversation and synthesis surface. All visible answers are static AI-generated Demo samples; no model is called."
        icon={BrainCircuit}
        truth={<><TruthPill tone="ai">AI-generated Demo</TruthPill><TruthPill tone="unavailable">Provider unavailable</TruthPill></>}
      />

      <div className="yt-ui2-ai-status-row">
        <motion.article variants={panelReveal}><Bot aria-hidden="true" /><span>AI provider<strong>Not configured</strong></span><TruthPill tone="unavailable">Unavailable</TruthPill></motion.article>
        <motion.article variants={panelReveal}><Activity aria-hidden="true" /><span>Model calls<strong>0 this session</strong></span><TruthPill tone="neutral">Local preview</TruthPill></motion.article>
        <motion.article variants={panelReveal}><Database aria-hidden="true" /><span>Sample source<strong>Static UI-2 fixture</strong></span><TruthPill tone="demo">Demo</TruthPill></motion.article>
        <motion.article variants={panelReveal}><ShieldAlert aria-hidden="true" /><span>Production actions<strong>Disabled</strong></span><TruthPill tone="neutral">Fail closed</TruthPill></motion.article>
      </div>

      <div className="yt-ui2-ai-workspace">
        <Panel title="Prompt library" icon={Sparkles} meta={<TruthPill tone="demo">Static samples</TruthPill>} className="yt-ui2-prompt-library">
          <div className="yt-ui2-prompt-list">
            {aiPrompts.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setReviewState("Generated demo"); }} className={selectedId === item.id ? "is-active" : undefined} aria-pressed={selectedId === item.id}><Icon aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.prompt}</small></span><ChevronRight aria-hidden="true" /></button>;
            })}
          </div>
          <div className="yt-ui2-ai-boundary"><CloudOff aria-hidden="true" /><span><strong>Provider boundary</strong>No prompt leaves this browser preview.</span></div>
        </Panel>

        <Panel
          title="Meridian conversation"
          icon={MessageSquare}
          meta={<TruthPill tone="ai">AI-generated Demo</TruthPill>}
          className="yt-ui2-conversation"
          action={<SegmentedControl label="AI response state preview" options={["Generated demo", "Loading", "Unavailable", "Error"]} value={reviewState} onChange={(value) => setReviewState(value as AIReviewState)} compact />}
        >
          <div className="yt-ui2-chat-scroll" aria-live="polite">
            <div className="yt-ui2-user-message"><span><UserRound aria-hidden="true" /></span><div><small>Review prompt · local fixture</small><p>{selected.prompt}</p></div></div>
            <AnimatePresence mode="wait" initial={false}>
              {reviewState === "Generated demo" ? (
                <motion.div key={`${selected.id}-generated`} className="yt-ui2-ai-message" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: motionTokens.duration.interface, ease: motionTokens.ease.out }}>
                  <span><Bot aria-hidden="true" /></span>
                  <div>
                    <div className="yt-ui2-ai-message-meta"><TruthPill tone="ai">AI-generated Demo</TruthPill><span>Static sample · no model call</span></div>
                    <h3>{selected.title}</h3>
                    <p>{selected.body}</p>
                    <section><strong>Evidence used in this sample</strong>{selected.evidence.map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}</section>
                    <footer><span>Sample confidence</span><i><b style={{ width: `${selected.confidence}%` }} /></i><strong>{selected.confidence}%</strong><small>UI demonstration only</small></footer>
                  </div>
                </motion.div>
              ) : reviewState === "Loading" ? (
                <motion.div key="loading" className="yt-ui2-ai-state is-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status"><LoaderCircle aria-hidden="true" /><div><strong>Loading-state preview</strong><p>No request is in progress and no provider was contacted.</p><span><i /><i /><i /></span></div></motion.div>
              ) : reviewState === "Unavailable" ? (
                <motion.div key="unavailable" className="yt-ui2-ai-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><CloudOff aria-hidden="true" /><div><TruthPill tone="unavailable">Unavailable</TruthPill><strong>AI provider is not configured.</strong><p>Production prompts remain disabled until an approved provider is connected.</p></div></motion.div>
              ) : (
                <motion.div key="error" className="yt-ui2-ai-state is-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AlertTriangle aria-hidden="true" /><div><TruthPill tone="unavailable">Review error</TruthPill><strong>Response could not be prepared.</strong><p>This is a forced UI state. No external request failed.</p><button type="button" onClick={() => setReviewState("Generated demo")}><RotateCcw aria-hidden="true" />Return to demo sample</button></div></motion.div>
              )}
            </AnimatePresence>
          </div>
          <form className="yt-ui2-prompt-composer" onSubmit={submitPrompt}>
            <label className="sr-only" htmlFor="yt-ui2-ai-prompt">Ask Meridian</label>
            <input id="yt-ui2-ai-prompt" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Meridian… provider unavailable in this preview" />
            <button type="submit" aria-label="Submit prompt to unavailable-state preview" disabled={!draft.trim()}><Send aria-hidden="true" /></button>
            <small>Submitting typed text opens the unavailable state. It never calls a model.</small>
          </form>
        </Panel>
      </div>

      <div className="yt-ui2-ai-bottom">
        <Panel title="Provenance & limitations" icon={Database} meta={<TruthPill tone="neutral">Always visible</TruthPill>}>
          <div className="yt-ui2-provenance-grid">
            <div><span>Content state</span><strong>AI-generated Demo</strong><small>Static authored sample</small></div>
            <div><span>Provider</span><strong>None</strong><small>No model or API request</small></div>
            <div><span>Evidence</span><strong>Fixed UI fixtures</strong><small>Not live or user-linked</small></div>
            <div><span>Use</span><strong>Visual review only</strong><small>Not investment advice</small></div>
          </div>
        </Panel>
        <Panel title="Capability readiness" icon={Gauge} meta={<TruthPill tone="unavailable">Deferred</TruthPill>}>
          <div className="yt-ui2-capability-list">
            {["Cited market briefing", "Portfolio risk synthesis", "Research comparison", "Watchlist opportunity scan"].map((item) => <div key={item}><span>{item}</span><strong>Provider required</strong><i /></div>)}
          </div>
        </Panel>
      </div>
    </RouteMotion>
  );
}
