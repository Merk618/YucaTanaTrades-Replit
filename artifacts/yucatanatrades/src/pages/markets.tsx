import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, RefreshCw, BarChart3, Coins, AlertTriangle, X,
} from "lucide-react";
import {
  useMarketQuotes, useMarketSession,
  isQuoteUsable, formatPrice, quoteBadge, quoteTooltip,
  type Quote,
} from "@/hooks/use-market";
import { DemoBadge } from "@/components/demo-badge";
import { cn } from "@/lib/utils";

const EQUITY_SYMBOLS = ["SPY", "QQQ", "IWM", "DIA", "MSFT", "NVDA", "AVGO"] as const;
const CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL", "SUI"] as const;
const INDEX_SYMS     = ["SPY", "QQQ", "IWM", "DIA"] as const;
const STOCK_SYMS     = ["MSFT", "NVDA", "AVGO"] as const;

const BADGE_TONE: Record<string, string> = {
  live:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  delayed: "bg-primary/15 text-primary border-primary/20",
  ref:     "bg-sky-500/15 text-sky-400 border-sky-500/20",
  stale:   "bg-red-500/15 text-red-400 border-red-500/20",
};

function usePrevPrice(price: number) {
  const ref  = useRef<number>(price);
  const prev = ref.current;
  useEffect(() => { ref.current = price; });
  return prev;
}

