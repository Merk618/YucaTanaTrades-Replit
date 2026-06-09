import * as React from "react";
import { cn } from "@/lib/utils";
import {
  useTickerQuotes,
  formatPrice,
  isQuoteUsable,
  quoteBadge,
  quoteTooltip,
  type Quote,
} from "@/hooks/use-market";

type FlashMap = Record<string, "up" | "down">;

export function TickerTape() {
  const { quotes: rawQuotes, isError } = useTickerQuotes();

  const quotes: Quote[] = React.useMemo(
    () => rawQuotes.filter(isQuoteUsable),
    [rawQuotes],
  );

  // Track previous prices so we can detect changes and fire flash animations.
  const prevPricesRef = React.useRef<Record<string, number>>({});
  const [flashes, setFlashes] = React.useState<FlashMap>({});

  React.useEffect(() => {
    if (quotes.length === 0) return;

    const newFlashes: FlashMap = {};
    let hasChanges = false;

    for (const q of quotes) {
      const prev = prevPricesRef.current[q.symbol];
      if (prev !== undefined && prev !== q.price) {
        newFlashes[q.symbol] = q.price > prev ? "up" : "down";
        hasChanges = true;
      }
      prevPricesRef.current[q.symbol] = q.price;
    }

    if (!hasChanges) return;

    setFlashes(newFlashes);
    const timer = setTimeout(() => setFlashes({}), 900);
    return () => clearTimeout(timer);
  }, [quotes]);

  // Honest empty / error state — never fabricate a scrolling tape.
  if (quotes.length === 0) {
    return (
      <div className="flex items-center justify-center border-b border-primary/10 py-1.5 font-mono text-xs whitespace-nowrap z-50 bg-background/95 backdrop-blur-sm text-muted-foreground/50">
        {isError
          ? "Market data unavailable — sources unreachable"
          : "Connecting to market data sources…"}
      </div>
    );
  }

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
        {[...quotes, ...quotes, ...quotes].map((item, i) => {
          const flash = flashes[item.symbol];
          const badge = quoteBadge(item);

          return (
            <div
              key={`${item.symbol}-${i}`}
              title={quoteTooltip(item)}
              className="flex items-center mx-5 gap-2 group cursor-help"
            >
              <span className="font-bold text-foreground/90 tracking-wide group-hover:text-primary transition-colors duration-200">
                {item.symbol}
              </span>

              {/* Price — flashes green/red when it changes */}
              <span
                className={cn(
                  "tabular-nums rounded px-0.5 transition-colors",
                  flash === "up" &&
                    "animate-[price-flash-up_0.9s_ease-out] text-emerald-300",
                  flash === "down" &&
                    "animate-[price-flash-down_0.9s_ease-out] text-red-300",
                  !flash && "text-muted-foreground/70",
                )}
              >
                {formatPrice(item.price)}
              </span>

              <span
                className={cn(
                  "font-semibold tabular-nums",
                  item.changePercent >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {item.changePercent >= 0 ? "▲" : "▼"}&thinsp;
                {Math.abs(item.changePercent).toFixed(2)}%
              </span>

              {/* Source badge — fades in on hover, stays within tape bounds */}
              <span
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                  "px-1.5 py-px rounded text-[9px] font-semibold border leading-tight",
                  badge.tone === "live" &&
                    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                  badge.tone === "delayed" &&
                    "bg-amber-500/15 text-amber-300 border-amber-500/30",
                  badge.tone === "ref" &&
                    "bg-blue-500/15 text-blue-300 border-blue-500/30",
                  badge.tone === "stale" &&
                    "bg-red-500/15 text-red-300 border-red-500/30",
                )}
              >
                {badge.text}&thinsp;·&thinsp;{item.sourceLabel}
              </span>

              <span className="text-border/60 select-none mx-1">·</span>
            </div>
          );
        })}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes price-flash-up {
          0%   { color: rgb(110 231 183); background-color: rgb(52 211 153 / 0.18); }
          100% { color: inherit; background-color: transparent; }
        }
        @keyframes price-flash-down {
          0%   { color: rgb(252 165 165); background-color: rgb(248 113 113 / 0.18); }
          100% { color: inherit; background-color: transparent; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[ticker_35s_linear_infinite\\]   { animation: none; }
          .animate-\\[price-flash-up_0\\.9s_ease-out\\]   { animation: none; }
          .animate-\\[price-flash-down_0\\.9s_ease-out\\] { animation: none; }
        }
      `,
        }}
      />
    </div>
  );
}
