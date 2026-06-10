import * as React from "react";
import { useLocation } from "wouter";
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

/**
 * Tracks how many seconds remain until the next data refresh and returns a
 * 0–100 progress value (100 = just fetched, 0 = due now).
 */
function useRefreshCountdown(lastFetchedAt: number, intervalMs: number) {
  const totalSeconds = Math.max(1, Math.round(intervalMs / 1000));

  const computeSecondsLeft = React.useCallback(() => {
    if (!lastFetchedAt) return totalSeconds;
    const elapsed = Date.now() - lastFetchedAt;
    return Math.max(0, Math.round((intervalMs - elapsed) / 1000));
  }, [lastFetchedAt, intervalMs, totalSeconds]);

  const [secondsLeft, setSecondsLeft] = React.useState<number>(computeSecondsLeft);

  React.useEffect(() => {
    setSecondsLeft(computeSecondsLeft());
    const id = setInterval(() => setSecondsLeft(computeSecondsLeft()), 1000);
    return () => clearInterval(id);
  }, [computeSecondsLeft]);

  const progressPercent = (secondsLeft / totalSeconds) * 100;

  return { secondsLeft, progressPercent };
}

function formatCountdown(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

export function TickerTape() {
  const [, navigate] = useLocation();

  const {
    quotes: rawQuotes,
    isError,
    equityRefetchMs,
    cryptoRefetchMs,
    equityDataUpdatedAt,
    cryptoDataUpdatedAt,
  } = useTickerQuotes();

  const quotes: Quote[] = React.useMemo(
    () => rawQuotes.filter(isQuoteUsable),
    [rawQuotes],
  );

  const { secondsLeft: eqSecondsLeft, progressPercent: eqProgress } =
    useRefreshCountdown(equityDataUpdatedAt, equityRefetchMs);
  const { secondsLeft: cryptoSecondsLeft, progressPercent: cryptoProgress } =
    useRefreshCountdown(cryptoDataUpdatedAt, cryptoRefetchMs);

  // Pause scroll on hover — declared before any early returns to satisfy Rules of Hooks.
  const [isPaused, setIsPaused] = React.useState(false);

  // Track which specific ticker item the cursor is over.
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);

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
    <div
      className="relative flex overflow-hidden border-b border-primary/10 py-1.5 font-mono text-xs whitespace-nowrap z-50 bg-background/95 backdrop-blur-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => { setIsPaused(false); setHoveredKey(null); }}
    >
      {/* Gold gradient fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Subtle gold scanning line across top */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(43 63% 52% / 0.6) 30%, hsl(43 63% 52% / 0.9) 50%, hsl(43 63% 52% / 0.6) 70%, transparent 100%)",
        }}
      />

      {/*
       * Split bottom-edge progress bar:
       *   Left half  → equity countdown  (gold, anchored left)
       *   Right half → crypto countdown  (emerald, anchored right)
       * Each fills from its edge inward and resets independently.
       */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-px z-20 transition-[width] duration-1000 ease-linear"
        style={{
          width: `${eqProgress / 2}%`,
          background:
            "linear-gradient(90deg, hsl(43 63% 52% / 0.25), hsl(43 63% 52% / 0.7))",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-px z-20 transition-[width] duration-1000 ease-linear"
        style={{
          width: `${cryptoProgress / 2}%`,
          background:
            "linear-gradient(270deg, hsl(160 100% 39% / 0.25), hsl(160 100% 39% / 0.7))",
        }}
      />

      {/*
       * Two labeled countdown badges — equity (gold) and crypto (emerald).
       * Positioned over the right fade, stacked vertically, font-mono 9px.
       */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-20 flex items-center justify-end pr-2"
        aria-label={`Equity refresh in ${formatCountdown(eqSecondsLeft)}, crypto refresh in ${formatCountdown(cryptoSecondsLeft)}`}
      >
        <div className="flex flex-col items-end gap-px">
          <span
            className={cn(
              "font-mono text-[9px] tabular-nums select-none transition-colors duration-500",
              eqSecondsLeft <= 5
                ? "text-primary/90 animate-[countdown-pulse-gold_1s_ease-in-out_infinite]"
                : "text-muted-foreground/40",
            )}
          >
            EQ&thinsp;{formatCountdown(eqSecondsLeft)}
          </span>
          <span
            className={cn(
              "font-mono text-[9px] tabular-nums select-none transition-colors duration-500",
              cryptoSecondsLeft <= 5
                ? "text-emerald-400/90 animate-[countdown-pulse-emerald_1s_ease-in-out_infinite]"
                : "text-muted-foreground/40",
            )}
          >
            ₿&thinsp;{formatCountdown(cryptoSecondsLeft)}
          </span>
        </div>
      </div>

      <div
        className="flex animate-[ticker_35s_linear_infinite]"
        style={{ animationPlayState: isPaused ? "paused" : "running" }}
      >
        {[...quotes, ...quotes, ...quotes].map((item, i) => {
          const flash = flashes[item.symbol];
          const badge = quoteBadge(item);
          const itemKey = `${item.symbol}-${i}`;
          const isHovered = hoveredKey === itemKey;
          const isDimmed = hoveredKey !== null && !isHovered;
          const targetPath = item.assetClass === "crypto"
            ? `/markets/crypto?symbol=${item.symbol}`
            : `/markets?symbol=${item.symbol}`;

          return (
            <div
              key={itemKey}
              title={quoteTooltip(item)}
              role="button"
              tabIndex={0}
              aria-label={`View ${item.symbol} on Markets page`}
              onMouseEnter={() => setHoveredKey(itemKey)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => { setIsPaused(false); setHoveredKey(null); navigate(targetPath); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsPaused(false); setHoveredKey(null); navigate(targetPath); } }}
              className={cn(
                "flex items-center mx-5 gap-2 group cursor-pointer rounded px-1.5 -mx-0.5 transition-all duration-200",
                isHovered && "bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_8px_hsl(43_63%_52%/0.15)]",
                isDimmed && "opacity-35",
              )}
            >
              <span className="flex items-center gap-1">
                <span className={cn(
                  "font-bold tracking-wide transition-colors duration-200",
                  isHovered ? "text-primary" : "text-foreground/90 group-hover:text-primary",
                )}>
                  {item.symbol}
                </span>
                {item.isFallback && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80 flex-shrink-0"
                    aria-label="Fallback source in use"
                  />
                )}
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
        @keyframes countdown-pulse-gold {
          0%, 100% { opacity: 1; text-shadow: 0 0 4px hsl(43 63% 52% / 0.5); }
          50%       { opacity: 0.55; text-shadow: 0 0 8px hsl(43 63% 52% / 0.9); }
        }
        @keyframes countdown-pulse-emerald {
          0%, 100% { opacity: 1; text-shadow: 0 0 4px hsl(160 100% 39% / 0.5); }
          50%       { opacity: 0.55; text-shadow: 0 0 8px hsl(160 100% 39% / 0.9); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[ticker_35s_linear_infinite\\]   { animation: none; }
          .animate-\\[price-flash-up_0\\.9s_ease-out\\]   { animation: none; }
          .animate-\\[price-flash-down_0\\.9s_ease-out\\] { animation: none; }
          .animate-\\[countdown-pulse-gold_1s_ease-in-out_infinite\\]    { animation: none; }
          .animate-\\[countdown-pulse-emerald_1s_ease-in-out_infinite\\] { animation: none; }
        }
      `,
        }}
      />
    </div>
  );
}
