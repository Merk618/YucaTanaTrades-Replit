import * as React from "react";
import { motion, type Variants } from "framer-motion";
import {
  TrendingUp, TrendingDown, Bot, Zap, Shield, Activity,
  ArrowUpRight, ArrowDownRight, Newspaper, Brain, Target,
  Clock, Flame, BarChart2, Lock,
} from "lucide-react";
import {
  mockPortfolioData, mockScannerResults,
  mockBotStatus, mockNewsCatalysts,
} from "@/data/mockData";
import { useGetPortfolioSummary, useGetBotsStatus } from "@workspace/api-client-react";
import {
  useMarketQuotes, useMarketSession, INDEX_SYMBOLS,
  isQuoteUsable, quoteTooltip, freshnessLabel, type Quote,
} from "@/hooks/use-market";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useCountUp } from "@/hooks/use-count-up";
import { useSpotlight } from "@/hooks/use-spotlight";
import { Sparkline, TICKER_SPARKLINES } from "@/components/sparkline";
import { DemoBadge } from "@/components/demo-badge";

// ─── Mouse-spotlight colors ──────────────────────────────────────────────────
// gold = neutral, emerald = positive performance, risk = amber/red alert cards
const SPOT_COLORS = {
  gold:    "rgba(212,175,55,0.18)",
  emerald: "rgba(34,197,94,0.16)",
  risk:    "rgba(245,158,11,0.18)",
} as const;

