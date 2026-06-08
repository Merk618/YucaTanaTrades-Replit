import type { MarketSessionInfo, MarketSessionState } from "./types";

// ─── US equity market session ────────────────────────────────────────────────
// Computes the real NYSE/NASDAQ session state in America/New_York, including
// pre-market (4:00–9:30), regular (9:30–16:00), post-market (16:00–20:00),
// weekends, and a static holiday calendar. Crypto is always 24/7.

const NY_TZ = "America/New_York";

// NYSE full-day holidays (YYYY-MM-DD, America/New_York). Maintained statically.
const HOLIDAYS = new Set<string>([
  // 2025
  "2025-01-01", "2025-01-20", "2025-02-17", "2025-04-18", "2025-05-26",
  "2025-06-19", "2025-07-04", "2025-09-01", "2025-11-27", "2025-12-25",
  // 2026
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
  "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
]);

interface NyParts {
  year: number;
  month: number;
  day: number;
  weekday: number; // 0 = Sun .. 6 = Sat
  minutes: number; // minutes since midnight ET
  dateKey: string; // YYYY-MM-DD
}

function nyParts(date: Date): NyParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0; // some engines emit 24 at midnight
  const minute = Number(get("minute"));
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const weekday = weekdayMap[get("weekday")] ?? 0;
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;
  return { year, month, day, weekday, minutes: hour * 60 + minute, dateKey };
}

const PRE_OPEN = 4 * 60; // 04:00
const REGULAR_OPEN = 9 * 60 + 30; // 09:30
const REGULAR_CLOSE = 16 * 60; // 16:00
const POST_CLOSE = 20 * 60; // 20:00

export function getEquitySession(now: Date = new Date()): {
  state: MarketSessionState;
  isOpen: boolean;
  label: string;
} {
  const p = nyParts(now);
  const isWeekend = p.weekday === 0 || p.weekday === 6;
  const isHoliday = HOLIDAYS.has(p.dateKey);

  if (isWeekend || isHoliday) {
    return {
      state: isHoliday ? "holiday" : "closed",
      isOpen: false,
      label: isHoliday ? "Market Holiday" : "Markets Closed",
    };
  }

  if (p.minutes >= REGULAR_OPEN && p.minutes < REGULAR_CLOSE) {
    return { state: "open", isOpen: true, label: "Markets Open" };
  }
  if (p.minutes >= PRE_OPEN && p.minutes < REGULAR_OPEN) {
    return { state: "pre", isOpen: false, label: "Pre-Market" };
  }
  if (p.minutes >= REGULAR_CLOSE && p.minutes < POST_CLOSE) {
    return { state: "post", isOpen: false, label: "After-Hours" };
  }
  return { state: "closed", isOpen: false, label: "Markets Closed" };
}

export function getMarketSession(now: Date = new Date()): MarketSessionInfo {
  const eq = getEquitySession(now);
  return {
    equities: {
      state: eq.state,
      isOpen: eq.isOpen,
      label: eq.label,
      nextChange: null,
      timezone: NY_TZ,
    },
    crypto: {
      state: "24h",
      isOpen: true,
      label: "24/7",
    },
    asOf: now.toISOString(),
  };
}
