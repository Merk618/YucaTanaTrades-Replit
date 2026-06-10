import * as React from "react";
import * as ReactDOM from "react-dom";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTickerQuotes,
  formatPrice,
  isQuoteUsable,
  quoteBadge,
  quoteTooltip,
  freshnessLabel,
  useNow,
  type Quote,
} from "@/hooks/use-market";
import {
  useRefreshCountdown,
  countdownPulseDuration,
  formatCountdown,
} from "@/hooks/use-refresh-countdown";

type FlashMap = Record<string, "up" | "down">;

// ---------------------------------------------------------------------------
// Hover tooltip — "↗ View on Markets" — rendered via portal so the tape's
// overflow:hidden doesn't clip it.
// ---------------------------------------------------------------------------
interface HoverTooltipProps {
  anchorRect: DOMRect;
}

function HoverTooltip({ anchorRect }: HoverTooltipProps) {
  const tooltipWidth = 140;
  const left = Math.min(
    Math.max(anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2, 8),
    (typeof window !== "undefined" ? window.innerWidth : 1200) - tooltipWidth - 8,
  );
  const top = anchorRect.bottom + 6;

  return ReactDOM.createPortal(
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top,
        left,
        width: tooltipWidth,
        zIndex: 9998,
        pointerEvents: "none",
      }}
      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-card/90 border border-primary/30 shadow-[0_4px_16px_hsl(43_63%_52%/0.2)] animate-in fade-in duration-100"
    >
      <span className="text-[10px] font-semibold text-primary/90 tracking-wide select-none whitespace-nowrap">
        ↗ View on Markets
      </span>
    </div>,
    document.body,
  );
}

