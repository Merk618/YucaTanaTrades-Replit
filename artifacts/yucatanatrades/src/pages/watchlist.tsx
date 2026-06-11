import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Trash2, X, TrendingUp, TrendingDown, Bell, SlidersHorizontal, Search } from "lucide-react";
import {
  useListWatchlistItems,
  useAddWatchlistItem,
  useRemoveWatchlistItem,
  getListWatchlistItemsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarketQuotes, isQuoteUsable, formatPrice, useNow, freshnessLabel, type Quote } from "@/hooks/use-market";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

type Priority = "high" | "medium" | "low";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: "High", color: "bg-primary/15 text-primary border-primary/25", dot: "bg-primary" },
  medium: { label: "Medium", color: "bg-blue-500/15 text-blue-300 border-blue-500/25", dot: "bg-blue-400" },
  low: { label: "Low", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

type FormValues = {
  ticker: string;
  sector: string;
  notes: string;
  priority: Priority;
};

const ALERT_PRESETS = [
  { ticker: "ASTS", type: "Above", price: "$22.00", status: "watching" },
  { ticker: "KTOS", type: "Below", price: "$30.00", status: "watching" },
  { ticker: "BTC", type: "Above", price: "$70,000", status: "watching" },
  { ticker: "SMR", type: "Above", price: "$10.00", status: "triggered" },
];

export default function Watchlist() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const now = useNow();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useListWatchlistItems();
  const addItem = useAddWatchlistItem();
  const removeItem = useRemoveWatchlistItem();

  // Fetch real delayed/reference quotes for every ticker in the watchlist.
  // Yahoo Finance covers equities/ETFs; CoinGecko covers crypto.
  // Symbols not supported by either source will return an error quote → shown as "No price data".
  const tickers = useMemo(() => items.map((i) => i.ticker), [items]);
  const { data: quotesResponse } = useMarketQuotes(tickers, 60_000);
  const quoteBySymbol = useMemo(() => {
    const map: Record<string, Quote> = {};
    for (const q of quotesResponse?.quotes ?? []) {
      if (isQuoteUsable(q)) map[q.symbol] = q;
    }
    return map;
  }, [quotesResponse]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { ticker: "", sector: "", notes: "", priority: "medium" },
  });

  const onSubmit = (data: FormValues) => {
    addItem.mutate(
      {
        data: {
          ticker: data.ticker.toUpperCase().trim(),
          sector: data.sector || null,
          notes: data.notes || null,
          priority: data.priority,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWatchlistItemsQueryKey() });
          setShowModal(false);
          reset();
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    removeItem.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWatchlistItemsQueryKey() });
          setConfirmDeleteId(null);
        },
      }
    );
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.ticker.toLowerCase().includes(search.toLowerCase()) ||
      (item.sector ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.notes ?? "").toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === "all" || item.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  // Sort: high → medium → low, then by addedAt desc
  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? "medium"] ?? 1;
    const pb = PRIORITY_ORDER[b.priority ?? "medium"] ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  const highCount = items.filter((i) => i.priority === "high").length;
  const gainers = items.filter((i) => (quoteBySymbol[i.ticker]?.changePercent ?? 0) > 0).length;
  const losers = items.filter((i) => (quoteBySymbol[i.ticker]?.changePercent ?? 0) < 0).length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Watchlist</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Ticker
          </button>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Track your target securities with priority tiers and price alerts</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Watching", value: items.length, color: "text-foreground" },
          { label: "High Priority", value: highCount, color: "text-primary" },
          { label: "Gaining Today", value: gainers, color: "text-emerald-400" },
          { label: "Declining Today", value: losers, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("font-mono text-2xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Search + Filter bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker or sector…"
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono"
          />
        </div>
        <div className="flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                filterPriority === p
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Watchlist Cards Grid */}
      {isLoading ? (
        <div className="glass-card p-12 text-center text-muted-foreground text-sm">Loading watchlist…</div>
      ) : sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
          <Star className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <p className="text-foreground font-medium mb-1">
            {search || filterPriority !== "all" ? "No matches found" : "Your watchlist is empty"}
          </p>
          <p className="text-sm text-muted-foreground">
            {search || filterPriority !== "all"
              ? "Try adjusting your search or filter"
              : "Add your first ticker to start tracking"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {sorted.map((item, i) => {
              const q = quoteBySymbol[item.ticker];
              const priority = (item.priority ?? "medium") as Priority;
              const cfg = PRIORITY_CONFIG[priority];
              const up = (q?.changePercent ?? 0) >= 0;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={cn(
                    "glass-card p-5 group transition-all",
                    priority === "high" && "border-primary/30 shadow-primary/10 shadow-md"
                  )}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-primary">{item.ticker}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1", cfg.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price block — real delayed/reference quotes only; no mock prices */}
                  {q ? (
                    <div className="mb-3">
                      <div className="flex items-end gap-2">
                        <span className="font-mono text-2xl font-bold text-foreground">
                          ${formatPrice(q.price)}
                        </span>
                        <span className={cn("font-mono text-sm font-semibold mb-0.5", up ? "text-emerald-400" : "text-red-400")}>
                          {up ? "+" : ""}{(q.changePercent ?? 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        {up ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                        <span className={cn("font-mono", up ? "text-emerald-400" : "text-red-400")}>
                          {up ? "+" : ""}{(q.change ?? 0).toFixed(q.price < 1 ? 4 : 2)} today
                        </span>
                        <span className="text-muted-foreground/35 text-[10px]">· {q.sourceLabel}</span>
                      </div>
                      {q.timestamp && (
                        <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
                          as of {freshnessLabel(q.timestamp, now)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-3">
                      <p className="font-mono text-lg text-muted-foreground/50 italic">No price data</p>
                      <p className="text-xs text-muted-foreground/60">Not covered by current sources</p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    {item.sector && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-14 flex-shrink-0">Sector</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-foreground/70 border border-border/40">{item.sector}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-14 flex-shrink-0 mt-0.5">Thesis</span>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{item.notes}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-14 flex-shrink-0">Added</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(item.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Price Alert Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold text-foreground">Price Alerts</h2>
          </div>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted/50 border border-border/50">Connect broker to activate</span>
        </div>
        <div className="divide-y divide-border/30">
          {ALERT_PRESETS.map((alert, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-primary w-14">{alert.ticker}</span>
                <span className="text-xs text-muted-foreground">
                  {alert.type} <span className="font-mono text-foreground font-medium">{alert.price}</span>
                </span>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded border font-bold",
                alert.status === "triggered"
                  ? "bg-primary/15 text-primary border-primary/25"
                  : "bg-muted text-muted-foreground border-border"
              )}>
                {alert.status.toUpperCase()}
              </span>
            </div>
          ))}
          <div className="px-4 py-3">
            <button className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add price alert
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete confirm inline overlay */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-foreground mb-1">Remove from watchlist?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently remove the ticker from your watchlist.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId!)}
                  disabled={removeItem.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {removeItem.isPending ? "Removing…" : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Ticker Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="glass-card w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Add to Watchlist</h2>
                </div>
                <button onClick={() => { setShowModal(false); reset(); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Ticker Symbol *</label>
                  <input
                    {...register("ticker", { required: true })}
                    placeholder="e.g. NVDA, BTC, ASTS"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 uppercase"
                  />
                  {errors.ticker && <p className="text-xs text-red-400 mt-1">Ticker is required</p>}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["high", "medium", "low"] as Priority[]).map((p) => {
                      const cfg = PRIORITY_CONFIG[p];
                      const selected = watch("priority") === p;
                      return (
                        <label key={p} className={cn("flex items-center justify-center gap-1.5 py-2.5 rounded-lg border cursor-pointer transition-all text-xs font-semibold", selected ? cfg.color : "border-border text-muted-foreground hover:border-border/80")}>
                          <input {...register("priority")} type="radio" value={p} className="hidden" />
                          <span className={cn("w-2 h-2 rounded-full", selected ? cfg.dot : "bg-muted-foreground/40")} />
                          {cfg.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Sector</label>
                  <select
                    {...register("sector")}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Select a sector…</option>
                    {["AI / Tech", "Semiconductors", "Defense", "Nuclear", "Crypto", "Biotech", "Fintech", "Energy", "Quantum", "Space", "Consumer", "Financials"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Thesis / Notes</label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    placeholder="Why are you watching this ticker?"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); reset(); }}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addItem.isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/25"
                  >
                    {addItem.isPending ? "Adding…" : "Add to Watchlist"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
