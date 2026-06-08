import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Globe } from "lucide-react";
import {
  useMarketQuotes,
  useMarketSession,
  isQuoteUsable,
  formatPrice,
  quoteBadge,
  quoteTooltip,
  type Quote,
} from "@/hooks/use-market";
import { DemoBadge } from "@/components/demo-badge";
import { cn } from "@/lib/utils";

const TABS = ["All", "Stocks", "Crypto", "ETFs", "Watchlist"];

// Symbols the Markets page tracks. Equities/ETFs resolve via Yahoo (delayed),
// crypto via CoinGecko (reference). Only symbols backed by a real source are
// requested — nothing fabricated.
const MARKET_SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA",
  "MSFT", "NVDA", "AVGO",
  "BTC", "ETH", "SOL", "SUI",
] as const;

const CATEGORY: Record<string, string[]> = {
  Stocks: ["MSFT", "NVDA", "AVGO"],
  Crypto: ["BTC", "ETH", "SOL", "SUI"],
  ETFs: ["SPY", "QQQ", "IWM", "DIA"],
  Watchlist: ["MSFT", "AVGO", "BTC", "ETH", "SOL", "NVDA"],
};

const BADGE_TONE: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  delayed: "bg-primary/15 text-primary border-primary/20",
  ref: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  stale: "bg-red-500/15 text-red-400 border-red-500/20",
};

function QuoteCard({ q }: { q: Quote }) {
  const up = q.change >= 0;
  const badge = quoteBadge(q);
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      title={quoteTooltip(q)}
      className={cn("glass-card p-5 cursor-help transition-all", up ? "hover:border-emerald-500/30" : "hover:border-red-500/30")}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono font-bold text-primary text-base">{q.symbol}</span>
        {up ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
      <p className="font-mono text-2xl font-bold text-foreground mb-1">${formatPrice(q.price)}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn("font-mono text-xs font-semibold px-1.5 py-0.5 rounded", up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
          {up ? "+" : ""}{q.changePercent.toFixed(2)}%
        </span>
        <span className={cn("font-mono text-xs", up ? "text-emerald-400" : "text-red-400")}>
          {up ? "+" : ""}{q.change.toFixed(q.price < 1 ? 4 : 2)}
        </span>
      </div>
      <span className={cn("inline-block mt-3 text-[9px] font-mono px-1.5 py-0.5 rounded border", BADGE_TONE[badge.tone])}>
        {badge.text}
      </span>
    </motion.div>
  );
}

export default function Markets() {
  const [activeTab, setActiveTab] = useState("All");
  const { data: quoteData } = useMarketQuotes(MARKET_SYMBOLS);
  const { data: session } = useMarketSession();

  const quotes: Quote[] = (quoteData?.quotes ?? []).filter(isQuoteUsable);

  const equitiesOpen = session?.equities?.isOpen ?? false;
  const statusLabel = equitiesOpen ? "EQUITIES OPEN" : "EQUITIES CLOSED";
  const statusClass = equitiesOpen
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-muted/40 text-muted-foreground border-border/40";

  const filtered = quotes.filter((q) => {
    if (activeTab === "All") return true;
    const allowed = CATEGORY[activeTab];
    return allowed ? allowed.includes(q.symbol) : true;
  });

  const gainers = [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Markets</h1>
          <span className={cn("px-2 py-0.5 rounded-full border text-xs font-semibold ml-2", statusClass)}>{statusLabel}</span>
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          Equities &amp; ETFs delayed ~15min (Yahoo) · Crypto reference (CoinGecko)
        </p>
      </motion.div>

      {quotes.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground/60 font-mono">
          Market data sources unavailable
        </div>
      ) : (
        <>
          {/* Gainers / Losers (derived from real quotes) */}
          <div className="grid grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-display font-semibold text-foreground">Top Gainers</h3>
              </div>
              <div className="space-y-2">
                {gainers.map((q) => (
                  <div key={q.symbol} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="font-mono text-sm font-bold text-primary">{q.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">${formatPrice(q.price)}</span>
                      <span className="font-mono text-xs text-emerald-400 font-semibold">+{q.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-display font-semibold text-foreground">Underperformers</h3>
              </div>
              <div className="space-y-2">
                {losers.map((q) => (
                  <div key={q.symbol} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="font-mono text-sm font-bold text-primary">{q.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">${formatPrice(q.price)}</span>
                      <span className="font-mono text-xs text-red-400 font-semibold">{q.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sector Heatmap — illustrative sample, not a live data feed */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-display font-semibold text-foreground">Sector Heatmap</h3>
              <DemoBadge />
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {[
                { name: "AI / Tech", change: 1.4 },
                { name: "Semis", change: 2.1 },
                { name: "Defense", change: 0.8 },
                { name: "Nuclear", change: 1.2 },
                { name: "Crypto", change: 3.5 },
                { name: "Fintech", change: -0.6 },
                { name: "Biotech", change: -1.2 },
                { name: "Energy", change: 0.3 },
                { name: "Quantum", change: 4.2 },
                { name: "Space", change: 2.8 },
                { name: "REITs", change: -0.9 },
                { name: "Utilities", change: 0.5 },
              ].map((sector) => (
                <div
                  key={sector.name}
                  className={cn(
                    "p-3 rounded-lg text-center border transition-colors",
                    sector.change >= 2
                      ? "bg-emerald-500/25 border-emerald-500/30"
                      : sector.change >= 0
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : sector.change >= -1
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-red-500/20 border-red-500/30"
                  )}
                >
                  <p className="text-[10px] font-semibold text-foreground/70">{sector.name}</p>
                  <p className={cn("font-mono text-sm font-bold mt-0.5", sector.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {sector.change >= 0 ? "+" : ""}{sector.change.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tab filter + Price grid */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card p-8 text-center text-xs text-muted-foreground/50 font-mono">
              No instruments available in this category
            </div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((q, i) => (
                <motion.div key={q.symbol} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <QuoteCard q={q} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
