import {
  BriefcaseBusiness,
  CloudOff,
  DatabaseZap,
  Info,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { MarketChart, type ChartCandleView, type ChartWorkspaceView } from "@/components/ui1/market-chart";
import { PortfolioBand } from "@/components/ui1/portfolio-band";
import { dashboardDemo } from "@/data/ui1-demo";

function deterministicSeries(length: number, phase: number, labelEvery: number): ChartCandleView[] {
  let previous = 5208 + phase * 3;
  return Array.from({ length }, (_, index) => {
    const drift = index * 1.36;
    const wave = Math.sin(index * 0.63 + phase) * 9.4 + Math.sin(index * 0.18 + phase * 0.4) * 14;
    const close = 5208 + drift + wave;
    const open = previous + Math.sin(index * 1.17 + phase) * 2.8;
    const high = Math.max(open, close) + 3.2 + Math.abs(Math.sin(index * 0.91)) * 5.8;
    const low = Math.min(open, close) - 3.1 - Math.abs(Math.cos(index * 0.77)) * 5.1;
    previous = close;
    const hour = 9 + Math.floor((index * 390 / Math.max(1, length - 1) + 30) / 60);
    const minute = Math.floor((index * 390 / Math.max(1, length - 1) + 30) % 60);
    const time = index % labelEvery === 0
      ? `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`
      : `${hour}:${minute.toString().padStart(2, "0")}`;
    return {
      time,
      open,
      high,
      low,
      close,
      volume: 32 + Math.abs(Math.sin(index * 0.43 + phase)) * 76 + (index % 11 === 0 ? 42 : 0),
    };
  });
}

export const previewChartData: ChartWorkspaceView = {
  symbol: "SPX",
  name: "S&P 500 Index",
  displayValue: "5,278.40",
  changePercent: 0.82,
  asOf: "Historical demo · fixed at 4:00 PM ET",
  stateLabel: "Historical · Demo",
  timeframes: {
    "1D": deterministicSeries(58, 0.2, 10),
    "1W": deterministicSeries(52, 1.3, 9),
    "1M": deterministicSeries(48, 2.1, 8),
    "3M": deterministicSeries(46, 2.8, 8),
    "6M": deterministicSeries(44, 3.6, 8),
    "YTD": deterministicSeries(42, 4.3, 7),
    "1Y": deterministicSeries(40, 5.1, 7),
    "5Y": deterministicSeries(38, 6.2, 6),
    "All": deterministicSeries(36, 7.4, 6),
  },
};

function RouteHeading({
  eyebrow,
  title,
  description,
  state,
  tone,
}: {
  eyebrow: string;
  title: string;
  description: string;
  state: string;
  tone: "historical" | "demo" | "unavailable";
}) {
  return (
    <header className="yt-preview-route-heading">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <span className={`yt-state-pill is-${tone}`}>{state}</span>
    </header>
  );
}

function ChartSurface({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="yt-preview-route">
      <RouteHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        state="Historical · Demo"
        tone="historical"
      />
      <MarketChart data={previewChartData} routeMode />
      <div className="yt-preview-status-grid">
        <article>
          <DatabaseZap aria-hidden="true" />
          <div><strong>Historical adapter</strong><span>Deterministic fixture · no provider request</span></div>
          <span className="yt-state-pill is-demo">Demo</span>
        </article>
        <article>
          <Info aria-hidden="true" />
          <div><strong>Live series</strong><span>Deferred until visual geometry approval</span></div>
          <span className="yt-state-pill is-unavailable">Deferred</span>
        </article>
      </div>
    </div>
  );
}

export function ChartPreviewRoute() {
  return (
    <ChartSurface
      eyebrow="Analytical workspace · UI-1"
      title="Chart Workspace"
      description="Provider-neutral controls around a deterministic historical demonstration series."
    />
  );
}

export function MarketPreviewRoute() {
  return (
    <ChartSurface
      eyebrow="Market overview · UI-1"
      title="Markets"
      description="A historical demonstration surface for market exploration; live quotes and provider calls remain deferred."
    />
  );
}

export function PortfolioPreviewRoute() {
  return (
    <div className="yt-preview-route">
      <RouteHeading
        eyebrow="Portfolio workspace · UI-1"
        title="Portfolio"
        description="A deterministic demonstration snapshot with account, custody, and broker connections intentionally unavailable."
        state="Demo · Fixed"
        tone="demo"
      />
      <section className="yt-preview-portfolio" aria-label="Portfolio demonstration">
        <PortfolioBand data={dashboardDemo.portfolio} />
        <div className="yt-preview-status-grid">
          <article>
            <BriefcaseBusiness aria-hidden="true" />
            <div><strong>Portfolio snapshot</strong><span>Demo values · fixed fixture · no account connection</span></div>
            <span className="yt-state-pill is-demo">Demo</span>
          </article>
          <article>
            <CloudOff aria-hidden="true" />
            <div><strong>Broker and custody data</strong><span>Unavailable until the provider phase</span></div>
            <span className="yt-state-pill is-unavailable">Unavailable</span>
          </article>
        </div>
      </section>
    </div>
  );
}

const unavailableCopy = {
  news: {
    eyebrow: "News intelligence · UI-1",
    routeTitle: "News",
    title: "News provider unavailable",
    body: "No production news feed is connected during UI-1. The final surface preserves provenance, source, and freshness space without inventing headlines.",
    icon: CloudOff,
  },
  ai: {
    eyebrow: "AI intelligence · UI-1",
    routeTitle: "AI Intelligence",
    title: "AI provider unavailable",
    body: "The route and interaction shell are ready, but no model is called in UI-1. AI-generated examples on the dashboard remain explicitly labeled samples.",
    icon: Sparkles,
  },
  research: {
    eyebrow: "Research workspace · UI-1",
    routeTitle: "Research",
    title: "Research provider unavailable",
    body: "Research composition and source-provenance space are ready. Reports, analyst content, and AI synthesis remain unavailable until provider approval.",
    icon: BookOpen,
  },
} as const;

export function ProviderUnavailableRoute({ kind }: { kind: keyof typeof unavailableCopy }) {
  const copy = unavailableCopy[kind];
  const Icon = copy.icon;
  return (
    <div className="yt-preview-route yt-unavailable-route">
      <RouteHeading
        eyebrow={copy.eyebrow}
        title={copy.routeTitle}
        description={copy.body}
        state="Unavailable"
        tone="unavailable"
      />
      <section className="yt-unavailable-stage" aria-labelledby="yt-unavailable-title">
        <div className="yt-unavailable-orbit" aria-hidden="true"><Icon /></div>
        <div>
          <span className="yt-state-pill is-unavailable">Provider not configured</span>
          <h2 id="yt-unavailable-title">{copy.title}</h2>
          <p>Provider routing, credentials, caching, AI calls, and production content are outside the visual approval phase.</p>
        </div>
      </section>
    </div>
  );
}

export function ResearchPreviewRoute() {
  return <ProviderUnavailableRoute kind="research" />;
}
