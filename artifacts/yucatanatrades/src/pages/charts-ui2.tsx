import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BrainCircuit,
  Crosshair,
  DraftingCompass,
  Eye,
  GitCompareArrows,
  LayoutTemplate,
  ListFilter,
  LockKeyhole,
  Save,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import { MarketChart, type ChartWorkspaceView } from "@/components/ui1/market-chart";
import { motionTokens, panelReveal, staggerContainer, useAppReducedMotion } from "@/lib/motion";
import {
  Delta,
  MarketPanelHeading,
  MarketRouteHeading,
  TruthLabel,
} from "@/pages/market-route-primitives";
import { previewChartData } from "@/pages/preview-route";

type ChartSymbol = "SPX" | "NDX" | "AAPL" | "NVDA";
type LayoutPreset = "Structure" | "Risk map" | "Clean canvas";
type ScenarioPreset = "Core" | "Conservative" | "Momentum";

const layoutDescriptions: Record<LayoutPreset, string> = {
  Structure: "Balanced chart, watchlist, and analysis context",
  "Risk map": "Expanded risk geometry with supporting context",
  "Clean canvas": "Chart-only focus with context panels hidden",
};

function scaledChart(
  base: ChartWorkspaceView,
  symbol: ChartSymbol,
  name: string,
  scale: number,
  displayValue: string,
  changePercent: number,
): ChartWorkspaceView {
  return {
    ...base,
    symbol,
    name,
    displayValue,
    changePercent,
    asOf: "Historical demo · fixed at Jul 10, 2026 close",
    stateLabel: "Historical · Demo",
    timeframes: Object.fromEntries(
      Object.entries(base.timeframes).map(([timeframe, points]) => [
        timeframe,
        points.map((point) => ({
          ...point,
          open: point.open * scale,
          high: point.high * scale,
          low: point.low * scale,
          close: point.close * scale,
        })),
      ]),
    ),
  };
}

const chartSymbols: Record<ChartSymbol, ChartWorkspaceView> = {
  SPX: previewChartData,
  NDX: scaledChart(previewChartData, "NDX", "NASDAQ 100 Index", 3.4623, "18,275.41", 0.91),
  AAPL: scaledChart(previewChartData, "AAPL", "Apple Inc.", 0.03721, "196.42", 1.35),
  NVDA: scaledChart(previewChartData, "NVDA", "NVIDIA Corporation", 0.0251, "132.48", 1.62),
};

const symbolMeta: Record<ChartSymbol, { category: string; relation: string }> = {
  SPX: { category: "Index", relation: "Primary benchmark" },
  NDX: { category: "Index", relation: "Growth comparison" },
  AAPL: { category: "Equity", relation: "Watchlist context" },
  NVDA: { category: "Equity", relation: "Watchlist context" },
};

const riskZones: Record<ChartSymbol, Record<ScenarioPreset, { entry: string; invalidation: string; objective: string; budget: string }>> = {
  SPX: {
    Core: { entry: "5,270–5,278", invalidation: "5,238", objective: "5,320", budget: "0.60% illustrative" },
    Conservative: { entry: "5,252–5,260", invalidation: "5,220", objective: "5,306", budget: "0.40% illustrative" },
    Momentum: { entry: "Above 5,286", invalidation: "5,258", objective: "5,336", budget: "0.50% illustrative" },
  },
  NDX: {
    Core: { entry: "18,240–18,275", invalidation: "18,110", objective: "18,460", budget: "0.60% illustrative" },
    Conservative: { entry: "18,150–18,205", invalidation: "18,020", objective: "18,390", budget: "0.40% illustrative" },
    Momentum: { entry: "Above 18,310", invalidation: "18,205", objective: "18,520", budget: "0.50% illustrative" },
  },
  AAPL: {
    Core: { entry: "$195.20–$196.40", invalidation: "$192.80", objective: "$201.10", budget: "0.60% illustrative" },
    Conservative: { entry: "$193.40–$194.50", invalidation: "$190.90", objective: "$199.80", budget: "0.40% illustrative" },
    Momentum: { entry: "Above $197.10", invalidation: "$194.20", objective: "$203.00", budget: "0.50% illustrative" },
  },
  NVDA: {
    Core: { entry: "$130.80–$132.50", invalidation: "$127.90", objective: "$138.20", budget: "0.60% illustrative" },
    Conservative: { entry: "$128.60–$130.10", invalidation: "$125.40", objective: "$135.90", budget: "0.40% illustrative" },
    Momentum: { entry: "Above $133.20", invalidation: "$129.70", objective: "$140.10", budget: "0.50% illustrative" },
  },
};

