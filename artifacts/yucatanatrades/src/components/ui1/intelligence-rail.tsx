import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChevronDown,
  CloudOff,
  Database,
  Gauge,
  Newspaper,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type {
  AIInsight,
  CalendarSchedule,
  FearGreedSnapshot,
  NewsIntelligence,
  OpportunitySet,
  ProviderStatus,
  RiskOverview,
  SystemStatus,
} from "@/contracts/dashboard";
import { motionTokens } from "@/lib/motion";
import { TruthBadge } from "@/components/ui1/truth-badge";

function MiniSparkline({ values }: { values: number[] }) {
  const width = 72;
  const height = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / range) * 16 - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="#83bf86" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IntelligenceHeading({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  badge: React.ReactNode;
}) {
  return (
    <header className="yt-intelligence-heading">
      <div><Icon aria-hidden="true" /><h2>{title}</h2></div>
      {badge}
    </header>
  );
}

function AIInsightCard({ data }: { data: AIInsight }) {
  const [expanded, setExpanded] = React.useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  return (
    <article className="yt-intelligence-card yt-ai-insight">
      <IntelligenceHeading
        icon={Bot}
        title={data.title}
        badge={<TruthBadge state={data.dataState} label="AI-generated" compact title={data.statusMessage} />}
      />
      <div className="yt-ai-insight-body">
        <p>{data.summary}</p>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className="yt-ai-related"
              initial={reducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={reducedMotion
                ? { duration: 0 }
                : { duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
            >
              <span>Related demo symbols</span>
              {data.relatedSymbols.map((symbol) => <b key={symbol}>{symbol}</b>)}
            </motion.div>
          )}
        </AnimatePresence>
        <button type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
          {expanded ? "Close insight" : data.actionLabel}<ArrowRight aria-hidden="true" />
        </button>
      </div>
      <div className="yt-ai-wave" aria-hidden="true">
        <svg viewBox="0 0 340 112" preserveAspectRatio="none">
          <path d="M0 104C50 98 61 65 98 73C140 82 139 41 177 55C222 72 225 17 270 31C302 41 310 8 344 11" />
          <path d="M0 112C45 106 71 85 105 91C146 99 159 64 192 71C236 80 245 41 283 51C315 59 326 34 344 37" />
        </svg>
      </div>
    </article>
  );
}

function OpportunitiesCard({ data }: { data: OpportunitySet }) {
  const [selected, setSelected] = React.useState(data.items[0]?.symbol ?? "");
  return (
    <article className="yt-intelligence-card yt-opportunities">
      <IntelligenceHeading
        icon={TrendingUp}
        title="Top Opportunities"
        badge={<TruthBadge state={data.dataState} label="Demo ranking" compact title={data.statusMessage} />}
      />
      <div className="yt-opportunity-list" role="listbox" aria-label="Demo opportunities">
        {data.items.map((item) => (
          <button
            key={item.symbol}
            type="button"
            role="option"
            aria-selected={selected === item.symbol}
            className="yt-opportunity-row"
            onClick={() => setSelected(item.symbol)}
          >
            {selected === item.symbol && (
              <motion.span
                layoutId="yt-opportunity-selection"
                className="yt-opportunity-selection"
                transition={motionTokens.spring.snappy}
              />
            )}
            <span className="yt-opportunity-rank">{item.rank}</span>
            <span className="yt-opportunity-copy"><strong>{item.symbol}</strong><small>{item.company}</small></span>
            <span className="is-positive">+{item.changePercent.toFixed(2)}%</span>
            <MiniSparkline values={item.sparkline} />
          </button>
        ))}
      </div>
    </article>
  );
}

function CalendarCard({ data }: { data: CalendarSchedule }) {
  return (
    <article className="yt-intelligence-card yt-calendar">
      <IntelligenceHeading
        icon={CalendarDays}
        title="Market Calendar"
        badge={<TruthBadge state={data.dataState} compact title={data.statusMessage} />}
      />
      <div className="yt-calendar-unavailable">
        <CloudOff aria-hidden="true" />
        <div><strong>Calendar provider unavailable</strong><span>No events are fabricated in UI-1.</span></div>
      </div>
    </article>
  );
}

function NewsUnavailableCard({ data }: { data: NewsIntelligence }) {
  return (
    <article className="yt-intelligence-card yt-news-unavailable">
      <IntelligenceHeading
        icon={Newspaper}
        title="News Intelligence"
        badge={<TruthBadge state={data.dataState} label="Unavailable" compact title={data.statusMessage} />}
      />
      <div className="yt-news-unavailable-body">
        <CloudOff aria-hidden="true" />
        <div>
          <strong>News provider unavailable</strong>
          <span>No headlines are fabricated in UI-1.</span>
        </div>
      </div>
    </article>
  );
}

function FearGreedCard({ data }: { data: FearGreedSnapshot }) {
  const reducedMotion = Boolean(useReducedMotion());
  const dash = Math.max(0, Math.min(100, data.value));
  return (
    <article className="yt-intelligence-card yt-fear-greed">
      <IntelligenceHeading
        icon={Gauge}
        title="Fear & Greed"
        badge={<TruthBadge state={data.dataState} compact />}
      />
      <div className="yt-gauge">
        <svg viewBox="0 0 120 72" role="img" aria-label={`Fear and Greed demo value ${data.value}, ${data.label}`}>
          <defs>
            <linearGradient id="yt-gauge-gradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#e49a62" />
              <stop offset="52%" stopColor="#e7c47f" />
              <stop offset="100%" stopColor="#77b77a" />
            </linearGradient>
          </defs>
          <path className="yt-gauge-track" d="M16 62A44 44 0 0 1 104 62" pathLength="100" />
          <motion.path
            className="yt-gauge-value"
            d="M16 62A44 44 0 0 1 104 62"
            pathLength="100"
            strokeDasharray={`${dash} 100`}
            initial={reducedMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: motionTokens.duration.entrance, ease: motionTokens.ease.out, delay: motionTokens.delay.gauge }}
          />
        </svg>
        <div><strong>{data.value}</strong><span>{data.label}</span></div>
      </div>
      <p className="is-positive">↑ {data.dayChange} points today · Demo</p>
    </article>
  );
}

