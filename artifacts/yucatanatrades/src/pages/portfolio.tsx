import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Briefcase, ArrowUpRight, ArrowDownRight, BarChart2, AlertTriangle, Pencil, Trash2, Plus, X, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarketQuotes, isQuoteUsable, quoteBadge, freshnessLabel, useNow } from "@/hooks/use-market";
import { sleeveLabel } from "@/data/positions";
import {
  useListPositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
  getListPositionsQueryKey,
  PortfolioPositionSleeve,
} from "@workspace/api-client-react";
import type { PortfolioPosition, PortfolioPositionInput, PortfolioPositionUpdate } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

// ─── Deterministic performance history (90 trading days) ─────────────────────
function generateHistory(finalTotals: { roth: number; indiv: number; crypto: number } | null) {
  let s = 1337;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

  let roth = 118500;
  let indiv = 64200;
  let crypto = 23800;

  const origin = new Date("2026-06-07");
  const result: { date: string; total: number; rothIra: number; individual: number; crypto: number }[] = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(origin);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    roth   *= 1 + 0.00025 + (r() - 0.5) * 0.016;
    indiv  *= 1 + 0.00018 + (r() - 0.5) * 0.014;
    crypto *= 1 + 0.00040 + (r() - 0.5) * 0.046;

    roth   = Math.min(128000, Math.max(108000, roth));
    indiv  = Math.min(72000,  Math.max(58000,  indiv));
    crypto = Math.min(33000,  Math.max(16000,  crypto));

    result.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rothIra:    Math.round(roth),
      individual: Math.round(indiv),
      crypto:     Math.round(crypto),
      total:      Math.round(roth + indiv + crypto),
    });
  }

  const last = result[result.length - 1];
  if (last) {
    if (finalTotals) {
      last.rothIra    = Math.round(finalTotals.roth);
      last.individual = Math.round(finalTotals.indiv);
      last.crypto     = Math.round(finalTotals.crypto);
      last.total      = Math.round(finalTotals.roth + finalTotals.indiv + finalTotals.crypto);
    } else {
      last.rothIra    = 125430;
      last.individual = 67890;
      last.crypto     = 28450;
      last.total      = 221770;
    }
  }
  return result;
}

const PERIOD_SLICES = { "1W": 5, "1M": 22, "3M": 65 } as const;
type Period = keyof typeof PERIOD_SLICES;

const FRESHNESS_WARNING_MS = 15 * 60 * 1000;

// ─── Sleeve config ────────────────────────────────────────────────────────────
const SLEEVES = [
  { label: "Roth IRA",   key: "Roth IRA",   color: "bg-primary",       chartColor: "#C4A44A", icon: "🏛️" },
  { label: "Individual", key: "Individual", color: "bg-blue-500",      chartColor: "#3b82f6", icon: "💼" },
  { label: "Crypto",     key: "Crypto",     color: "bg-emerald-500",   chartColor: "#10b981", icon: "🪙" },
];

const SECTOR_COLORS: Record<string, string> = {
  Semis: "#C4A44A", Tech: "#3b82f6", Nuclear: "#f97316",
  Defense: "#8b5cf6", Crypto: "#10b981", Space: "#06b6d4",
};

const SLEEVE_OPTIONS: { value: PortfolioPositionSleeve; label: string }[] = [
  { value: "rothIra",    label: "Roth IRA" },
  { value: "individual", label: "Individual" },
  { value: "crypto",     label: "Crypto" },
];

