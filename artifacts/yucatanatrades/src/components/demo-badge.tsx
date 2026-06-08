import { cn } from "@/lib/utils";

// Honest marker for UI still backed by simulated/demo content (not a live feed).
export function DemoBadge({ className, label = "Demo Data" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
        className,
      )}
      style={{ background: "rgba(148,163,184,0.10)", border: "1px solid rgba(148,163,184,0.25)", color: "#94a3b8" }}
      title="Simulated demo data — not a live market feed"
    >
      {label}
    </span>
  );
}
