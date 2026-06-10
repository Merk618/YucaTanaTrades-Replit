import * as React from "react";

/**
 * Tracks how many seconds remain until the next data refresh and returns a
 * 0–100 progress value (100 = just fetched, 0 = due now).
 */
export function useRefreshCountdown(lastFetchedAt: number, intervalMs: number) {
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

/** Returns animation duration in seconds — shorter as the deadline approaches. */
export function countdownPulseDuration(secondsLeft: number): number {
  return Math.max(0.2, secondsLeft * 0.2);
}

export function formatCountdown(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}