const SECTOR_OPTIONS = ["Semis", "Tech", "Nuclear", "Defense", "Crypto", "Space", "Other"];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, view }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  view: "total" | "sleeves";
}) {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="glass-card px-4 py-3 border-primary/30 shadow-xl shadow-black/40 text-xs min-w-[160px]">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">
              {p.name === "rothIra" ? "Roth IRA" : p.name === "individual" ? "Individual" : p.name === "crypto" ? "Crypto" : "Total"}
            </span>
          </div>
          <span className="font-mono font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sector donut ─────────────────────────────────────────────────────────────
function SectorAllocation({ holdings }: { holdings: { sector: string; value: number }[] }) {
  const sectors = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.sector] = (acc[h.sector] ?? 0) + h.value;
    return acc;
  }, {});
  const total = Object.values(sectors).reduce((s, v) => s + v, 0);

  let offset = 0;
  const slices = Object.entries(sectors).map(([sector, value]) => {
    const pct = total > 0 ? value / total : 0;
    const dasharray = `${pct * 100} ${100 - pct * 100}`;
    const slice = { sector, value, pct, dasharray, offset };
    offset += pct * 100;
    return slice;
  });

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Sector Allocation</h3>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(225 15% 12%)" strokeWidth="3" />
            {slices.map((s) => (
              <circle
                key={s.sector}
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={SECTOR_COLORS[s.sector] ?? "#888"}
                strokeWidth="3.5"
                strokeDasharray={s.dasharray}
                strokeDashoffset={-s.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] text-muted-foreground">Holdings</span>
            <span className="font-mono font-bold text-sm text-foreground">{holdings.length}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {slices.sort((a, b) => b.pct - a.pct).map((s) => (
            <div key={s.sector} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SECTOR_COLORS[s.sector] ?? "#888" }} />
                <span className="text-muted-foreground">{s.sector}</span>
              </div>
              <span className="font-mono text-foreground">{(s.pct * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Position Form (add / edit) ───────────────────────────────────────────────
type FormState = {
  ticker: string;
  name: string;
  shares: string;
  avgCost: string;
  sleeve: PortfolioPositionSleeve;
  sector: string;
};

const EMPTY_FORM: FormState = {
  ticker: "",
  name: "",
  shares: "",
  avgCost: "",
  sleeve: "individual",
  sector: "Tech",
};

function positionToForm(p: PortfolioPosition): FormState {
  return {
    ticker:  p.ticker,
    name:    p.name,
    shares:  String(p.shares),
    avgCost: String(p.avgCost),
    sleeve:  p.sleeve,
    sector:  p.sector,
  };
}

function PositionModal({
  mode,
  position,
  onClose,
}: {
  mode: "add" | "edit";
  position: PortfolioPosition | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(
    mode === "edit" && position ? positionToForm(position) : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function field<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setError(null);
    };
  }

  function validate(): string | null {
    if (!form.ticker.trim()) return "Ticker is required.";
    if (!form.name.trim()) return "Name is required.";
    const shares = parseFloat(form.shares);
    if (isNaN(shares) || shares <= 0) return "Shares must be a positive number.";
    const avgCost = parseFloat(form.avgCost);
    if (isNaN(avgCost) || avgCost <= 0) return "Avg cost must be a positive number.";
    if (!form.sector.trim()) return "Sector is required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    const payload = {
      ticker:  form.ticker.trim().toUpperCase(),
      name:    form.name.trim(),
      shares:  parseFloat(form.shares),
      avgCost: parseFloat(form.avgCost),
      sleeve:  form.sleeve,
      sector:  form.sector.trim(),
    };

    try {
      if (mode === "add") {
        await createMutation.mutateAsync({ data: payload as PortfolioPositionInput });
      } else if (position) {
        await updateMutation.mutateAsync({ id: position.id, data: payload as PortfolioPositionUpdate });
      }
      await qc.invalidateQueries({ queryKey: getListPositionsQueryKey() });
      onClose();
    } catch {
      setError("Failed to save position. Please try again.");
    }
  }

  const inputCls = "w-full bg-muted/40 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors font-mono";
  const labelCls = "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative z-10 glass-card w-full max-w-md p-6 shadow-2xl border-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {mode === "add"
              ? <Plus className="w-4 h-4 text-primary" />
              : <Pencil className="w-4 h-4 text-primary" />
            }
            <h2 className="font-display font-semibold text-base text-foreground">
              {mode === "add" ? "Add Position" : "Edit Position"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ticker</label>
              <input
                className={inputCls}
                placeholder="e.g. NVDA"
                value={form.ticker}
                onChange={field("ticker")}
                autoFocus
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className={labelCls}>Sleeve</label>
              <select className={inputCls} value={form.sleeve} onChange={field("sleeve")}>
                {SLEEVE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              placeholder="e.g. NVIDIA Corporation"
              value={form.name}
              onChange={field("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Shares</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.shares}
                onChange={field("shares")}
              />
            </div>
            <div>
              <label className={labelCls}>Avg Cost ($)</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.avgCost}
                onChange={field("avgCost")}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Sector</label>
            <select className={inputCls} value={form.sector} onChange={field("sector")}>
              {SECTOR_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === "add" ? "Add Position" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────
function DeleteConfirmModal({
  position,
  onClose,
}: {
  position: PortfolioPosition;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const deleteMutation = useDeletePosition();

  async function handleDelete() {
    await deleteMutation.mutateAsync({ id: position.id });
    await qc.invalidateQueries({ queryKey: getListPositionsQueryKey() });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative z-10 glass-card w-full max-w-sm p-6 shadow-2xl border-red-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-base text-foreground">Remove Position</h2>
            <p className="text-xs text-muted-foreground">This cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 mb-5">
          Remove <span className="font-mono font-bold text-primary">{position.ticker}</span>{" "}
          ({position.name}) from your portfolio?
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Remove
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const now = useNow();
  const { data: positionsData, isLoading: positionsLoading } = useListPositions();
  const positions = positionsData ?? [];
  const positionSymbols = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { data: quotesData, isLoading: quotesLoading } = useMarketQuotes(positionSymbols, 60_000);
  const isLoading = positionsLoading || quotesLoading;
  const [period, setPeriod] = useState<Period>("3M");
  const [chartView, setChartView] = useState<"total" | "sleeves">("total");

  // Modal state
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<PortfolioPosition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioPosition | null>(null);

  function openAdd() { setModalMode("add"); setEditTarget(null); }
  function openEdit(p: PortfolioPosition) { setModalMode("edit"); setEditTarget(p); }
  function closeModal() { setModalMode(null); setEditTarget(null); }
  function openDelete(p: PortfolioPosition) { setDeleteTarget(p); }
  function closeDelete() { setDeleteTarget(null); }

  // Build enriched holdings from positions + real quotes
  const holdings = useMemo(() => {
    const quoteMap = new Map(
      (quotesData?.quotes ?? []).map((q) => [q.symbol, q]),
    );
    return positions.map((pos) => {
      const q = quoteMap.get(pos.ticker);
      const usable = q && isQuoteUsable(q);
      const price = usable ? q.price : 0;
      const dayChange = usable ? (q.change ?? 0) : 0;
      const value = price * pos.shares;
      const badge = usable ? quoteBadge(q) : null;
      const timestamp = usable ? q.timestamp : undefined;
      const isStale = usable ? (q.isStale ?? false) : false;
      const displaySleeve = sleeveLabel(pos.sleeve);
      return { ...pos, sleeve: displaySleeve, price, value, dayChange, badge, timestamp, isStale };
    });
  }, [quotesData, positions]);

  // Sleeve totals derived from real quote-priced holdings
  const sleeveData = useMemo(() => {
    const totals: Record<string, { total: number; dayChange: number }> = {
      "Roth IRA":   { total: 0, dayChange: 0 },
      "Individual": { total: 0, dayChange: 0 },
      "Crypto":     { total: 0, dayChange: 0 },
    };
    for (const h of holdings) {
      if (totals[h.sleeve]) {
        totals[h.sleeve]!.total     += h.value;
        totals[h.sleeve]!.dayChange += h.dayChange * h.shares;
      }
    }
    return totals;
  }, [holdings]);

  const totalValue     = Object.values(sleeveData).reduce((s, v) => s + v.total, 0);
  const totalDayChange = Object.values(sleeveData).reduce((s, v) => s + v.dayChange, 0);
  const totalGain      = holdings.reduce((s, h) => s + (h.price - h.avgCost) * h.shares, 0);
  const totalCost      = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalGainPct   = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const finalTotals = totalValue > 0 ? {
    roth:   sleeveData["Roth IRA"]!.total,
    indiv:  sleeveData["Individual"]!.total,
    crypto: sleeveData["Crypto"]!.total,
  } : null;

  const fullHistory = useMemo(() => generateHistory(finalTotals), [
    finalTotals?.roth,
    finalTotals?.indiv,
    finalTotals?.crypto,
  ]);

  const chartData = useMemo(() => {
    const n = PERIOD_SLICES[period];
    return fullHistory.slice(-n);
  }, [period, fullHistory]);

  const periodStart  = chartData[0]?.total ?? totalValue;
  const periodGain   = totalValue - periodStart;
  const periodGainPct = periodStart > 0 ? (periodGain / periodStart) * 100 : 0;

  const yMin = useMemo(() => {
    const vals = chartData.map((d) => chartView === "total" ? d.total : Math.min(d.rothIra, d.individual, d.crypto));
    return Math.floor(Math.min(...vals) * 0.98 / 5000) * 5000;
  }, [chartData, chartView]);

  const sourceSample = quotesData?.quotes[0];
  const sourceLabel = sourceSample && isQuoteUsable(sourceSample) ? sourceSample.sourceLabel : null;

  const oldestTimestamp = useMemo(() => {
    const ts = holdings
      .map((h) => h.timestamp)
      .filter((t): t is string => !!t)
      .map((t) => new Date(t).getTime())
      .filter((n) => !Number.isNaN(n));
    if (ts.length === 0) return undefined;
    return new Date(Math.min(...ts)).toISOString();
  }, [holdings]);

  const holdingsSorted = [...holdings].sort((a, b) => b.value - a.value);

  const isDataStale = useMemo(() => {
    if (!oldestTimestamp) return false;
    return now - new Date(oldestTimestamp).getTime() > FRESHNESS_WARNING_MS;
  }, [oldestTimestamp, now]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Modals */}
      <AnimatePresence>
        {(modalMode === "add" || modalMode === "edit") && (
          <PositionModal
            key="position-modal"
            mode={modalMode}
            position={editTarget}
            onClose={closeModal}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            key="delete-modal"
            position={deleteTarget}
            onClose={closeDelete}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Briefcase className="w-5 h-5 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Portfolio</h1>
          {isLoading && <span className="text-[10px] font-mono text-muted-foreground animate-pulse">Loading quotes…</span>}
          {sourceLabel && !isLoading && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              {sourceLabel}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm ml-8">Prices from live market data · Chart shows simulated history</p>
      </motion.div>

      {/* Freshness warning banner */}
      <AnimatePresence>
        {isDataStale && oldestTimestamp && (
          <motion.div
            key="freshness-banner"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: undefined }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-amber-300">
                  Markets may be closed —{" "}
                </span>
                <span className="text-sm text-amber-300/80">
                  prices last updated{" "}
                  <span className="font-mono font-semibold">{freshnessLabel(oldestTimestamp, now)}</span>.
                  Portfolio values may not reflect current market conditions.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Value",   value: totalValue > 0 ? `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—",    sub: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)} today`,   up: totalDayChange >= 0, freshness: oldestTimestamp },
          { label: "Day Change",    value: `${totalDayChange >= 0 ? "+" : ""}$${Math.abs(totalDayChange).toFixed(0)}`,                         sub: `${(totalValue > 0 ? totalDayChange / totalValue * 100 : 0).toFixed(2)}% today`,     up: totalDayChange >= 0, freshness: undefined },
          { label: "Total Gain",    value: totalGain !== 0 ? `${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—", sub: `${totalGainPct.toFixed(1)}% all-time`, up: totalGain >= 0, freshness: undefined },
          { label: "Holdings",      value: String(positions.length),                                                                              sub: "across 3 sleeves",                                                                  up: true, freshness: undefined },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 group cursor-default">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="font-mono text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={cn("text-xs mt-1 flex items-center gap-1 font-mono", stat.up ? "text-emerald-400" : "text-red-400")}>
              {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{stat.sub}
            </p>
            {stat.freshness && (
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                as of {freshnessLabel(stat.freshness, now)}
              </p>
            )}
          </div>
        ))}
      </motion.div>

      {/* Performance Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-4 h-4 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-display font-semibold text-foreground">Performance</h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-muted-foreground">Simulated history</span>
              </div>
              <p className={cn("text-xs font-mono", periodGain >= 0 ? "text-emerald-400" : "text-red-400")}>
                {periodGain >= 0 ? "+" : ""}${Math.abs(periodGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                &ensp;({periodGain >= 0 ? "+" : ""}{periodGainPct.toFixed(2)}%) &nbsp;·&nbsp; {period}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border/50">
              {(["total", "sleeves"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                    chartView === v
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === "sleeves" ? "By Sleeve" : "Combined"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {(Object.keys(PERIOD_SLICES) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    period === p
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 pt-6 pb-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C4A44A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C4A44A" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradRoth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C4A44A" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#C4A44A" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradIndiv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradCrypto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 15% / 0.6)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(240 5% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                interval={period === "1W" ? 0 : period === "1M" ? 3 : 8}
              />
              <YAxis
                domain={[yMin, "auto"]}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                tick={{ fill: "hsl(240 5% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                width={54}
              />
              <Tooltip
                content={<ChartTooltip view={chartView} />}
                cursor={{ stroke: "hsl(43 63% 52% / 0.3)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />

              {chartView === "total" ? (
                <Area
                  type="monotone"
                  dataKey="total"
                  name="total"
                  stroke="#C4A44A"
                  strokeWidth={2}
                  fill="url(#gradTotal)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#C4A44A", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              ) : (
                <>
                  <Area type="monotone" dataKey="rothIra"    name="rothIra"    stroke="#C4A44A" strokeWidth={1.5} fill="url(#gradRoth)"   dot={false} activeDot={{ r: 3, fill: "#C4A44A", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                  <Area type="monotone" dataKey="individual" name="individual" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gradIndiv)"  dot={false} activeDot={{ r: 3, fill: "#3b82f6", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                  <Area type="monotone" dataKey="crypto"     name="crypto"     stroke="#10b981" strokeWidth={1.5} fill="url(#gradCrypto)" dot={false} activeDot={{ r: 3, fill: "#10b981", stroke: "hsl(220 20% 4%)", strokeWidth: 2 }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                  <Legend
                    wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", paddingTop: 12 }}
                    formatter={(value) =>
                      value === "rothIra" ? "Roth IRA" : value === "individual" ? "Individual" : "Crypto"
                    }
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Sleeve cards + sector allocation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {SLEEVES.map((sleeve, i) => {
          const data = sleeveData[sleeve.key] ?? { total: 0, dayChange: 0 };
          const pct = totalValue > 0 ? (data.total / totalValue) * 100 : 0;
          return (
            <motion.div
              key={sleeve.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{sleeve.icon}</span>
                <h3 className="font-display font-semibold text-sm text-foreground">{sleeve.label}</h3>
              </div>
              <p className="font-mono text-xl font-bold text-foreground mb-0.5">
                {data.total > 0 ? `$${data.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
              </p>
              <p className={cn("text-xs font-mono mb-3", data.dayChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                {data.dayChange >= 0 ? "+" : ""}${Math.abs(data.dayChange).toFixed(0)}&ensp;({pct.toFixed(1)}% of total)
              </p>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Weight</span><span>{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.1 }}
                    className={cn("h-full rounded-full", sleeve.color)}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <SectorAllocation holdings={holdingsSorted} />
        </motion.div>
      </div>

      {/* Holdings table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-display font-semibold text-primary">All Holdings</h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono">
              Sorted by value · {positions.length} positions · {sourceLabel ?? "Loading prices…"}
            </span>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 hover:border-primary/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Position
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Ticker", "Name", "Sleeve", "Shares", "Avg Cost", "Price", "Value", "Gain $", "Gain %", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider last:w-20">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdingsSorted.map((h, i) => {
                const gain    = h.price > 0 ? (h.price - h.avgCost) * h.shares : 0;
                const gainPct = h.price > 0 ? ((h.price - h.avgCost) / h.avgCost) * 100 : 0;
                const rawPosition = positions.find((p) => p.id === h.id)!;
                return (
                  <motion.tr
                    key={h.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/30 hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary group-hover:text-primary/80">{h.ticker}</span>
                        {h.badge && (
                          <span className={cn("text-[8px] font-mono font-bold px-1 py-0.5 rounded", {
                            "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20": h.badge.tone === "live",
                            "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20": h.badge.tone === "delayed",
                            "text-amber-400 bg-amber-500/10 border border-amber-500/20": h.badge.tone === "stale",
                            "text-muted-foreground bg-muted/30 border border-border/40": h.badge.tone === "ref",
                          })}>
                            {h.badge.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{h.name}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted/50 border border-border/50 text-muted-foreground">{h.sleeve}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{h.shares}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">${h.avgCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-foreground">
                        {h.price > 0 ? `$${h.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                      </div>
                      {h.timestamp && (
                        <div className={cn("font-mono text-[9px] mt-0.5", h.isStale ? "text-amber-400" : "text-muted-foreground/60")}>
                          {freshnessLabel(h.timestamp, now)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                      {h.value > 0 ? `$${h.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", gain >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {h.price > 0 ? `${gain >= 0 ? "+" : ""}$${Math.abs(gain).toFixed(0)}` : "—"}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-xs font-semibold", gainPct >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {h.price > 0 ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%` : "—"}
                    </td>
                    {/* Action icons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(rawPosition)}
                          title="Edit position"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelete(rawPosition)}
                          title="Remove position"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {holdingsSorted.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No positions yet.{" "}
                    <button onClick={openAdd} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                      Add your first position
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