// Reusable glass card with a cursor-following radial spotlight (see .spotlight in index.css)
function SpotlightCard({
  spot = "gold", className, children, ...rest
}: {
  spot?: keyof typeof SPOT_COLORS;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();
  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn("glass-card spotlight", className)}
      style={{ ["--spot-color"]: SPOT_COLORS[spot] } as React.CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}

// ─── Animation presets ───────────────────────────────────────────────────────
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Capability badges ───────────────────────────────────────────────────────
const CAPABILITY_BADGES = [
  { label: "Stocks",     icon: BarChart2 },
  { label: "Options",    icon: Target    },
  { label: "Crypto",     icon: Activity  },
  { label: "Research",   icon: Brain     },
  { label: "Risk",       icon: Shield    },
  { label: "Bots",       icon: Bot       },
  { label: "Journal",    icon: Flame     },
  { label: "AI Briefing",icon: Zap       },
];

// ─── Metric card with count-up ───────────────────────────────────────────────
function MetricCard({
  label, rawValue, format, sub, up, icon: Icon,
}: {
  label: string;
  rawValue: number;
  format: (n: number) => string;
  sub?: string;
  up?: boolean;
  icon?: React.ElementType;
}) {
  const counted = useCountUp(rawValue);
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      variants={item}
      className="glass-card spotlight p-5 group cursor-default"
      style={{ ["--spot-color"]: up ? SPOT_COLORS.emerald : SPOT_COLORS.gold } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
        {Icon && (
          <Icon
            className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/40 transition-colors duration-300"
          />
        )}
      </div>
      <p className={cn(
        "font-mono text-2xl font-bold transition-colors duration-300 tabular-nums",
        up === undefined ? "text-foreground" : up ? "text-foreground group-hover:text-emerald-300" : "text-foreground group-hover:text-red-300"
      )}>
        {format(counted)}
      </p>
      {sub && (
        <p className={cn("text-xs mt-1.5 flex items-center gap-1 font-mono", up ? "text-emerald-400" : "text-red-400")}>
          {up ? <ArrowUpRight className="w-3 h-3 flex-shrink-0" /> : <ArrowDownRight className="w-3 h-3 flex-shrink-0" />}
          {sub}
        </p>
      )}
    </motion.div>
  );
}

// ─── Index card with sparkline ───────────────────────────────────────────────
function IndexCard({ symbol, price, change, changePercent, tooltip }: {
  symbol: string; price: number; change: number; changePercent: number; tooltip?: string;
}) {
  const isUp = change >= 0;
  const sparkData = TICKER_SPARKLINES[symbol] ?? [price * 0.96, price * 0.98, price];

  const prevPriceRef = React.useRef<number>(price);
  const [flashDir, setFlashDir] = React.useState<"up" | "down" | null>(null);
  const flashKeyRef = React.useRef(0);

  React.useEffect(() => {
    const prev = prevPriceRef.current;
    prevPriceRef.current = price;
    if (prev === price) return;
    flashKeyRef.current += 1;
    setFlashDir(price > prev ? "up" : "down");
    const t = setTimeout(() => setFlashDir(null), 900);
    return () => clearTimeout(t);
  }, [price]);

  return (
    <div
      title={tooltip}
      className={cn(
        "p-3 rounded-lg border transition-all duration-300 cursor-help group relative overflow-hidden",
        isUp
          ? "bg-background/60 border-border/40 hover:border-emerald-500/30 hover:shadow-[0_0_16px_rgba(34,197,94,0.08)]"
          : "bg-background/60 border-border/40 hover:border-red-500/25 hover:shadow-[0_0_16px_rgba(239,68,68,0.06)]"
      )}
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className="font-mono text-xs font-bold text-primary">{symbol}</p>
        <div className={cn("sparkline-glow", isUp ? "" : "sparkline-glow")} style={{ filter: isUp ? "drop-shadow(0 0 3px rgba(34,197,94,0.4))" : "drop-shadow(0 0 3px rgba(239,68,68,0.4))" }}>
          <Sparkline
            data={sparkData}
            color={isUp ? "#22C55E" : "#EF4444"}
            width={52}
            height={22}
            strokeWidth={1.5}
          />
        </div>
      </div>
      <p
        key={flashKeyRef.current}
        className={cn(
          "font-mono text-sm font-semibold tabular-nums rounded px-0.5 transition-colors",
          flashDir === "up"   && "animate-[price-flash-up_0.9s_ease-out] text-emerald-300",
          flashDir === "down" && "animate-[price-flash-down_0.9s_ease-out] text-red-300",
          !flashDir           && "text-foreground",
        )}
      >
        {price >= 1000
          ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
          : `$${price.toFixed(2)}`
        }
      </p>
      <p className={cn("font-mono text-[11px] mt-0.5 tabular-nums", isUp ? "text-emerald-400" : "text-red-400")}>
        {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
      </p>
    </div>
  );
}

// ─── Signal-type badge colors ─────────────────────────────────────────────────
const SIGNAL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Momentum":   { bg: "rgba(212,175,55,0.12)",  border: "rgba(212,175,55,0.30)", text: "#D4AF37" },
  "Breakout":   { bg: "rgba(59,130,246,0.12)",   border: "rgba(59,130,246,0.30)", text: "#60a5fa" },
  "Dip-Buy":    { bg: "rgba(34,197,94,0.10)",    border: "rgba(34,197,94,0.25)",  text: "#22C55E" },
  "Oversold":   { bg: "rgba(168,85,247,0.10)",   border: "rgba(168,85,247,0.25)", text: "#c084fc" },
  "Unusual Vol":{ bg: "rgba(249,115,22,0.10)",   border: "rgba(249,115,22,0.25)", text: "#fb923c" },
  "Options":    { bg: "rgba(239,68,68,0.10)",    border: "rgba(239,68,68,0.25)",  text: "#f87171" },
};

const RANK_COLORS = ["#D4AF37", "#B8B8B8", "#CD7F32", "#94a3b8", "#94a3b8"];

// ─── Risk alert severity ──────────────────────────────────────────────────────
const RISK_ALERTS = [
  { level: "high", msg: "NVDA options IV elevated — expiry this week",       detail: "IV Rank 82%"       },
  { level: "warn", msg: "Fed minutes release Thursday 2pm ET",               detail: "Macro event"       },
  { level: "warn", msg: "BTC above 65k — elevated trailing stop exposure",   detail: "Position review"   },
  { level: "low",  msg: "KTOS — earnings beat, risk resolved",               detail: "Resolved"          },
];

// ─── AI Briefing panel ────────────────────────────────────────────────────────
const AI_SECTIONS = [
  {
    label: "Bull Thesis", color: "#22C55E",
    text: "NVDA & AVGO maintaining semis leadership; data center capex cycle intact through 2026 with hyperscaler guidance.",
  },
  {
    label: "Watch", color: "#D4AF37",
    text: "Fed minutes Thursday — tone shift would affect rate-sensitive tech. Duration risk elevated.",
  },
  {
    label: "Crypto", color: "#60a5fa",
    text: "BTC holding 65k after institutional ETF inflows record. ETH lagging — watch ratio vs BTC.",
  },
  {
    label: "Nuclear / Defense", color: "#f97316",
    text: "SMR + KTOS both on watch for policy catalyst. Defense spending bills in Senate committee.",
  },
  {
    label: "Risk Flags", color: "#f87171",
    text: "Elevated VIX term structure. NVDA IV spike. Position sizing near upper limits on semis sleeve.",
  },
];

function AiBriefingPanel() {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="glass-card scan-effect overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.12)" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <span className="ai-orb" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-sm text-foreground">AI Daily Briefing</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", color: "#22C55E" }}>
                GPT-4o
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22C55E" }}>
                ▲ BULLISH
              </span>
              <DemoBadge />
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Sample briefing · AI is not a market-data source
            </p>
          </div>
        </div>

        {/* Confidence meter */}
        <div className="flex-shrink-0 text-right">
          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1">Confidence</p>
          <p className="font-mono font-bold text-sm text-primary">78<span className="text-[10px] text-muted-foreground">/100</span></p>
          <div className="w-16 h-1 rounded-full bg-muted/60 mt-1 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #B8860B, #D4AF37, #F5D76E)" }}
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="px-5 py-3 space-y-3">
        {(expanded ? AI_SECTIONS : AI_SECTIONS.slice(0, 3)).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-2.5"
          >
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 h-fit"
              style={{ background: `${s.color}16`, border: `1px solid ${s.color}40`, color: s.color }}
            >
              {s.label}
            </span>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">{s.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-2.5 text-[10px] text-muted-foreground/50 hover:text-primary/70 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        {expanded ? "▲ Show less" : `▼ Show ${AI_SECTIONS.length - 3} more sections`}
      </button>
    </div>
  );
}

