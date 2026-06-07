import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, TrendingUp, TrendingDown, BarChart2, X, ChevronUp, ChevronDown } from "lucide-react";
import { useListJournalEntries, useGetJournalSummary, useCreateJournalEntry, getListJournalEntriesQueryKey, getGetJournalSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

const TABS = ["Trades", "Wins", "Losses", "Open", "Lessons"];

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, string> = {
    win: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    loss: "bg-red-500/15 text-red-300 border-red-500/25",
    breakeven: "bg-muted text-muted-foreground border-border",
    open: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase", map[outcome] ?? "bg-muted text-muted-foreground border-border")}>
      {outcome}
    </span>
  );
}

function SideBadge({ side }: { side: string }) {
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", side === "long" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
      {side.toUpperCase()}
    </span>
  );
}

export default function Journal() {
  const [activeTab, setActiveTab] = useState("Trades");
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useListJournalEntries();
  const { data: summary } = useGetJournalSummary();
  const createEntry = useCreateJournalEntry();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      ticker: "", setupType: "Momentum", side: "long" as "long" | "short",
      entryPrice: 0, exitPrice: "" as unknown as number, pnl: "" as unknown as number,
      pnlPercent: "" as unknown as number, thesis: "", mistakes: "", lessons: "",
      outcome: "open" as "open" | "win" | "loss" | "breakeven", sector: "", tags: "", tradeDate: "",
    },
  });

  const filtered = entries.filter((e) => {
    if (activeTab === "Wins") return e.outcome === "win";
    if (activeTab === "Losses") return e.outcome === "loss";
    if (activeTab === "Open") return e.outcome === "open";
    if (activeTab === "Lessons") return !!(e.lessons);
    return true;
  });

  const onSubmit = (data: any) => {
    createEntry.mutate({
      data: {
        ...data,
        entryPrice: Number(data.entryPrice),
        exitPrice: data.exitPrice ? Number(data.exitPrice) : null,
        pnl: data.pnl ? Number(data.pnl) : null,
        pnlPercent: data.pnlPercent ? Number(data.pnlPercent) : null,
        mistakes: data.mistakes || null,
        lessons: data.lessons || null,
        sector: data.sector || null,
        tags: data.tags || null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetJournalSummaryQueryKey() });
        setShowModal(false);
        reset();
      },
    });
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Trade Journal</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4" />
            Log Trade
          </button>
        </div>
        <p className="text-muted-foreground text-sm ml-8">Track every trade — thesis, execution, lessons</p>
      </motion.div>

      {/* Summary stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Trades", value: summary?.totalTrades ?? entries.filter((e) => e.outcome !== "open").length, icon: BarChart2, color: "text-foreground" },
          { label: "Wins", value: summary?.wins ?? entries.filter((e) => e.outcome === "win").length, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Losses", value: summary?.losses ?? entries.filter((e) => e.outcome === "loss").length, icon: TrendingDown, color: "text-red-400" },
          { label: "Win Rate", value: `${(summary?.winRate ?? 0).toFixed(0)}%`, icon: ChevronUp, color: (summary?.winRate ?? 0) >= 50 ? "text-emerald-400" : "text-red-400" },
          { label: "Total P&L", value: `${(summary?.totalPnl ?? 0) >= 0 ? "+" : ""}$${Math.abs(summary?.totalPnl ?? 0).toFixed(0)}`, icon: BarChart2, color: (summary?.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={cn("font-mono text-xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === tab ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Journal Table */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading journal entries...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No entries yet. Log your first trade to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Date", "Ticker", "Setup", "Side", "Entry", "Exit", "P&L", "P&L %", "Outcome"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/30 hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{entry.tradeDate}</td>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{entry.ticker}</td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{entry.setupType}</td>
                    <td className="px-4 py-3"><SideBadge side={entry.side} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">${Number(entry.entryPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{entry.exitPrice != null ? `$${Number(entry.exitPrice).toFixed(2)}` : "—"}</td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", entry.pnl == null ? "text-muted-foreground" : Number(entry.pnl) >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {entry.pnl != null ? `${Number(entry.pnl) >= 0 ? "+" : ""}$${Math.abs(Number(entry.pnl)).toFixed(0)}` : "—"}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", entry.pnlPercent == null ? "text-muted-foreground" : Number(entry.pnlPercent) >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {entry.pnlPercent != null ? `${Number(entry.pnlPercent) >= 0 ? "+" : ""}${Number(entry.pnlPercent).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3"><OutcomeBadge outcome={entry.outcome} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Lessons panel */}
      {activeTab === "Lessons" && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.filter((e) => e.lessons).map((entry) => (
            <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono font-bold text-primary">{entry.ticker}</span>
                <span className="text-xs text-muted-foreground">{entry.tradeDate}</span>
                <OutcomeBadge outcome={entry.outcome} />
              </div>
              <p className="text-sm text-muted-foreground mb-2"><span className="text-foreground font-medium">Thesis:</span> {entry.thesis}</p>
              {entry.mistakes && <p className="text-sm text-red-400/80 mb-1"><span className="text-red-400 font-medium">Mistake:</span> {entry.mistakes}</p>}
              <p className="text-sm text-emerald-400/80"><span className="text-emerald-400 font-medium">Lesson:</span> {entry.lessons}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Log Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-foreground">Log New Trade</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Ticker *</label>
                  <input {...register("ticker", { required: true })} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 uppercase" placeholder="MSFT" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Trade Date *</label>
                  <input {...register("tradeDate", { required: true })} type="date" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Setup Type *</label>
                  <select {...register("setupType")} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                    {["Momentum", "Breakout", "Dip-Buy", "Oversold", "Options Play", "Earnings Run", "Reversal"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Side *</label>
                  <select {...register("side")} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Entry Price *</label>
                  <input {...register("entryPrice", { required: true, min: 0 })} type="number" step="0.01" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Exit Price</label>
                  <input {...register("exitPrice")} type="number" step="0.01" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">P&L ($)</label>
                  <input {...register("pnl")} type="number" step="0.01" className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Outcome *</label>
                  <select {...register("outcome")} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                    {["open", "win", "loss", "breakeven"].map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Thesis *</label>
                <textarea {...register("thesis", { required: true })} rows={2} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" placeholder="Why did you take this trade?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Mistakes</label>
                <textarea {...register("mistakes")} rows={2} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" placeholder="What went wrong?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Lessons</label>
                <textarea {...register("lessons")} rows={2} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" placeholder="What did you learn?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Sector</label>
                  <input {...register("sector")} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" placeholder="Semiconductors" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Tags</label>
                  <input {...register("tags")} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" placeholder="ai,momentum" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={createEntry.isPending} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createEntry.isPending ? "Saving..." : "Save Trade"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
