import { useLocation, useSearch, Link } from "wouter";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, RefreshCw, BarChart3, Coins, AlertTriangle, X,
  Activity, Volume2, CalendarDays, Radio, Bookmark, ArrowRight,
  ShieldAlert, CircleOff, Layers, WifiOff,
} from "lucide-react";
import {
  useMarketQuotes, useMarketSession, useNow, freshnessLabel,
  isQuoteUsable, formatPrice, quoteBadge, quoteTooltip,
  type Quote,
} from "@/hooks/use-market";
import { cn } from "@/lib/utils";

// ─── Symbol groups ─────────────────────────────────────────────────────────────
const INDEX_SYMS   = ["SPY", "QQQ", "IWM", "DIA"] as const;
const MEGACAP_SYMS = ["NVDA", "MSFT", "AAPL", "AMZN", "META", "GOOGL", "AVGO", "TSLA"] as const;
const SECTOR_SYMS  = ["XLK", "XLF", "XLE", "XLI", "XLV", "XLU", "SOXX"] as const;
const EQUITY_SYMBOLS = [...INDEX_SYMS, ...MEGACAP_SYMS, ...SECTOR_SYMS] as const;

const CRYPTO_MAJOR_SYMS = ["BTC", "ETH", "SOL", "SUI"] as const;
const CRYPTO_WATCH_SYMS = ["XRP", "LINK", "AVAX", "DOGE"] as const;
const CRYPTO_SYMBOLS    = [...CRYPTO_MAJOR_SYMS, ...CRYPTO_WATCH_SYMS] as const;

const SECTOR_LABELS: Record<string, string> = {
  XLK: "Technology", XLF: "Financials", XLE: "Energy",
  XLI: "Industrials", XLV: "Healthcare", XLU: "Utilities", SOXX: "Semiconductors",
};

// ─── Badge tones ──────────────────────────────────────────────────────────────
const BADGE_TONE: Record<string, string> = {
  live:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  delayed: "bg-primary/15 text-primary border-primary/20",
  ref:     "bg-sky-500/15 text-sky-400 border-sky-500/20",
  stale:   "bg-red-500/15 text-red-400 border-red-500/20",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function usePrevPrice(price: number) {
  const ref  = useRef<number>(price);
  const prev = ref.current;
  useEffect(() => { ref.current = price; });
  return prev;
}

// ─── Full-size QuoteCard ───────────────────────────────────────────────────────
function QuoteCard({
  q, teal = false, batchFlashKey = 0, isHighlighted = false, now,
}: { q: Quote; teal?: boolean; batchFlashKey?: number; isHighlighted?: boolean; now?: number }) {
  const up       = q.change >= 0;
  const badge    = quoteBadge(q);
  const prev     = usePrevPrice(q.price);
  const changed  = prev !== 0 && prev !== q.price;
  const flashDir = changed ? (q.price > prev ? "up" : "down") : null;
  const flashKey = useRef(0);
  if (changed) flashKey.current += 1;

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
        teal ? "hover:border-teal-500/40" : up ? "hover:border-emerald-500/30" : "hover:border-red-500/30",
        isHighlighted && "ring-2 ring-primary/70 shadow-[0_0_20px_hsl(43_63%_52%/0.35)]",
      )}
      style={teal ? { borderColor: "rgba(20,184,166,0.20)" } : undefined}
    >
      <AnimatePresence>
        {flashDir && (
          <motion.div key={flashKey.current}
            initial={{ opacity: 0.35 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("absolute inset-0 rounded-[inherit] pointer-events-none",
              flashDir === "up" ? "bg-emerald-500/20" : "bg-red-500/20")} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isBatchFlashing && (
          <motion.div key={batchFlashId}
            initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{ background: "rgba(20,184,166,0.14)", boxShadow: "inset 0 0 0 1.5px rgba(20,184,166,0.60)" }} />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-3">
        <span className="font-mono font-bold text-base"
          style={{ color: teal ? "#22D3EE" : "#D4AF37" }}>{q.symbol}</span>
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
          BADGE_TONE[badge.tone])}>{badge.text}</span>
        {q.isFallback && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/25">
            <AlertTriangle className="w-2.5 h-2.5" />via {q.provider}
          </span>
        )}
      </div>
      {q.timestamp && now !== undefined && (
        <p className="font-mono text-[8px] text-muted-foreground/30 mt-1.5 truncate">
          as of {freshnessLabel(q.timestamp, now)}
        </p>
      )}
    </motion.div>
  );
}

