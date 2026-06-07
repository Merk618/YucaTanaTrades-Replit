import * as React from "react";
import { mockMarketData } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function TickerTape() {
  return (
    <div className="relative flex overflow-hidden border-b border-primary/10 py-1.5 font-mono text-xs whitespace-nowrap z-50 bg-background/95 backdrop-blur-sm">
      {/* Gold gradient fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Subtle gold scanning line across top */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(43 63% 52% / 0.6) 30%, hsl(43 63% 52% / 0.9) 50%, hsl(43 63% 52% / 0.6) 70%, transparent 100%)",
        }}
      />

      <div className="flex animate-[ticker_35s_linear_infinite]">
        {[...mockMarketData, ...mockMarketData, ...mockMarketData].map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center mx-5 gap-2 group">
            <span className="font-bold text-foreground/90 tracking-wide group-hover:text-primary transition-colors duration-200">
              {item.symbol}
            </span>
            <span className="text-muted-foreground/70 tabular-nums">
              {item.price.toLocaleString("en-US", {
                minimumFractionDigits: item.price < 10 ? 4 : 2,
                maximumFractionDigits: item.price < 10 ? 4 : 2,
              })}
            </span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                item.changePercent >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {item.changePercent >= 0 ? "▲" : "▼"}&thinsp;
              {Math.abs(item.changePercent).toFixed(2)}%
            </span>
            <span className="text-border/60 select-none mx-1">·</span>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[ticker_35s_linear_infinite\\] { animation: none; }
        }
      ` }} />
    </div>
  );
}