function QuoteCard({ q, teal = false, batchFlashKey = 0 }: { q: Quote; teal?: boolean; batchFlashKey?: number }) {
  const up    = q.change >= 0;
  const badge = quoteBadge(q);
  const prev  = usePrevPrice(q.price);
  const changed  = prev !== 0 && prev !== q.price;
  const flashDir = changed ? (q.price > prev ? "up" : "down") : null;
  const flashKey = useRef(0);
  if (changed) flashKey.current += 1;

  // Batch-refresh shimmer: fires a teal ring whenever a new data batch lands.
  // Uses local state so AnimatePresence can mount → animate → unmount cleanly.
  const [batchFlashId, setBatchFlashId] = useState(0);
  const [isBatchFlashing, setIsBatchFlashing] = useState(false);
  useEffect(() => {
    if (batchFlashKey <= 0) return;
    setBatchFlashId(id => id + 1);
    setIsBatchFlashing(true);
    const t = setTimeout(() => setIsBatchFlashing(false), 750);
    return () => clearTimeout(t);
  }, [batchFlashKey]);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      title={quoteTooltip(q)}
      className={cn(
        "glass-card p-5 cursor-help transition-all relative overflow-hidden",
        teal ? "hover:border-teal-500/40" : up ? "hover:border-emerald-500/30" : "hover:border-red-500/30"
      )}
      style={teal ? { borderColor: "rgba(20,184,166,0.20)" } : undefined}
    >
      <AnimatePresence>
        {flashDir && (
          <motion.div
            key={flashKey.current}
            initial={{ opacity: 0.35 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("absolute inset-0 rounded-[inherit] pointer-events-none",
              flashDir === "up" ? "bg-emerald-500/20" : "bg-red-500/20")}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isBatchFlashing && (
          <motion.div
            key={batchFlashId}
            initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{ background: "rgba(20,184,166,0.14)", boxShadow: "inset 0 0 0 1.5px rgba(20,184,166,0.60)" }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-3">
        <span className="font-mono font-bold text-base"
          style={{ color: teal ? "#22D3EE" : "#D4AF37" }}>
          {q.symbol}
        </span>
        {up
          ? <TrendingUp className={cn("w-4 h-4", teal ? "text-teal-400" : "text-emerald-400")} />
          : <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>

      <motion.p
        key={`${q.symbol}-${flashKey.current}`}
        initial={{ scale: 1.05 }} animate={{ scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "font-mono text-2xl font-bold mb-1 tabular-nums rounded px-0.5 transition-colors",
          flashDir === "up"   && "animate-[price-flash-up_0.9s_ease-out] text-emerald-300",
          flashDir === "down" && "animate-[price-flash-down_0.9s_ease-out] text-red-300",
          !flashDir           && "text-foreground",
        )}
      >
        ${formatPrice(q.price)}
      </motion.p>

      <div className="flex items-center gap-2 mt-1">
        <span className={cn("font-mono text-xs font-semibold px-1.5 py-0.5 rounded",
          up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
          {up ? "+" : ""}{q.changePercent.toFixed(2)}%
        </span>
        <span className={cn("font-mono text-xs", up ? "text-emerald-400" : "text-red-400")}>
          {up ? "+" : ""}{q.change.toFixed(q.price < 1 ? 4 : 2)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        <span className={cn("inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border",
          BADGE_TONE[badge.tone])}>
          {badge.text}
        </span>
        {q.isFallback && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/25">
            <AlertTriangle className="w-2.5 h-2.5" />
            via {q.provider}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function useMarketsQuotes() {
  const { data: session } = useMarketSession(2 * 60_000);
  const equitiesOpen = session?.equities?.isOpen ?? false;
  const cryptoOpen   = session?.crypto?.isOpen ?? true;

  const equityRefetch = equitiesOpen ? 30_000 : 5 * 60_000;
  const cryptoRefetch = equitiesOpen ? 30_000 : cryptoOpen ? 60_000 : 5 * 60_000;

  const equityResult = useMarketQuotes(EQUITY_SYMBOLS, equityRefetch);
  const cryptoResult = useMarketQuotes(CRYPTO_SYMBOLS, cryptoRefetch);

  return {
    allQuotes: [
      ...(equityResult.data?.quotes ?? []),
      ...(cryptoResult.data?.quotes ?? []),
    ] as Quote[],
    cryptoRefetch,
    equitiesOpen,
    isFetching: equityResult.isFetching || cryptoResult.isFetching,
    cryptoDataUpdatedAt: cryptoResult.dataUpdatedAt,
  };
}

// ─── Stock Market subview ─────────────────────────────────────────────────────
function StocksView({ allQuotes, isFetching, equitiesOpen }: {
  allQuotes: Quote[]; isFetching: boolean; equitiesOpen: boolean;
}) {
  const quotes  = allQuotes.filter(isQuoteUsable);
  const indexQ  = quotes.filter(q => (INDEX_SYMS as readonly string[]).includes(q.symbol));
  const stockQ  = quotes.filter(q => (STOCK_SYMS as readonly string[]).includes(q.symbol));
  const gainers = [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers  = [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const statusClass = equitiesOpen
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-muted/40 text-muted-foreground border-border/40";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Stock Market</h1>
          <span className={cn("px-2 py-0.5 rounded-full border text-xs font-semibold ml-2", statusClass)}>
            {equitiesOpen ? "EQUITIES OPEN" : "EQUITIES CLOSED"}
          </span>
          {isFetching && <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/50 animate-spin ml-1" />}
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          Equities &amp; ETFs delayed ~15min (Yahoo Finance) · Indices, stocks, and sector flow
        </p>
      </motion.div>

      {quotes.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground/60 font-mono">
          Market data sources unavailable
        </div>
      ) : (
        <>
          {indexQ.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Index Overview</h2>
                <span className="text-[10px] text-muted-foreground/50 font-mono">Delayed ~15min · Yahoo</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {indexQ.map((q, i) => (
                  <motion.div key={q.symbol} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <QuoteCard q={q} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {stockQ.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider mb-3">Key Stocks</h2>
              <div className="grid grid-cols-3 gap-4">
                {stockQ.map((q, i) => (
                  <motion.div key={q.symbol} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <QuoteCard q={q} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
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

            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
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

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-display font-semibold text-foreground">Sector Heatmap</h3>
              <DemoBadge />
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {[
                { name: "AI / Tech", change: 1.4 }, { name: "Semis", change: 2.1 },
                { name: "Defense",  change: 0.8 }, { name: "Nuclear", change: 1.2 },
                { name: "Crypto",   change: 3.5 }, { name: "Fintech", change: -0.6 },
                { name: "Biotech",  change: -1.2 }, { name: "Energy",  change: 0.3 },
                { name: "Quantum",  change: 4.2 }, { name: "Space",   change: 2.8 },
                { name: "REITs",    change: -0.9 }, { name: "Utilities", change: 0.5 },
              ].map((s) => (
                <div key={s.name} className={cn("p-3 rounded-lg text-center border transition-colors",
                  s.change >= 2 ? "bg-emerald-500/25 border-emerald-500/30"
                  : s.change >= 0 ? "bg-emerald-500/10 border-emerald-500/20"
                  : s.change >= -1 ? "bg-red-500/10 border-red-500/20"
                  : "bg-red-500/20 border-red-500/30")}>
                  <p className="text-[10px] font-semibold text-foreground/70">{s.name}</p>
                  <p className={cn("font-mono text-sm font-bold mt-0.5",
                    s.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

// ─── Crypto Market subview ────────────────────────────────────────────────────
function CryptoView({ allQuotes, isFetching, cryptoRefetch, cryptoDataUpdatedAt }: {
  allQuotes: Quote[]; isFetching: boolean; cryptoRefetch: number; cryptoDataUpdatedAt: number;
}) {
  const quotes   = allQuotes.filter(isQuoteUsable).filter(q => (CRYPTO_SYMBOLS as readonly string[]).includes(q.symbol));
  const byChange = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
  const best     = byChange[0];
  const label    = cryptoRefetch <= 30_000 ? "30 s" : cryptoRefetch <= 60_000 ? "60 s" : "5 min";
  const isLive   = quotes.some(q => q.isLive);

  // Fallback outage detection: collect unique fallback providers across all crypto quotes.
  const fallbackQuotes    = quotes.filter(q => q.isFallback);
  const fallbackProviders = [...new Set(fallbackQuotes.map(q => q.provider))];
  const anyFallback       = fallbackProviders.length > 0;
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Re-show banner when fallback state changes (new batch may restore primary source).
  const prevFallbackKey = useRef(anyFallback);
  useEffect(() => {
    if (anyFallback !== prevFallbackKey.current) {
      prevFallbackKey.current = anyFallback;
      if (anyFallback) setBannerDismissed(false);
    }
  }, [anyFallback]);

  // Increment batchFlashKey each time a new data batch lands (dataUpdatedAt changes).
  const [batchFlashKey, setBatchFlashKey] = useState(0);
  const prevUpdatedAt = useRef(cryptoDataUpdatedAt);
  useEffect(() => {
    if (cryptoDataUpdatedAt !== prevUpdatedAt.current && cryptoDataUpdatedAt > 0) {
      prevUpdatedAt.current = cryptoDataUpdatedAt;
      setBatchFlashKey(k => k + 1);
    }
  }, [cryptoDataUpdatedAt]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Coins className="w-5 h-5" style={{ color: "#22D3EE" }} />
          <h1 className="font-display text-3xl font-bold tracking-tight">Crypto Market</h1>
          <span className="px-2 py-0.5 rounded-full border text-xs font-semibold ml-2"
            style={{ background: "rgba(20,184,166,0.10)", borderColor: "rgba(20,184,166,0.24)", color: "#22D3EE" }}>
            CRYPTO 24/7
          </span>
          {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin ml-1" style={{ color: "#22D3EE" }} />}
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          {isLive ? "Live · Kraken exchange" : "Reference · CoinGecko"} · refreshes every {label}
        </p>
      </motion.div>

      <AnimatePresence>
        {anyFallback && !bannerDismissed && (
          <motion.div
            key="fallback-banner"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/8"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">Primary source unavailable</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Kraken is down — prices currently served via{" "}
                <span className="font-mono font-semibold text-amber-300">
                  {fallbackProviders.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                </span>
                . Quotes may differ slightly from exchange prices.
              </p>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="shrink-0 text-amber-400/60 hover:text-amber-300 transition-colors p-0.5 rounded"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {quotes.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground/60 font-mono">
          Crypto data sources unavailable
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-display font-semibold uppercase tracking-wider" style={{ color: "#22D3EE" }}>
                Live Prices
              </h2>
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {isLive ? "Live · Kraken" : "Reference · CoinGecko"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {byChange.map((q, i) => (
                <motion.div key={q.symbol} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <QuoteCard q={q} teal batchFlashKey={batchFlashKey} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="glass-card p-5" style={{ borderColor: "rgba(20,184,166,0.16)" }}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-display font-semibold text-foreground">Relative Strength</h3>
              <span className="text-[10px] text-muted-foreground/50 font-mono">ranked by session change</span>
            </div>
            <div className="space-y-3">
              {byChange.map((q, i) => {
                const up    = q.changePercent >= 0;
                const width = Math.min(100, Math.abs(q.changePercent) * 14);
                const medals = ["🥇", "🥈", "🥉", ""];
                return (
                  <div key={q.symbol} className="flex items-center gap-3">
                    <span className="text-xs w-5 text-center">{medals[i] ?? ""}</span>
                    <span className="font-mono text-sm font-bold w-12" style={{ color: "#22D3EE" }}>{q.symbol}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: up ? "rgba(20,184,166,0.75)" : "rgba(239,68,68,0.60)" }}
                      />
                    </div>
                    <span className={cn("font-mono text-xs font-semibold w-16 text-right",
                      up ? "text-emerald-400" : "text-red-400")}>
                      {up ? "+" : ""}{q.changePercent.toFixed(2)}%
                    </span>
                    <span className="font-mono text-xs text-muted-foreground/50 w-24 text-right">
                      ${formatPrice(q.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="grid grid-cols-3 gap-4">
            {[
              { label: "Market Status", value: "24/7 Active",    sub: "Crypto never closes",        teal: true  },
              { label: "Best Performer", value: best?.symbol ?? "—", sub: best ? `${best.changePercent >= 0 ? "+" : ""}${best.changePercent.toFixed(2)}% today` : "—", teal: false },
              { label: "Data Source",   value: isLive ? "Kraken" : "CoinGecko", sub: isLive ? "Live exchange" : "Reference data", teal: false },
            ].map((item) => (
              <div key={item.label} className="glass-card p-4 text-center"
                style={item.teal ? { borderColor: "rgba(20,184,166,0.22)" } : undefined}>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="font-mono font-bold text-lg"
                  style={{ color: item.teal ? "#22D3EE" : "#D4AF37" }}>{item.value}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

// ─── Markets root ─────────────────────────────────────────────────────────────
export default function Markets() {
  const [location] = useLocation();
  const { allQuotes, cryptoRefetch, equitiesOpen, isFetching, cryptoDataUpdatedAt } = useMarketsQuotes();
  const isCrypto = location === "/markets/crypto";

  if (isCrypto) {
    return <CryptoView allQuotes={allQuotes} isFetching={isFetching} cryptoRefetch={cryptoRefetch} cryptoDataUpdatedAt={cryptoDataUpdatedAt} />;
  }
  return <StocksView allQuotes={allQuotes} isFetching={isFetching} equitiesOpen={equitiesOpen} />;
}