// ─── Scroll reveal wrapper ────────────────────────────────────────────────────
function RevealSection({ children, className, delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn("reveal-hidden", isVisible && "reveal-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const { data: portfolioSummary } = useGetPortfolioSummary();
  const { data: botStatus } = useGetBotsStatus();
  const { data: session } = useMarketSession();
  const { data: quoteData } = useMarketQuotes(INDEX_SYMBOLS);

  const indexQuotes: Quote[] = (quoteData?.quotes ?? []).filter(isQuoteUsable);
  // Honest source label for the Index Overview footer, derived from the quotes.
  const hasDelayed = indexQuotes.some((q) => q.isDelayed);
  const hasCrypto = indexQuotes.some((q) => q.assetClass === "crypto");
  const indexSourceLabel = indexQuotes.length === 0
    ? "Awaiting source data"
    : [hasDelayed ? "Equities delayed ~15min" : null, hasCrypto ? "Crypto reference" : null]
        .filter(Boolean)
        .join(" · ") || "Reference data";

  // Honest market-status badge from the real session endpoint.
  const eqOpen = session?.equities.isOpen ?? false;
  const statusColor = eqOpen ? "#22C55E" : "#94a3b8";
  const statusLabel = session
    ? (session.equities.label ?? (eqOpen ? "Markets Open" : "Markets Closed"))
    : "Checking session…";

  const portfolio = portfolioSummary ?? {
    totalValue:    mockPortfolioData.rothIra.total + mockPortfolioData.individual.total + mockPortfolioData.crypto.total,
    dayChange:     mockPortfolioData.rothIra.dayChange + mockPortfolioData.individual.dayChange + mockPortfolioData.crypto.dayChange,
    dayChangePct:  0.62,
    totalGain:     42183.44,
    totalGainPct:  23.6,
  };

  const bots   = botStatus ?? mockBotStatus;
  const topOpps = mockScannerResults.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0,   filter: "blur(0px)" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Status row */}
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
            style={{
              background: `${statusColor}14`,
              border: `1px solid ${statusColor}33`,
              color: statusColor,
            }}
          >
            <span className="ai-orb-sm" style={{ background: statusColor }} />
            {statusLabel}
          </span>
          <span className="text-xs text-muted-foreground/60">
            NYSE · NASDAQ{session?.crypto.isOpen ? " · Crypto 24/7" : ""}
          </span>
        </div>

        {/* Title with gold sweep */}
        <div className="relative inline-block overflow-hidden mb-1">
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            Meridian Intelligence Center
          </h1>
          {/* Sweeping gold highlight */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.12) 50%, transparent 100%)",
              transform: "translateX(-200%)",
            }}
            animate={{ transform: ["translateX(-200%)", "translateX(200%)"] }}
            transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-muted-foreground/70 text-sm mt-1 max-w-2xl"
        >
          Real-time trading intelligence across equities, options, crypto, research, risk, and automation.
        </motion.p>

        {/* Capability badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CAPABILITY_BADGES.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
              transition={{ delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-default group transition-all duration-200 hover:scale-105"
              style={{
                background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.16)",
                color: "rgba(212,175,55,0.7)",
              }}
              whileHover={{
                background: "rgba(212,175,55,0.12)",
                borderColor: "rgba(212,175,55,0.35)",
                boxShadow: "0 0 12px rgba(212,175,55,0.12)",
              } as Parameters<typeof motion.div>[0]["whileHover"]}
            >
              <badge.icon className="w-3 h-3" />
              <span className="text-[10px] font-semibold tracking-wide">{badge.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Metrics ────────────────────────────────────────────────────── */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Portfolio"
          rawValue={Math.round(portfolio.totalValue)}
          format={(n) => `$${n.toLocaleString("en-US")}`}
          sub={`${portfolio.dayChangePct >= 0 ? "+" : ""}${portfolio.dayChangePct.toFixed(2)}% today`}
          up={portfolio.dayChangePct >= 0}
          icon={TrendingUp}
        />
        <MetricCard
          label="Day P&L"
          rawValue={Math.round(Math.abs(portfolio.dayChange))}
          format={(n) => `${portfolio.dayChange >= 0 ? "+" : "-"}$${n.toLocaleString("en-US")}`}
          sub={portfolio.dayChange >= 0 ? "Positive session" : "Negative session"}
          up={portfolio.dayChange >= 0}
          icon={Activity}
        />
        <MetricCard
          label="Total Gain"
          rawValue={Math.round(portfolio.totalGain ?? 0)}
          format={(n) => `+$${n.toLocaleString("en-US")}`}
          sub={`+${portfolio.totalGainPct?.toFixed(1) ?? "—"}% all-time`}
          up
          icon={ArrowUpRight}
        />
        <MetricCard
          label="Active Bots"
          rawValue={2}
          format={(n) => `${n} / 2`}
          sub="All systems nominal"
          up
          icon={Bot}
        />
      </motion.div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* Left column: 8/12 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Index overview */}
          <RevealSection>
            <SpotlightCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-display font-semibold text-primary uppercase tracking-widest">Index Overview</h2>
                </div>
                <span className="text-[10px] text-muted-foreground/50 font-mono">{indexSourceLabel}</span>
              </div>
              {indexQuotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground/50 font-mono">
                  Market data sources unavailable
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {indexQuotes.map((q) => (
                    <IndexCard
                      key={q.symbol}
                      symbol={q.symbol}
                      price={q.price}
                      change={q.change}
                      changePercent={q.changePercent}
                      tooltip={quoteTooltip(q)}
                    />
                  ))}
                </div>
              )}
            </SpotlightCard>
          </RevealSection>

          {/* Top Opportunities + Risk Alerts */}
          <div className="grid grid-cols-2 gap-6">

            {/* Top Opportunities */}
            <RevealSection delay={40}>
              <SpotlightCard className="p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Top Opportunities</h3>
                  <DemoBadge className="ml-auto" />
                </div>
                <div className="space-y-0.5">
                  {topOpps.map((opp, i) => {
                    const sc = SIGNAL_COLORS[opp.setup] ?? SIGNAL_COLORS["Momentum"]!;
                    return (
                      <div
                        key={opp.symbol}
                        className="flex items-center justify-between py-2.5 px-2 rounded-lg border border-transparent hover:bg-muted/20 hover:border-border/30 transition-all duration-200 group cursor-default"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Rank badge */}
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{
                              background: `${RANK_COLORS[i]}18`,
                              border: `1px solid ${RANK_COLORS[i]}40`,
                              color: RANK_COLORS[i],
                            }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-mono text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {opp.symbol}
                          </span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                            style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                          >
                            {opp.setup}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className={cn("font-mono text-sm font-semibold tabular-nums", opp.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {opp.change >= 0 ? "+" : ""}{opp.change.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 font-mono w-8 text-right">
                            {opp.score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SpotlightCard>
            </RevealSection>

            {/* Risk Alerts */}
            <RevealSection delay={80}>
              <SpotlightCard spot="risk" className="p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Risk Alerts</h3>
                  <DemoBadge className="ml-auto" />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                    2 HIGH
                  </span>
                </div>
                <div className="space-y-2">
                  {RISK_ALERTS.map((alert, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-2.5 p-2.5 rounded-lg transition-all duration-200 cursor-default",
                        alert.level === "high"
                          ? "border border-red-500/20 hover:border-red-500/35 hover:bg-red-500/4"
                          : alert.level === "warn"
                          ? "border border-amber-500/15 hover:border-amber-500/30 hover:bg-amber-500/4"
                          : "border border-emerald-500/15 hover:border-emerald-500/25"
                      )}
                      style={alert.level === "high" ? {
                        boxShadow: "0 0 12px rgba(239,68,68,0.05)",
                      } : {}}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Shield
                          className="w-3.5 h-3.5"
                          style={{ color: alert.level === "high" ? "#f87171" : alert.level === "warn" ? "#D4AF37" : "#22C55E" }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground/80 leading-relaxed">{alert.msg}</p>
                        <p className="text-[9px] font-mono mt-1"
                          style={{ color: alert.level === "high" ? "#f87171" : alert.level === "warn" ? "#D4AF37" : "#22C55E" }}>
                          {alert.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </RevealSection>
          </div>

          {/* News & Catalysts */}
          <RevealSection delay={60}>
            <SpotlightCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-muted-foreground/70" />
                <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">News & Catalysts</h3>
                <DemoBadge className="ml-auto" />
              </div>
              <div className="space-y-3">
                {mockNewsCatalysts.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 group cursor-default">
                    <span
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{
                        background: n.sentiment === "bullish" ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                        border: `1px solid ${n.sentiment === "bullish" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                        color: n.sentiment === "bullish" ? "#22C55E" : "#f87171",
                      }}
                    >
                      {n.symbol}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/75 group-hover:text-foreground transition-colors duration-200 leading-relaxed">
                        {n.headline}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5 font-mono">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </RevealSection>
        </div>

        {/* Right column: 4/12 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* AI Daily Briefing */}
          <RevealSection delay={20}>
            <AiBriefingPanel />
          </RevealSection>

          {/* Bot status */}
          <RevealSection delay={60}>
            <SpotlightCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Bot Status</h3>
                <DemoBadge className="ml-auto" />
                <Lock className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/40 font-mono">READ-ONLY</span>
              </div>
              <div className="space-y-3">
                {Object.entries(bots).map(([key, bot]) => (
                  <div key={key} className="p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold text-foreground capitalize">
                        {key === "moomoo" ? "MooMoo Bot" : "Crypto Hunter"}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={bot.status === "online" || bot.status === "scanning"
                          ? { background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)", color: "#22C55E" }
                          : { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                      >
                        <span className="ai-orb-sm" style={{ background: bot.status === "online" || bot.status === "scanning" ? "#22C55E" : "#EF4444" }} />
                        {bot.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
                      <span>Last scan: {bot.lastScan ? freshnessLabel(bot.lastScan) : "—"}</span>
                      <span>{bot.scansToday} today</span>
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </RevealSection>

          {/* Market regime */}
          <RevealSection delay={100}>
            <SpotlightCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Market Regime</h3>
                <DemoBadge className="ml-auto" />
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Trend",       value: "Bullish",    color: "#22C55E", pct: 72 },
                  { label: "Volatility",  value: "Elevated",   color: "#D4AF37", pct: 58 },
                  { label: "Momentum",    value: "Strong",     color: "#22C55E", pct: 81 },
                  { label: "Breadth",     value: "Narrowing",  color: "#f97316", pct: 44 },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{stat.label}</span>
                      <span className="text-[10px] font-semibold font-mono" style={{ color: stat.color }}>{stat.value}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: stat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.pct}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </RevealSection>
        </div>
      </div>
    </div>
  );
}