function formatVolume(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return "—";
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Pinned detail panel — rendered via portal so overflow:hidden on the tape
// wrapper doesn't clip it.
// ---------------------------------------------------------------------------
interface PinnedPanelProps {
  quote: Quote;
  anchorX: number;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

function PinnedPanel({ quote, anchorX, onClose, onNavigate }: PinnedPanelProps) {
  const now = useNow();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const badge = quoteBadge(quote);

  const targetPath =
    quote.assetClass === "crypto"
      ? `/markets/crypto?symbol=${quote.symbol}`
      : `/markets?symbol=${quote.symbol}`;

  // Click-outside to close
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Escape to close
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Clamp left so panel stays within viewport (panel is ~256px wide)
  const panelWidth = 256;
  const clampedLeft = Math.min(
    Math.max(anchorX, 8),
    (typeof window !== "undefined" ? window.innerWidth : 1200) - panelWidth - 8,
  );

  const isPositive = quote.changePercent >= 0;

  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${quote.symbol} quote detail`}
      aria-modal="false"
      style={{
        position: "fixed",
        top: 36,
        left: clampedLeft,
        width: panelWidth,
        zIndex: 9999,
      }}
      className={cn(
        "glass-card rounded-xl border border-primary/25 shadow-[0_8px_32px_hsl(43_63%_52%/0.15),0_2px_8px_hsl(0_0%_0%/0.5)]",
        "p-4 flex flex-col gap-3",
        "animate-in fade-in slide-in-from-top-1 duration-150",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base text-primary tracking-wide">
              {quote.symbol}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 border border-muted-foreground/20 rounded px-1 py-px">
              {quote.assetClass}
            </span>
            {quote.isFallback && (
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80 flex-shrink-0"
                title="Fallback source in use"
              />
            )}
          </div>
          <span className="font-mono text-2xl font-bold text-foreground tabular-nums leading-none">
            {formatPrice(quote.price)}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="text-muted-foreground/50 hover:text-foreground transition-colors rounded p-0.5 -mt-0.5 -mr-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* Change row */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-mono font-semibold text-sm tabular-nums",
            isPositive ? "text-emerald-400" : "text-red-400",
          )}
        >
          {isPositive ? "▲" : "▼"}&thinsp;
          {Math.abs(quote.changePercent).toFixed(2)}%
        </span>
        <span
          className={cn(
            "font-mono text-xs tabular-nums text-muted-foreground/70",
          )}
        >
          ({isPositive ? "+" : ""}
          {quote.change.toFixed(2)} pts)
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-primary/10" />

      {/* Detail rows */}
      <div className="flex flex-col gap-1.5 text-xs">
        {/* Source badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground/60">Source</span>
          <span
            className={cn(
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
            {badge.text}&thinsp;·&thinsp;{quote.sourceLabel}
          </span>
        </div>

        {/* OHLC rows — only shown when provider supplies them */}
        {(quote.open != null || quote.high != null || quote.low != null) && (
          <>
            <div className="h-px bg-primary/10" />
            {quote.open != null && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground/60">Open</span>
                <span className="font-mono tabular-nums text-foreground/80">
                  {formatPrice(quote.open)}
                </span>
              </div>
            )}
            {quote.high != null && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground/60">High</span>
                <span className="font-mono tabular-nums text-emerald-400/80">
                  {formatPrice(quote.high)}
                </span>
              </div>
            )}
            {quote.low != null && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground/60">Low</span>
                <span className="font-mono tabular-nums text-red-400/80">
                  {formatPrice(quote.low)}
                </span>
              </div>
            )}
            {quote.volume != null && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground/60">Volume</span>
                <span className="font-mono tabular-nums text-foreground/80">
                  {formatVolume(quote.volume)}
                </span>
              </div>
            )}
          </>
        )}

        <div className="h-px bg-primary/10" />

        {/* Provider */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground/60">Provider</span>
          <span className="font-mono text-foreground/80">{quote.provider}</span>
        </div>

        {/* Market session */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground/60">Session</span>
          <span
            className={cn(
              "font-semibold",
              quote.marketSession === "open"
                ? "text-emerald-400"
                : "text-muted-foreground/60",
            )}
          >
            {quote.marketSession === "open" ? "Open" : "Closed"}
          </span>
        </div>

        {/* Freshness */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground/60">As of</span>
          <span className="font-mono text-muted-foreground/70 tabular-nums">
            {freshnessLabel(quote.timestamp, now)}
          </span>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground/60">Confidence</span>
          <span
            className={cn(
              "font-mono tabular-nums",
              quote.confidence >= 0.8
                ? "text-emerald-400"
                : quote.confidence >= 0.5
                  ? "text-amber-400"
                  : "text-red-400",
            )}
          >
            {Math.round(quote.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Footer — navigate link */}
      <button
        onClick={() => { onClose(); onNavigate(targetPath); }}
        className={cn(
          "mt-1 w-full text-center text-xs font-semibold text-primary/80 hover:text-primary",
          "border border-primary/20 hover:border-primary/40 rounded-lg py-1.5",
          "transition-colors duration-150",
        )}
      >
        View on Markets →
      </button>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Main TickerTape component
// ---------------------------------------------------------------------------
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

  // Bounding rect of the currently hovered ticker item (for the tooltip portal).
  const [hoveredRect, setHoveredRect] = React.useState<DOMRect | null>(null);

  // Pinned quote panel state.
  const [pinnedQuote, setPinnedQuote] = React.useState<Quote | null>(null);
  const [pinnedX, setPinnedX] = React.useState(0);

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

  const handleClose = React.useCallback(() => {
    setPinnedQuote(null);
    setIsPaused(false);
  }, []);

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
    <>
      {pinnedQuote && (
        <PinnedPanel
          quote={pinnedQuote}
          anchorX={pinnedX}
          onClose={handleClose}
          onNavigate={(path) => { handleClose(); navigate(path); }}
        />
      )}

      {/* Hover tooltip — only shown when hovering and no pinned panel is open */}
      {!pinnedQuote && hoveredRect && (
        <HoverTooltip anchorRect={hoveredRect} />
      )}

      <div
        className="relative flex overflow-hidden border-b border-primary/10 py-1.5 font-mono text-xs whitespace-nowrap z-50 bg-background/95 backdrop-blur-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (!pinnedQuote) setIsPaused(false);
          setHoveredKey(null);
          setHoveredRect(null);
        }}
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
                "countdown-badge font-mono text-[9px] tabular-nums select-none transition-colors duration-500",
                eqSecondsLeft <= 5 ? "text-primary/90" : "text-muted-foreground/40",
              )}
              style={
                eqSecondsLeft <= 5
                  ? {
                      animationName: "countdown-pulse-gold",
                      animationDuration: `${countdownPulseDuration(eqSecondsLeft)}s`,
                      animationTimingFunction: "ease-in-out",
                      animationIterationCount: "infinite",
                    }
                  : undefined
              }
            >
              EQ&thinsp;{formatCountdown(eqSecondsLeft)}
            </span>
            <span
              className={cn(
                "countdown-badge font-mono text-[9px] tabular-nums select-none transition-colors duration-500",
                cryptoSecondsLeft <= 5 ? "text-emerald-400/90" : "text-muted-foreground/40",
              )}
              style={
                cryptoSecondsLeft <= 5
                  ? {
                      animationName: "countdown-pulse-emerald",
                      animationDuration: `${countdownPulseDuration(cryptoSecondsLeft)}s`,
                      animationTimingFunction: "ease-in-out",
                      animationIterationCount: "infinite",
                    }
                  : undefined
              }
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
            const isPinned = pinnedQuote?.symbol === item.symbol;
            const isDimmed = hoveredKey !== null && !isHovered && !isPinned;

            return (
              <div
                key={itemKey}
                title={quoteTooltip(item)}
                role="button"
                tabIndex={0}
                aria-label={`Pin ${item.symbol} detail panel`}
                aria-pressed={isPinned}
                onMouseEnter={(e) => {
                  setHoveredKey(itemKey);
                  setHoveredRect((e.currentTarget as HTMLElement).getBoundingClientRect());
                }}
                onMouseLeave={() => {
                  setHoveredKey(null);
                  setHoveredRect(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPinned) {
                    handleClose();
                    return;
                  }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setPinnedX(rect.left);
                  setPinnedQuote(item);
                  setIsPaused(true);
                  setHoveredKey(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (isPinned) {
                      handleClose();
                      return;
                    }
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setPinnedX(rect.left);
                    setPinnedQuote(item);
                    setIsPaused(true);
                    setHoveredKey(null);
                  }
                }}
                className={cn(
                  "flex items-center mx-5 gap-2 group cursor-pointer rounded px-1.5 -mx-0.5 transition-all duration-200",
                  (isHovered || isPinned) && "bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_8px_hsl(43_63%_52%/0.15)]",
                  isPinned && "ring-primary/40",
                  isDimmed && !isPinned && "opacity-35",
                )}
              >
                <span className="flex items-center gap-1">
                  <span className={cn(
                    "font-bold tracking-wide transition-colors duration-200",
                    (isHovered || isPinned) ? "text-primary" : "text-foreground/90 group-hover:text-primary",
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
          @media (prefers-reduced-motion: reduce) {
            .animate-\\[ticker_35s_linear_infinite\\]   { animation: none; }
            .animate-\\[price-flash-up_0\\.9s_ease-out\\]   { animation: none; }
            .animate-\\[price-flash-down_0\\.9s_ease-out\\] { animation: none; }
          }
        `,
          }}
        />
      </div>
    </>
  );
}