function WorkspaceToolbar({
  symbol,
  onSymbolChange,
  layout,
  onLayoutChange,
}: {
  symbol: ChartSymbol;
  onSymbolChange: (symbol: ChartSymbol) => void;
  layout: LayoutPreset;
  onLayoutChange: (layout: LayoutPreset) => void;
}) {
  return (
    <motion.section className="yt-ui2-chart-toolbar" variants={panelReveal} aria-label="Chart workspace controls">
      <label className="yt-ui2-symbol-control" htmlFor="yt-ui2-chart-symbol">
        <span>Symbol</span>
        <span>
          <ScanLine aria-hidden="true" />
          <select
            id="yt-ui2-chart-symbol"
            value={symbol}
            onChange={(event) => onSymbolChange(event.target.value as ChartSymbol)}
          >
            {(Object.keys(chartSymbols) as ChartSymbol[]).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </span>
      </label>

      <div className="yt-ui2-toolbar-context">
        <span>{chartSymbols[symbol].name}</span>
        <small>{symbolMeta[symbol].category} · {symbolMeta[symbol].relation}</small>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {symbol}, {chartSymbols[symbol].name}. {layout} layout active. {layoutDescriptions[layout]}.
        </span>
      </div>

      <div className="yt-ui2-layout-toggle" role="group" aria-label="Workspace layout">
        {(["Structure", "Risk map", "Clean canvas"] as LayoutPreset[]).map((item) => (
          <button
            key={item}
            type="button"
            className={layout === item ? "is-active" : undefined}
            aria-pressed={layout === item}
            aria-controls="yt-ui2-chart-workspace yt-ui2-chart-context-rail yt-ui2-chart-analysis"
            onClick={() => onLayoutChange(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <span className="sr-only" id="yt-ui2-drawing-status">Drawing annotations are unavailable during UI-2.</span>
      <button
        className="yt-ui2-tool-button"
        type="button"
        disabled
        aria-describedby="yt-ui2-drawing-status"
        title="Drawing tools are unavailable during UI-2"
      >
        <DraftingCompass aria-hidden="true" />Drawing tools
      </button>
    </motion.section>
  );
}

function WatchlistContext({ symbol, onSelect }: { symbol: ChartSymbol; onSelect: (symbol: ChartSymbol) => void }) {
  const quotes: Array<{ symbol: ChartSymbol; name: string; value: string; change: number }> = [
    { symbol: "SPX", name: "S&P 500", value: "5,278.40", change: 0.82 },
    { symbol: "NDX", name: "NASDAQ 100", value: "18,275.41", change: 0.91 },
    { symbol: "AAPL", name: "Apple Inc.", value: "196.42", change: 1.35 },
    { symbol: "NVDA", name: "NVIDIA", value: "132.48", change: 1.62 },
  ];

  return (
    <motion.article className="yt-ui2-panel yt-ui2-chart-side-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Eye}
        title="Watchlist context"
        detail="Select a deterministic series"
        state="Demo"
        tone="demo"
      />
      <div className="yt-ui2-chart-watchlist">
        {quotes.map((item) => (
          <button
            key={item.symbol}
            type="button"
            className={symbol === item.symbol ? "is-active" : undefined}
            aria-pressed={symbol === item.symbol}
            onClick={() => onSelect(item.symbol)}
          >
            <span><strong>{item.symbol}</strong><small>{item.name}</small></span>
            <span><b>{item.value}</b><Delta value={item.change} /></span>
          </button>
        ))}
      </div>
    </motion.article>
  );
}

function SavedLayouts({ layout, onSelect }: { layout: LayoutPreset; onSelect: (layout: LayoutPreset) => void }) {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-chart-side-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Bookmark}
        title="Saved layouts"
        detail="Local UI state · not persisted"
        state="Demo"
        tone="demo"
      />
      <div className="yt-ui2-saved-layouts">
        {(["Structure", "Risk map", "Clean canvas"] as LayoutPreset[]).map((item, index) => (
          <button
            key={item}
            type="button"
            className={layout === item ? "is-active" : undefined}
            aria-pressed={layout === item}
            onClick={() => onSelect(item)}
          >
            <span><LayoutTemplate aria-hidden="true" /><i>{index + 1}</i></span>
            <span><strong>{item}</strong><small>{item === "Clean canvas" ? "Chart only emphasis" : `${item} review preset`}</small></span>
          </button>
        ))}
        <button
          type="button"
          disabled
          aria-label="Save current layout (unavailable; persistence is not configured)"
          title="Layout persistence is unavailable"
        >
          <span><Save aria-hidden="true" /></span>
          <span><strong>Save current</strong><small>Persistence unavailable</small></span>
        </button>
      </div>
    </motion.article>
  );
}

function RiskZonePanel({
  symbol,
  scenario,
  onScenarioChange,
}: {
  symbol: ChartSymbol;
  scenario: ScenarioPreset;
  onScenarioChange: (scenario: ScenarioPreset) => void;
}) {
  const reducedMotion = useAppReducedMotion();
  const zone = riskZones[symbol][scenario];

  return (
    <motion.article className="yt-ui2-panel yt-ui2-risk-zone-panel" variants={panelReveal}>
      <MarketPanelHeading
        icon={Target}
        title="Entry & risk zones"
        detail="Illustrative geometry · not guidance"
        state="Scenario · Demo"
        tone="demo"
      />
      <div className="yt-ui2-scenario-toggle" role="group" aria-label="Illustrative risk scenario">
        {(["Core", "Conservative", "Momentum"] as ScenarioPreset[]).map((item) => (
          <button
            key={item}
            type="button"
            className={scenario === item ? "is-active" : undefined}
            aria-pressed={scenario === item}
            onClick={() => onScenarioChange(item)}
          >{item}</button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.dl
          key={`${symbol}-${scenario}`}
          className="yt-ui2-risk-zones"
          aria-live="polite"
          aria-atomic="true"
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -3 }}
          transition={{ duration: reducedMotion ? 0 : motionTokens.duration.fast, ease: motionTokens.ease.out }}
        >
          <div className="is-entry"><dt><Crosshair aria-hidden="true" />Entry reference</dt><dd>{zone.entry}</dd></div>
          <div className="is-risk"><dt><ShieldCheck aria-hidden="true" />Invalidation</dt><dd>{zone.invalidation}</dd></div>
          <div className="is-objective"><dt><Target aria-hidden="true" />Objective</dt><dd>{zone.objective}</dd></div>
          <div><dt><LockKeyhole aria-hidden="true" />Risk budget</dt><dd>{zone.budget}</dd></div>
        </motion.dl>
      </AnimatePresence>
      <p className="yt-ui2-panel-note">Deterministic scenario labels do not use portfolio, broker, or account data.</p>
    </motion.article>
  );
}

function AiInterpretationPanel() {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-ai-interpretation" variants={panelReveal}>
      <MarketPanelHeading
        icon={BrainCircuit}
        title="AI interpretation"
        detail="Model provider not configured"
        state="Unavailable"
        tone="unavailable"
      />
      <div>
        <span className="yt-ui2-ai-orbit" aria-hidden="true"><Sparkles /></span>
        <div>
          <strong>No interpretation generated</strong>
          <p>AI calls remain outside UI-2. Structure, comparison, and risk-zone labels elsewhere on this route are deterministic demonstrations.</p>
          <TruthLabel tone="demo">Demo labels only</TruthLabel>
        </div>
      </div>
    </motion.article>
  );
}

function ToolFoundationPanel() {
  return (
    <motion.article className="yt-ui2-panel yt-ui2-tool-foundation" variants={panelReveal}>
      <MarketPanelHeading
        icon={DraftingCompass}
        title="Drawing foundation"
        detail="Reserved interaction layer"
        state="Unavailable"
        tone="unavailable"
      />
      <div className="yt-ui2-tool-foundation__body">
        <div><Crosshair aria-hidden="true" /><span><strong>Crosshair</strong><small>Native chart hover active</small></span></div>
        <div><SlidersHorizontal aria-hidden="true" /><span><strong>Indicators</strong><small>MA 8 and MA 21 toggle</small></span></div>
        <div><GitCompareArrows aria-hidden="true" /><span><strong>Comparison</strong><small>Deterministic benchmark toggle</small></span></div>
        <div className="is-unavailable"><DraftingCompass aria-hidden="true" /><span><strong>Annotations</strong><small>Provider/tooling deferred</small></span></div>
      </div>
    </motion.article>
  );
}

export function ChartsRoute() {
  const reducedMotion = useAppReducedMotion();
  const [symbol, setSymbol] = React.useState<ChartSymbol>("SPX");
  const [layout, setLayout] = React.useState<LayoutPreset>("Structure");
  const [scenario, setScenario] = React.useState<ScenarioPreset>("Core");

  return (
    <motion.div
      className="yt-ui2-route yt-ui2-charts-route"
      data-layout={layout.toLowerCase().replace(" ", "-")}
      variants={staggerContainer}
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div variants={panelReveal}>
        <MarketRouteHeading
          eyebrow="Analytical workspace · UI-2"
          title="Charts"
          description="Explore deterministic historical candles with real local controls. Provider data, persistent layouts, drawing tools, and model interpretation remain explicitly unavailable."
          state="Historical · Demo"
        />
      </motion.div>

      <WorkspaceToolbar
        symbol={symbol}
        onSymbolChange={setSymbol}
        layout={layout}
        onLayoutChange={setLayout}
      />

      <div className="yt-ui2-chart-layout" id="yt-ui2-chart-workspace">
        <motion.div className="yt-ui2-chart-primary" variants={panelReveal}>
          <div className="yt-ui2-chart-context">
            <span><ListFilter aria-hidden="true" />{layout} workspace</span>
            <span>Timeframe · Indicators · Compare · Expand</span>
            <TruthLabel tone="historical">Historical · Demo</TruthLabel>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={symbol}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: reducedMotion ? 0 : motionTokens.duration.interface, ease: motionTokens.ease.out }}
            >
              <MarketChart data={chartSymbols[symbol]} routeMode />
            </motion.div>
          </AnimatePresence>
          <div className="yt-ui2-chart-capabilities" aria-label="Chart capability status">
            <span><SlidersHorizontal aria-hidden="true" /><b>Indicators</b>Interactive</span>
            <span><GitCompareArrows aria-hidden="true" /><b>Compare</b>Demo benchmark</span>
            <span><ScanLine aria-hidden="true" /><b>Crosshair</b>Interactive</span>
            <span><DraftingCompass aria-hidden="true" /><b>Drawing</b>Unavailable</span>
          </div>
        </motion.div>

        <aside className="yt-ui2-chart-context-rail" id="yt-ui2-chart-context-rail" aria-label="Chart context">
          <WatchlistContext symbol={symbol} onSelect={setSymbol} />
          <SavedLayouts layout={layout} onSelect={setLayout} />
        </aside>
      </div>

      <div className="yt-ui2-chart-analysis-grid" id="yt-ui2-chart-analysis">
        <RiskZonePanel symbol={symbol} scenario={scenario} onScenarioChange={setScenario} />
        <AiInterpretationPanel />
        <ToolFoundationPanel />
      </div>
    </motion.div>
  );
}
