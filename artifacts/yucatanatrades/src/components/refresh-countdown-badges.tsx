import * as React from "react";
import { cn } from "@/lib/utils";
import {
  useRefreshCountdown,
  countdownPulseDuration,
  formatCountdown,
} from "@/hooks/use-refresh-countdown";

interface RefreshCountdownBadgesProps {
  equityDataUpdatedAt?: number;
  equityRefetchMs?: number;
  cryptoDataUpdatedAt?: number;
  cryptoRefetchMs?: number;
  className?: string;
}

/**
 * Inline EQ / ₿ countdown badges for use in page-level section headers.
 * Pass equity props to show the EQ badge, crypto props to show the ₿ badge.
 * Either or both can be shown. Same pulse animation as the ticker tape at ≤ 5 s.
 * Respects prefers-reduced-motion via the global .countdown-badge rule in index.css.
 */
export function RefreshCountdownBadges({
  equityDataUpdatedAt,
  equityRefetchMs,
  cryptoDataUpdatedAt,
  cryptoRefetchMs,
  className,
}: RefreshCountdownBadgesProps) {
  const showEquity = equityDataUpdatedAt !== undefined && equityRefetchMs !== undefined;
  const showCrypto = cryptoDataUpdatedAt !== undefined && cryptoRefetchMs !== undefined;

  const { secondsLeft: eqSec } = useRefreshCountdown(
    equityDataUpdatedAt ?? 0,
    equityRefetchMs ?? 60_000,
  );
  const { secondsLeft: btcSec } = useRefreshCountdown(
    cryptoDataUpdatedAt ?? 0,
    cryptoRefetchMs ?? 60_000,
  );

  if (!showEquity && !showCrypto) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={[
        showEquity && `Equity refresh in ${formatCountdown(eqSec)}`,
        showCrypto && `Crypto refresh in ${formatCountdown(btcSec)}`,
      ].filter(Boolean).join(", ")}
    >
      {showEquity && (
        <span
          className={cn(
            "countdown-badge font-mono text-[9px] tabular-nums select-none transition-colors duration-500",
            eqSec <= 5 ? "text-primary/90" : "text-muted-foreground/40",
          )}
          style={
            eqSec <= 5
              ? {
                  animationName: "countdown-pulse-gold",
                  animationDuration: `${countdownPulseDuration(eqSec)}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                }
              : undefined
          }
        >
          EQ&thinsp;{formatCountdown(eqSec)}
        </span>
      )}
      {showCrypto && (
        <span
          className={cn(
            "countdown-badge font-mono text-[9px] tabular-nums select-none transition-colors duration-500",
            btcSec <= 5 ? "text-emerald-400/90" : "text-muted-foreground/40",
          )}
          style={
            btcSec <= 5
              ? {
                  animationName: "countdown-pulse-emerald",
                  animationDuration: `${countdownPulseDuration(btcSec)}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                }
              : undefined
          }
        >
          ₿&thinsp;{formatCountdown(btcSec)}
        </span>
      )}
    </span>
  );
}
