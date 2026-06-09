import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Globe, RefreshCw } from "lucide-react";
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

const EQUITY_SYMBOLS = ["SPY", "QQQ", "IWM", "DIA", "MSFT", "NVDA", "AVGO"] as const;
const CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL", "SUI"] as const;

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

// Track the previous value of a quoted field to detect changes.
function usePrevPrice(price: number) {
  const ref = useRef<number>(price);
  const prev = ref.current;
  useEffect(() => {
    ref.current = price;
  });
  return prev;
}

function QuoteCard({ q }: { q: Quote }) {
  const up = q.change >= 0;
  const badge = quoteBadge(q);

  // Detect price changes to trigger flash animation.
  const prevPrice = usePrevPrice(q.price);
  const priceChanged = prevPrice !== 0 && prevPrice !== q.price;
  const flashDir = priceChanged ? (q.price > prevPrice ? "up" : "down") : null;

  // Each time price changes we bump a key so AnimatePresence remounts flash.
  const flashKey = useRef(0);
  if (priceChanged) flashKey.current += 1;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      title={quoteTooltip(q)}
      className={cn(
        "glass-card p-5 cursor-help transition-all relative overflow-hidden",
        up ? "hover:border-emerald-500/30" : "hover:border-red-500/30"
      )}
    >
      {/* Price-change flash overlay */}
      <AnimatePresence>
        {flashDir && (
          <motion.div
            key={flashKey.current}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "absolute inset-0 rounded-[inherit] pointer-events-none",
              flashDir === "up" ? "bg-emerald-500/20" : "bg-red-500/20"
            )}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-3">
        <span className="font-mono font-bold text-primary text-base">{q.symbol}</span>
        {up ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>

      {/* Price with subtle scale animation on change */}
      <motion.p
        key={q.price}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="font-mono text-2xl font-bold text-foreground mb-1"
      >
        ${formatPrice(q.price)}
      </motion.p>

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

// Session-aware quotes hook for the Markets page.
// Crypto refreshes at 30 s when equities are open (high-activity period),
// 60 s when equities are closed. Equities use 30 s / 5 min cadence.
function useMarketsQuotes() {
  const { data: session } = useMarketSession(2 * 60_000);
  const equitiesOpen = session?.equities?.isOpen ?? false;
  const cryptoOpen = session?.crypto?.isOpen ?? true;

  const equityRefetch = equitiesOpen ? 30_000 : 5 * 60_000;
  const cryptoRefetch = equitiesOpen ? 30_000 : cryptoOpen ? 60_000 : 5 * 60_000;

  const equityResult = useMarketQuotes(EQUITY_SYMBOLS, equityRefetch);
  const cryptoResult = useMarketQuotes(CRYPTO_SYMBOLS, cryptoRefetch);

  return {
    quotes: [
      ...(equityResult.data?.quotes ?? []),
      ...(cryptoResult.data?.quotes ?? []),
    ] as Quote[],
    cryptoRefetch,
    equitiesOpen,
    isFetching: equityResult.isFetching || cryptoResult.isFetching,
  };
}

export default function Markets() {
  const [activeTab, setActiveTab] = useState("All");
  const { quotes: allQuotes, cryptoRefetch, equitiesOpen, isFetching } = useMarketsQuotes();
  const { data: session } = useMarketSession();

  const quotes = allQuotes.filter(isQuoteUsable);

  const equitiesStatusLabel = equitiesOpen ? "EQUITIES OPEN" : "EQUITIES CLOSED";
  const statusClass = equitiesOpen
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-muted/40 text-muted-foreground border-border/40";

  const cryptoRefetchLabel = cryptoRefetch <= 30_000 ? "30 s" : cryptoRefetch <= 60_000 ? "60 s" : "5 min";

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
          <span className={cn("px-2 py-0.5 rounded-full border text-xs font-semibold ml-2", statusClass)}>
            {equitiesStatusLabel}
          </span>
          {isFetching && (
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/50 animate-spin ml-1" />
          )}
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          Equities &amp; ETFs delayed ~15min (Yahoo Finance) · Crypto refreshes every {cryptoRefetchLabel}
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