function RiskCard({ data }: { data: RiskOverview }) {
  return (
    <article className="yt-intelligence-card yt-risk-overview">
      <IntelligenceHeading
        icon={ShieldCheck}
        title="Risk Overview"
        badge={<TruthBadge state={data.dataState} compact />}
      />
      <dl>
        {data.metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd className={metric.tone === "low" ? "is-positive" : metric.tone === "moderate" ? "is-caution" : ""}>
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ProviderStatusCard({
  providers,
  system,
}: {
  providers: ProviderStatus[];
  system: SystemStatus;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const marketProvider = providers.find((provider) => provider.providerId === "market-data");
  const aiProvider = providers.find((provider) => provider.providerId === "ai");

  return (
    <article className="yt-intelligence-card yt-system-status">
      <button type="button" className="yt-system-status-toggle" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span><Database aria-hidden="true" /><strong>Provider &amp; system status</strong></span>
        <TruthBadge state="unavailable" label="Integrations deferred" compact />
        <ChevronDown className={expanded ? "is-expanded" : ""} aria-hidden="true" />
      </button>
      <div className="yt-status-rows">
        <div className="yt-status-row"><span>{marketProvider?.label ?? "Market data"}</span><b>Deferred</b></div>
        <div className="yt-status-row"><span>{aiProvider?.label ?? "AI provider"}</span><b>Not configured</b></div>
        {expanded && (
          <div className="yt-status-row"><span>{system.label}</span><b>Local preview only</b></div>
        )}
      </div>
    </article>
  );
}

export function IntelligenceRail({
  aiInsight,
  opportunities,
  calendar,
  fearGreed,
  risk,
  news,
  providers,
  system,
}: {
  aiInsight: AIInsight;
  opportunities: OpportunitySet;
  calendar: CalendarSchedule;
  fearGreed: FearGreedSnapshot;
  risk: RiskOverview;
  news: NewsIntelligence;
  providers: ProviderStatus[];
  system: SystemStatus;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  return (
    <motion.aside
      className="yt-intelligence-rail"
      aria-label="Market intelligence rail"
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
      variants={{
        hidden: { opacity: 0, x: 12 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { staggerChildren: motionTokens.stagger.dashboard, delayChildren: motionTokens.delay.intelligenceRail },
        },
      }}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 9 },
          visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.panel, ease: motionTokens.ease.out } },
        }}
      >
        <AIInsightCard data={aiInsight} />
      </motion.div>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 9 },
          visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.panel, ease: motionTokens.ease.out } },
        }}
      >
        <OpportunitiesCard data={opportunities} />
      </motion.div>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 9 },
          visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.panel, ease: motionTokens.ease.out } },
        }}
      >
        <CalendarCard data={calendar} />
      </motion.div>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 9 },
          visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.panel, ease: motionTokens.ease.out } },
        }}
      >
        <NewsUnavailableCard data={news} />
      </motion.div>
      <motion.div
        className="yt-risk-row"
        variants={{
          hidden: { opacity: 0, y: 9 },
          visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.panel, ease: motionTokens.ease.out } },
        }}
      >
        <FearGreedCard data={fearGreed} />
        <RiskCard data={risk} />
      </motion.div>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 9 },
          visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.panel, ease: motionTokens.ease.out } },
        }}
      >
        <ProviderStatusCard providers={providers} system={system} />
      </motion.div>
    </motion.aside>
  );
}
