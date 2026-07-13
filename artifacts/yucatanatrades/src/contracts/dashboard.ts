export type DataTruthState =
  | "live"
  | "delayed"
  | "historical"
  | "demo"
  | "simulated"
  | "ai-generated"
  | "unavailable";

export type DataSourceType = "provider" | "cache" | "fixture" | "user" | "derived" | "ai";
export type DataFreshness = "fresh" | "aging" | "stale" | "unknown";
export type CacheState = "hit" | "miss" | "stale" | "none";
export type MarketDirection = "up" | "down" | "flat";

export interface DataContractError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface DataProvenance {
  state: DataTruthState;
  provider?: string;
  sourceType: DataSourceType;
  generatedAt?: string;
  receivedAt?: string;
  marketAt?: string;
  freshness: DataFreshness;
  delayedByMs?: number;
  cacheState: CacheState;
  error?: DataContractError;
}

export interface DataBearingPanel {
  provenance: DataProvenance;
  dataState: DataTruthState;
  statusMessage?: string;
}

export interface MarketSessionSnapshot extends DataBearingPanel {
  session: "pre-market" | "regular" | "after-hours" | "closed" | "unknown";
  label: string;
  exchangeTimezone: string;
  opensAt?: string;
  closesAt?: string;
}

export interface MarketStripInstrument {
  id: string;
  symbol: string;
  label: string;
  displayValue: string;
  changePercent: number;
  direction: MarketDirection;
  sparkline: number[];
}

export interface MarketStripSnapshot extends DataBearingPanel {
  session: MarketSessionSnapshot;
  items: MarketStripInstrument[];
}

export interface BriefingMetric {
  label: string;
  value: string;
  tone: "positive" | "neutral" | "caution";
}

export interface MarketBriefing extends DataBearingPanel {
  greeting: string;
  title: string;
  summary: string;
  actionLabel: string;
  metrics: BriefingMetric[];
}

export interface AIInsight extends DataBearingPanel {
  title: string;
  summary: string;
  generatedLabel: string;
  relatedSymbols: string[];
  actionLabel: string;
}

export interface PortfolioSummary extends DataBearingPanel {
  currency: string;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  unrealizedPnl: number;
  buyingPower: number;
  cashBalance: number;
  positionsCount: number;
  sparkline: number[];
}

export interface OpportunityItem {
  rank: number;
  symbol: string;
  company: string;
  changePercent: number;
  direction: MarketDirection;
  sparkline: number[];
}

export interface OpportunitySet extends DataBearingPanel {
  items: OpportunityItem[];
}

export interface CalendarEvent {
  id: string;
  timeLabel: string;
  title: string;
  category: string;
  dateLabel: string;
}

export interface CalendarSchedule extends DataBearingPanel {
  dateLabel: string;
  events: CalendarEvent[];
}

export interface ChartPoint {
  timestamp: string;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartCapabilities {
  indicators: boolean;
  compare: boolean;
  templates: boolean;
  expand: boolean;
  capture: boolean;
}

export interface ChartSnapshot extends DataBearingPanel {
  symbol: string;
  name: string;
  currency: string;
  seriesKind: "candlestick" | "line" | "area";
  timeframe: string;
  intervalLabel: string;
  availableTimeframes: string[];
  latestValue: number;
  displayValue: string;
  change: number;
  changePercent: number;
  direction: MarketDirection;
  isStatic: boolean;
  points: ChartPoint[];
  capabilities: ChartCapabilities;
}

export interface FearGreedSnapshot extends DataBearingPanel {
  value: number;
  label: string;
  dayChange: number;
}

export interface RiskMetric {
  label: string;
  value: string;
  tone: "low" | "moderate" | "high" | "unknown";
}

export interface RiskOverview extends DataBearingPanel {
  metrics: RiskMetric[];
}

export interface MarketBreadthSnapshot extends DataBearingPanel {
  advancingPercent: number;
  decliningPercent: number;
  unchangedPercent: number;
}

export interface HeatmapCell {
  id: string;
  sector: string;
  changePercent: number;
  weight: number;
}

export interface HeatmapSnapshot extends DataBearingPanel {
  cells: HeatmapCell[];
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  company: string;
  displayPrice: string;
  changePercent: number;
  direction: MarketDirection;
}

export interface WatchlistSnapshot extends DataBearingPanel {
  items: WatchlistItem[];
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
}

export interface NewsIntelligence extends DataBearingPanel {
  items: NewsItem[];
}

export interface ProviderCapabilityStatus {
  capability: string;
  state: "configured" | "not-configured" | "deferred" | "error";
  label: string;
}

export interface ProviderStatus extends DataBearingPanel {
  providerId: string;
  label: string;
  capabilities: ProviderCapabilityStatus[];
}

export interface SystemStatus extends DataBearingPanel {
  label: string;
  checks: Array<{
    id: string;
    label: string;
    state: "available" | "unavailable" | "deferred" | "unknown";
  }>;
}

export interface DashboardSnapshot {
  id: string;
  generatedAt: string;
  marketSession: MarketSessionSnapshot;
  marketStrip: MarketStripSnapshot;
  briefing: MarketBriefing;
  aiInsight: AIInsight;
  portfolio: PortfolioSummary;
  opportunities: OpportunitySet;
  calendar: CalendarSchedule;
  chart: ChartSnapshot;
  fearGreed: FearGreedSnapshot;
  risk: RiskOverview;
  breadth: MarketBreadthSnapshot;
  heatmap: HeatmapSnapshot;
  watchlist: WatchlistSnapshot;
  news: NewsIntelligence;
  providers: ProviderStatus[];
  system: SystemStatus;
}