// ─── Compact MiniQuoteCard (mega-caps, sector ETFs, crypto watch) ──────────────
function MiniQuoteCard({ q, label, teal = false, isHighlighted = false, now }: { q: Quote; label?: string; teal?: boolean; isHighlighted?: boolean; now?: number }) {
  const up       = q.changePercent >= 0;
  const badge    = quoteBadge(q);
  const prev     = usePrevPrice(q.price);
  const changed  = prev !== 0 && prev !== q.price;
  const flashDir = changed ? (q.price > prev ? "up" : "down") : null;
  const flashKey = useRef(0);
  if (changed) flashKey.current += 1;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      title={quoteTooltip(q)}
      className={cn(
        "glass-card px-3 py-2.5 cursor-help transition-all relative overflow-hidden",
        teal ? "hover:border-teal-500/40" : "hover:border-primary/30",
        isHighlighted && "ring-2 ring-primary/70 shadow-[0_0_16px_hsl(43_63%_52%/0.30)]",
      )}
      style={teal ? { borderColor: "rgba(20,184,166,0.18)" } : undefined}
    >
      <AnimatePresence>
        {flashDir && (
          <motion.div key={flashKey.current}
            initial={{ opacity: 0.3 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("absolute inset-0 rounded-[inherit] pointer-events-none",
              flashDir === "up" ? "bg-emerald-500/20" : "bg-red-500/20")} />
        )}
      </AnimatePresence>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <span className="font-mono font-bold text-sm block"
            style={{ color: teal ? "#22D3EE" : "#D4AF37" }}>{q.symbol}</span>
          {label && (
            <span className="text-[9px] text-muted-foreground/50 block truncate leading-tight">{label}</span>
          )}
        </div>
        <span className={cn("font-mono text-[10px] font-semibold px-1 py-0.5 rounded shrink-0",
          up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
          {up ? "+" : ""}{q.changePercent.toFixed(2)}%
        </span>
      </div>
      <p className={cn(
        "font-mono text-sm font-bold tabular-nums",
        flashDir === "up"   && "animate-[price-flash-up_0.9s_ease-out] text-emerald-300",
        flashDir === "down" && "animate-[price-flash-down_0.9s_ease-out] text-red-300",
        !flashDir           && "text-foreground",
      )}>
        ${formatPrice(q.price)}
      </p>
      <div className="mt-1.5">
        <span className={cn("inline-block text-[8px] font-mono px-1 py-0.5 rounded border",
          BADGE_TONE[badge.tone])}>{badge.text}</span>
      </div>
      {q.timestamp && now !== undefined && (
        <p className="font-mono text-[7px] text-muted-foreground/28 mt-1 truncate">
          {freshnessLabel(q.timestamp, now)}
        </p>
      )}
    </motion.div>
  );
}

// ─── Gainers / Losers row with price-flash animation ──────────────────────────
function GainerLoserRow({ q, isGainer }: { q: Quote; isGainer: boolean }) {
  const prev     = usePrevPrice(q.price);
  const changed  = prev !== 0 && prev !== q.price;
  const flashDir = changed ? (q.price > prev ? "up" : "down") : null;
  const flashKey = useRef(0);
  if (changed) flashKey.current += 1;

  return (
    <div className="flex items-center justify-between py-1 border-b border-border/25 last:border-0">
      <span className="font-mono text-sm font-bold text-primary">{q.symbol}</span>
      <div className="flex items-center gap-2">
        <span
          key={flashKey.current}
          className={cn(
            "font-mono text-xs tabular-nums rounded px-0.5 transition-colors",
            flashDir === "up"   && "animate-[price-flash-up_0.9s_ease-out] text-emerald-300",
            flashDir === "down" && "animate-[price-flash-down_0.9s_ease-out] text-red-300",
            !flashDir           && "text-muted-foreground/60",
          )}
        >
          ${formatPrice(q.price)}
        </span>
        <span className={cn(
          "font-mono text-xs font-semibold",
          isGainer ? "text-emerald-400" : "text-red-400",
        )}>
          {isGainer ? "+" : ""}{q.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// ─── Relative Strength row with price-flash animation ─────────────────────────
const MEDALS = ["🥇", "🥈", "🥉", ""];
function RelStrengthRow({ q, rank }: { q: Quote; rank: number }) {
  const up       = q.changePercent >= 0;
  const width    = Math.min(100, Math.abs(q.changePercent) * 14);
  const prev     = usePrevPrice(q.price);
  const changed  = prev !== 0 && prev !== q.price;
  const flashDir = changed ? (q.price > prev ? "up" : "down") : null;
  const flashKey = useRef(0);
  if (changed) flashKey.current += 1;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-5 text-center">{MEDALS[rank] ?? ""}</span>
      <span className="font-mono text-sm font-bold w-12" style={{ color: "#22D3EE" }}>{q.symbol}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${width}%` }}
          transition={{ delay: rank * 0.08 + 0.2, duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: up ? "rgba(20,184,166,0.75)" : "rgba(239,68,68,0.60)" }}
        />
      </div>
      <span className={cn("font-mono text-xs font-semibold w-16 text-right",
        up ? "text-emerald-400" : "text-red-400")}>
        {up ? "+" : ""}{q.changePercent.toFixed(2)}%
      </span>
      <span
        key={flashKey.current}
        className={cn(
          "font-mono text-xs w-24 text-right tabular-nums rounded px-0.5 transition-colors",
          flashDir === "up"   && "animate-[price-flash-up_0.9s_ease-out] text-emerald-300",
          flashDir === "down" && "animate-[price-flash-down_0.9s_ease-out] text-red-300",
          !flashDir           && "text-muted-foreground/50",
        )}
      >
        ${formatPrice(q.price)}
      </span>
    </div>
  );
}

// ─── Symbol placeholder when quote not yet loaded or unavailable ───────────────
function SymbolPlaceholder({ symbol, label }: { symbol: string; label?: string }) {
  return (
    <div className="glass-card px-3 py-2.5 opacity-40">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <span className="font-mono font-bold text-sm text-muted-foreground/60 block">{symbol}</span>
          {label && <span className="text-[9px] text-muted-foreground/40 block truncate">{label}</span>}
        </div>
      </div>
      <p className="font-mono text-sm text-muted-foreground/40">—</p>
      <div className="mt-1.5">
        <span className="inline-block text-[8px] font-mono px-1 py-0.5 rounded border bg-muted/20 text-muted-foreground/40 border-muted/20">
          UNAVAILABLE
        </span>
      </div>
    </div>
  );
}

// ─── Polished "unavailable" empty-state card ───────────────────────────────────
function UnavailableCard({
  icon: Icon, title, reason, provider, settingsLink = false,
}: {
  icon: React.ElementType; title: string; reason: string; provider: string; settingsLink?: boolean;
}) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3 border-dashed">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground/35" />
        <h3 className="text-sm font-display font-semibold text-foreground/70">{title}</h3>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground/55">{reason}</p>
        <p className="text-[10px] font-mono text-muted-foreground/35">{provider}</p>
      </div>
      {settingsLink && (
        <Link href="/settings">
          <span className="inline-flex items-center gap-1 text-[10px] text-primary/50 hover:text-primary transition-colors cursor-pointer">
            <ArrowRight className="w-3 h-3" />Configure in Settings
          </span>
        </Link>
      )}
    </div>
  );
}

// ─── Data hook ────────────────────────────────────────────────────────────────
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
    isFetching:          equityResult.isFetching || cryptoResult.isFetching,
    cryptoDataUpdatedAt: cryptoResult.dataUpdatedAt,
    equityDataUpdatedAt: equityResult.dataUpdatedAt,
  };
}

// ─── Stock Market subview ─────────────────────────────────────────────────────
function StocksView({ allQuotes, isFetching, equitiesOpen, equityDataUpdatedAt, highlightSymbol }: {
  allQuotes: Quote[]; isFetching: boolean; equitiesOpen: boolean; equityDataUpdatedAt: number; highlightSymbol?: string | null;
}) {
  const now     = useNow();
  const usable  = allQuotes.filter(isQuoteUsable);

  const [pulseSymbol, setPulseSymbol] = useState<string | null>(null);
  useEffect(() => {
    if (!highlightSymbol) return;
    setPulseSymbol(highlightSymbol);
    const el = document.getElementById(`mkt-${highlightSymbol}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setPulseSymbol(null), 3000);
    return () => clearTimeout(t);
  }, [highlightSymbol]);

  const indexQ  = INDEX_SYMS.map(s   => usable.find(q => q.symbol === s));
  const megaQ   = MEGACAP_SYMS.map(s => usable.find(q => q.symbol === s));
  const sectQ   = SECTOR_SYMS.map(s  => usable.find(q => q.symbol === s));

  const usableEq   = usable.filter(q => (EQUITY_SYMBOLS as readonly string[]).includes(q.symbol));
  const gainers    = [...usableEq].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6);
  const losers     = [...usableEq].sort((a, b) => a.changePercent - b.changePercent).slice(0, 6);

  const lastUpdated = equityDataUpdatedAt > 0
    ? freshnessLabel(new Date(equityDataUpdatedAt).toISOString(), now)
    : "—";

  const statusClass = equitiesOpen
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-muted/40 text-muted-foreground border-border/40";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Stock Market</h1>
          <span className={cn("px-2 py-0.5 rounded-full border text-xs font-semibold ml-2", statusClass)}>
            {equitiesOpen ? "EQUITIES OPEN" : "EQUITIES CLOSED"}
          </span>
          {isFetching && <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/50 animate-spin ml-1" />}
        </div>
        <div className="flex items-center gap-4 ml-8">
          <p className="text-muted-foreground text-sm">
            Equities &amp; ETFs delayed ~15 min · Yahoo Finance · Indices, mega-caps, and sector flow
          </p>
          {equityDataUpdatedAt > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground/40">
              fetched {lastUpdated}
            </span>
          )}
        </div>
      </motion.div>

      {/* Index Overview */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Index Overview</h2>
          <span className="text-[10px] text-muted-foreground/50 font-mono">Delayed ~15min · Yahoo</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INDEX_SYMS.map((sym, i) => {
            const q = indexQ[i];
            return (
              <motion.div key={sym} id={`mkt-${sym}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                {q ? <QuoteCard q={q} isHighlighted={pulseSymbol === sym} now={now} /> : <SymbolPlaceholder symbol={sym} />}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Mega-Cap Watch */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Mega-Cap Watch</h2>
          <span className="text-[10px] text-muted-foreground/50 font-mono">Delayed · Yahoo</span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {MEGACAP_SYMS.map((sym, i) => {
            const q = megaQ[i];
            return (
              <motion.div key={sym} id={`mkt-${sym}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                {q ? <MiniQuoteCard q={q} isHighlighted={pulseSymbol === sym} now={now} /> : <SymbolPlaceholder symbol={sym} />}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Sector ETF Monitor */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Sector ETF Monitor</h2>
          <span className="text-[10px] text-muted-foreground/50 font-mono">Delayed · Yahoo</span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {SECTOR_SYMS.map((sym, i) => {
            const q = sectQ[i];
            return (
              <motion.div key={sym} id={`mkt-${sym}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                {q ? <MiniQuoteCard q={q} label={SECTOR_LABELS[sym]} isHighlighted={pulseSymbol === sym} now={now} /> : <SymbolPlaceholder symbol={sym} label={SECTOR_LABELS[sym]} />}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Top Movers (from loaded quotes) */}
      {usableEq.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">Top Movers</h2>
            <span className="text-[10px] text-muted-foreground/40 font-mono">from loaded positions · market-wide requires Polygon/FMP</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-display font-semibold text-foreground">Gainers</h3>
              </div>
              <div className="space-y-2">
                {gainers.map((q) => (
                  <GainerLoserRow key={q.symbol} q={q} isGainer={true} />
                ))}
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-display font-semibold text-foreground">Underperformers</h3>
              </div>
              <div className="space-y-2">
                {losers.map((q) => (
                  <GainerLoserRow key={q.symbol} q={q} isGainer={false} />
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Intelligence widgets (unavailable states) */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider mb-3">Market Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UnavailableCard
            icon={Activity}
            title="Market Breadth"
            reason="Advancers/decliners, new highs/lows, and % above moving averages require a breadth data provider."
            provider="Connect Polygon, FMP, or MooMoo/OpenD to unlock."
            settingsLink
          />
          <UnavailableCard
            icon={Volume2}
            title="Volume Intelligence"
            reason="Real-time and relative volume data is not available from the current delayed Yahoo fallback."
            provider="Connect Polygon or MooMoo/OpenD for volume analytics."
            settingsLink
          />
          <UnavailableCard
            icon={CalendarDays}
            title="Catalyst Calendar"
            reason="Earnings dates, analyst revisions, and SEC events require a fundamentals provider."
            provider="Connect FMP, Polygon, or SEC/EDGAR provider to unlock."
            settingsLink
          />
        </div>
      </motion.section>

      {/* Watchlist + Provider Readiness */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Watchlist link */}
          <Link href="/watchlist">
            <div className="glass-card p-5 cursor-pointer group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="w-4 h-4 text-primary/70" />
                <h3 className="text-sm font-display font-semibold text-foreground">Stock Watchlist</h3>
              </div>
              <p className="text-xs text-muted-foreground/60 mb-3">
                Track specific tickers with source badges, freshness labels, and notes.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/60 group-hover:text-primary transition-colors">
                <ArrowRight className="w-3 h-3" />Go to Watchlist
              </span>
            </div>
          </Link>

          {/* Equity provider readiness */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-primary/70" />
              <h3 className="text-sm font-display font-semibold text-foreground">Equity Data Sources</h3>
            </div>
            <div className="space-y-2">
              {[
                { name: "Yahoo Finance", status: "ACTIVE",  detail: "Delayed ~15min",   tone: "emerald" },
                { name: "MooMoo/OpenD",  status: "FUTURE",  detail: "Primary scanner",  tone: "muted"   },
                { name: "Polygon.io",    status: "FUTURE",  detail: "Premium market data", tone: "muted" },
                { name: "FMP",           status: "FUTURE",  detail: "Fundamentals",     tone: "muted"   },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground/40 font-mono">{p.detail}</span>
                    <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border",
                      p.tone === "emerald"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                        : "bg-muted/30 text-muted-foreground/50 border-border/30")}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

// ─── Crypto Market subview ────────────────────────────────────────────────────
function CryptoView({ allQuotes, isFetching, cryptoRefetch, cryptoDataUpdatedAt, highlightSymbol }: {
  allQuotes: Quote[]; isFetching: boolean; cryptoRefetch: number; cryptoDataUpdatedAt: number; highlightSymbol?: string | null;
}) {
  const now    = useNow();
  const usable = allQuotes.filter(isQuoteUsable);

  const [pulseSymbol, setPulseSymbol] = useState<string | null>(null);
  useEffect(() => {
    if (!highlightSymbol) return;
    setPulseSymbol(highlightSymbol);
    const el = document.getElementById(`mkt-${highlightSymbol}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setPulseSymbol(null), 3000);
    return () => clearTimeout(t);
  }, [highlightSymbol]);

  const majorQ = CRYPTO_MAJOR_SYMS.map(s => usable.find(q => q.symbol === s)).filter(Boolean) as Quote[];
  const watchQ = CRYPTO_WATCH_SYMS.map(s => usable.find(q => q.symbol === s));

  const byChange = [...majorQ].sort((a, b) => b.changePercent - a.changePercent);
  const best     = byChange[0];
  const label    = cryptoRefetch <= 30_000 ? "30 s" : cryptoRefetch <= 60_000 ? "60 s" : "5 min";
  const isLive   = majorQ.some(q => q.isLive);

  // Freshness from oldest quote timestamp
  const timestamps = majorQ.map(q => q.timestamp).filter(Boolean) as string[];
  const oldest     = timestamps.length > 0
    ? new Date(Math.min(...timestamps.map(t => new Date(t).getTime()))).toISOString()
    : undefined;
  const freshness  = oldest ? freshnessLabel(oldest, now) : "—";
  const isStale    = oldest ? (now - new Date(oldest).getTime() > 15 * 60_000) : false;

  // Coverage
  const coverage = `${majorQ.length} / ${CRYPTO_MAJOR_SYMS.length}`;

  // Fallback outage detection
  const fallbackQuotes    = majorQ.filter(q => q.isFallback);
  const fallbackProviders = [...new Set(fallbackQuotes.map(q => q.provider))];
  const anyFallback       = fallbackProviders.length > 0;
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const prevFallbackKey = useRef(anyFallback);
  useEffect(() => {
    if (anyFallback !== prevFallbackKey.current) {
      prevFallbackKey.current = anyFallback;
      if (anyFallback) setBannerDismissed(false);
    }
  }, [anyFallback]);

  // Batch flash key
  const [batchFlashKey, setBatchFlashKey] = useState(0);
  const prevUpdatedAt = useRef(cryptoDataUpdatedAt);
  useEffect(() => {
    if (cryptoDataUpdatedAt !== prevUpdatedAt.current && cryptoDataUpdatedAt > 0) {
      prevUpdatedAt.current = cryptoDataUpdatedAt;
      setBatchFlashKey(k => k + 1);
    }
  }, [cryptoDataUpdatedAt]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">

      {/* Header */}
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
        <div className="flex items-center gap-4 ml-8">
          <p className="text-muted-foreground text-sm">
            {isLive ? "Live · Kraken exchange" : "Reference · CoinGecko"} · refreshes every {label}
          </p>
          {cryptoDataUpdatedAt > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground/40">
              fetched {freshnessLabel(new Date(cryptoDataUpdatedAt).toISOString(), now)}
            </span>
          )}
        </div>
      </motion.div>

      {/* Fallback banner */}
      <AnimatePresence>
        {anyFallback && !bannerDismissed && (
          <motion.div key="fallback-banner"
            initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.25 }}
            className="flex items-start gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/8"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">Primary source unavailable</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Kraken is down — prices currently served via{" "}
                <span className="font-mono font-semibold text-amber-300">
                  {fallbackProviders.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                </span>. Quotes may differ slightly from exchange prices.
              </p>
            </div>
            <button onClick={() => setBannerDismissed(true)}
              className="shrink-0 text-amber-400/60 hover:text-amber-300 transition-colors p-0.5 rounded"
              aria-label="Dismiss warning">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {majorQ.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground/60 font-mono">
          Crypto data sources unavailable
        </div>
      ) : (
        <>
          {/* Major Crypto Prices */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-display font-semibold uppercase tracking-wider" style={{ color: "#22D3EE" }}>
                {isLive ? "Live Prices" : "Reference Prices"}
              </h2>
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {isLive ? "Live · Kraken" : "Reference · CoinGecko"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {byChange.map((q, i) => (
                <motion.div key={q.symbol} id={`mkt-${q.symbol}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <QuoteCard q={q} teal batchFlashKey={batchFlashKey} isHighlighted={pulseSymbol === q.symbol} now={now} />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Relative Strength */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="glass-card p-5" style={{ borderColor: "rgba(20,184,166,0.16)" }}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-display font-semibold text-foreground">Relative Strength</h3>
              <span className="text-[10px] text-muted-foreground/50 font-mono">ranked by session change</span>
            </div>
            <div className="space-y-3">
              {byChange.map((q, i) => (
                <RelStrengthRow key={q.symbol} q={q} rank={i} />
              ))}
            </div>
          </motion.section>

          {/* Extended Crypto Watch Row */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-display font-semibold uppercase tracking-wider" style={{ color: "#22D3EE" }}>
                Extended Watch
              </h2>
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {isLive ? "Live · Kraken" : "Reference · CoinGecko"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CRYPTO_WATCH_SYMS.map((sym, i) => {
                const q = watchQ[i];
                return (
                  <motion.div key={sym} id={`mkt-${sym}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    {q ? <MiniQuoteCard q={q} teal isHighlighted={pulseSymbol === sym} now={now} /> : <SymbolPlaceholder symbol={sym} />}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Market Structure + Risk Panel */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UnavailableCard
                icon={CircleOff}
                title="Crypto Market Structure"
                reason="Total market cap, BTC dominance, ETH dominance, stablecoin supply, and DeFi stats require the CoinGecko /global endpoint or a market aggregator."
                provider="Extend crypto provider to fetch /global from CoinGecko."
              />
              {/* Crypto Risk Panel — computed from real data */}
              <div className="glass-card p-5" style={{ borderColor: "rgba(20,184,166,0.14)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4" style={{ color: "#22D3EE" }} />
                  <h3 className="text-sm font-display font-semibold text-foreground">Crypto Data Quality</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/60">Source type</span>
                    <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border",
                      isLive
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                        : "bg-sky-500/15 text-sky-400 border-sky-500/20")}>
                      {isLive ? "LIVE · EXCHANGE" : "REFERENCE · COINGECKO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/60">Oldest quote</span>
                    <span className={cn("text-[10px] font-mono",
                      isStale ? "text-amber-400" : "text-muted-foreground/60")}>
                      {freshness}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/60">Coverage</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">{coverage} assets</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/60">Volatility data</span>
                    <span className="text-[10px] font-mono text-muted-foreground/35">UNAVAILABLE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/60">Liquidity data</span>
                    <span className="text-[10px] font-mono text-muted-foreground/35">UNAVAILABLE</span>
                  </div>
                  {isStale && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-[10px] text-amber-400/70">Quotes may be stale — data is over 15 min old</span>
                    </div>
                  )}
                  {!isLive && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-sky-500/15">
                      <WifiOff className="w-3 h-3 text-sky-400/60 shrink-0" />
                      <span className="text-[10px] text-sky-400/60">Reference data only — connect Kraken for live exchange prices</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Exchange Source Readiness */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="glass-card p-5" style={{ borderColor: "rgba(20,184,166,0.12)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4" style={{ color: "#22D3EE" }} />
              <h3 className="text-sm font-display font-semibold text-foreground">Exchange Source Readiness</h3>
              <span className="text-[10px] text-muted-foreground/40 font-mono ml-1">upgrade path for live crypto data</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "CoinGecko",  role: "Reference Fallback",   status: "ACTIVE",        note: "No key required", teal: true  },
                { name: "Kraken",     role: "Preferred Exchange",    status: "NOT CONFIGURED", note: "API key required", teal: false },
                { name: "Coinbase",   role: "Secondary Exchange",    status: "NOT CONFIGURED", note: "API key required", teal: false },
                { name: "Binance",    role: "Optional / Global",     status: "OPTIONAL",      note: "API key required", teal: false },
              ].map((p) => (
                <div key={p.name} className={cn("rounded-lg p-3 border",
                  p.teal
                    ? "bg-teal-500/8 border-teal-500/20"
                    : "bg-muted/20 border-border/30")}>
                  <p className="text-xs font-mono font-bold mb-0.5"
                    style={{ color: p.teal ? "#22D3EE" : undefined }}>{p.name}</p>
                  <p className="text-[9px] text-muted-foreground/50 mb-2">{p.role}</p>
                  <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border block w-fit",
                    p.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                      : p.status === "OPTIONAL"
                        ? "bg-muted/30 text-muted-foreground/50 border-border/30"
                        : "bg-amber-500/10 text-amber-400/70 border-amber-500/20")}>
                    {p.status}
                  </span>
                  <p className="text-[9px] text-muted-foreground/35 mt-1.5">{p.note}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Watchlist + Stat cards */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/watchlist">
                <div className="glass-card p-4 cursor-pointer group hover:border-teal-500/30 transition-all"
                  style={{ borderColor: "rgba(20,184,166,0.12)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bookmark className="w-4 h-4" style={{ color: "#22D3EE" }} />
                    <h3 className="text-sm font-display font-semibold text-foreground">Crypto Watchlist</h3>
                  </div>
                  <p className="text-xs text-muted-foreground/55 mb-2">Track assets with source and freshness badges.</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-teal-400/60 group-hover:text-teal-400 transition-colors">
                    <ArrowRight className="w-3 h-3" />Go to Watchlist
                  </span>
                </div>
              </Link>
              {[
                { label: "Market Status",  value: "24/7 Active",   sub: "Crypto never closes",   teal: true  },
                { label: "Best Performer", value: best?.symbol ?? "—", sub: best ? `${best.changePercent >= 0 ? "+" : ""}${best.changePercent.toFixed(2)}% today` : "—", teal: false },
                { label: "Data Source",    value: isLive ? "Kraken" : "CoinGecko", sub: isLive ? "Live exchange" : "Reference data", teal: false },
              ].map((item) => (
                <div key={item.label} className="glass-card p-4 text-center"
                  style={item.teal ? { borderColor: "rgba(20,184,166,0.22)" } : undefined}>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="font-mono font-bold text-lg" style={{ color: item.teal ? "#22D3EE" : "#D4AF37" }}>
                    {item.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </>
      )}
    </div>
  );
}

// ─── Markets root ─────────────────────────────────────────────────────────────
export default function Markets() {
  const [location] = useLocation();
  const search = useSearch();
  const { allQuotes, cryptoRefetch, equitiesOpen, isFetching, cryptoDataUpdatedAt, equityDataUpdatedAt } = useMarketsQuotes();
  const isCrypto = location === "/markets/crypto";

  const highlightSymbol = new URLSearchParams(search).get("symbol") ?? null;

  if (isCrypto) {
    return (
      <CryptoView
        allQuotes={allQuotes} isFetching={isFetching}
        cryptoRefetch={cryptoRefetch} cryptoDataUpdatedAt={cryptoDataUpdatedAt}
        highlightSymbol={highlightSymbol}
      />
    );
  }
  return (
    <StocksView
      allQuotes={allQuotes} isFetching={isFetching}
      equitiesOpen={equitiesOpen} equityDataUpdatedAt={equityDataUpdatedAt}
      highlightSymbol={highlightSymbol}
    />
  );
}
