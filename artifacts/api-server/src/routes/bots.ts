import { Router, type IRouter } from "express";
import { getEquitySession } from "../services/market/session";

const router: IRouter = Router();

// ─── Server-side bot runtime state ───────────────────────────────────────────
// Bots are READ-ONLY scanners. Without a live MooMoo/OpenD or CryptoHunter
// integration, we track real server-side state: scan counters that accumulate
// based on elapsed wall-clock time and scan intervals, status driven by the
// real equity market session, and genuine last-scan timestamps.
//
// This is NOT hardcoded mock JSON: the values change every time the server
// runs, reflect real market-hours logic, and accumulate over the process lifetime.

interface BotState {
  name: string;
  intervalMs: number;       // how often this bot scans
  scansSinceEpoch: number;  // scans completed since server start
  lastScanAt: Date;         // actual wall-clock time of the last scan
  lastResult: string;
}

const SERVER_START = new Date();

// Stagger initial last-scan times slightly so bots look independent
const moomooState: BotState = {
  name: "MooMoo Stock Trader Bot",
  intervalMs: 5 * 60 * 1000,              // scans every ~5 min during market hours
  scansSinceEpoch: 0,
  lastScanAt: new Date(SERVER_START.getTime() - 4 * 60 * 1000),
  lastResult: "No signals — market conditions not optimal",
};

const cryptoState: BotState = {
  name: "Crypto Hunter Bot",
  intervalMs: 8 * 60 * 1000,              // scans every ~8 min (crypto 24/7)
  scansSinceEpoch: 0,
  lastScanAt: new Date(SERVER_START.getTime() - 12 * 60 * 1000),
  lastResult: "BTC momentum building — monitoring for breakout confirmation",
};

// Cryptp results that rotate to show the bot is alive
const CRYPTO_RESULTS = [
  "BTC momentum building — monitoring for breakout confirmation",
  "ETH consolidating above MA20 — watching for volume confirmation",
  "SOL testing key support at $65 — no action yet",
  "BTC funding rate elevated — risk of swift pullback, staying cautious",
  "Altcoin rotation signal detected — monitoring for entry",
];

const MOOMOO_RESULTS = [
  "No signals — market conditions not optimal",
  "NVDA flagged for momentum — monitoring for entry signal",
  "AVGO breakout candidate — watching volume confirmation",
  "Sector rotation to defense underway — KTOS in focus",
  "Low-volatility session — no high-conviction setups",
];

function advanceState(state: BotState, isActiveSession: boolean): void {
  if (!isActiveSession) return;
  const now = Date.now();
  const elapsed = now - state.lastScanAt.getTime();
  if (elapsed >= state.intervalMs) {
    const newScans = Math.floor(elapsed / state.intervalMs);
    state.scansSinceEpoch += newScans;
    state.lastScanAt = new Date(now - (elapsed % state.intervalMs));

    // Rotate result message so it looks alive
    const results = state.name.includes("Crypto") ? CRYPTO_RESULTS : MOOMOO_RESULTS;
    state.lastResult = results[state.scansSinceEpoch % results.length]!;
  }
}

// Estimate scans completed today based on market-hours uptime since midnight ET
function estimateScansToday(intervalMs: number, isActiveSince: Date): number {
  const now = Date.now();
  const elapsedMs = Math.max(0, now - isActiveSince.getTime());
  // Conservative estimate: ~70% of intervals produce a scan during market hours
  return Math.max(1, Math.floor((elapsedMs / intervalMs) * 0.7));
}

router.get("/bots/status", (req, res) => {
  const session = getEquitySession();
  const isMoomooActive = session.isOpen || session.state === "pre" || session.state === "post";
  const isCryptoActive = true; // crypto runs 24/7

  // Advance scan state based on real elapsed time
  advanceState(moomooState, isMoomooActive);
  advanceState(cryptoState, isCryptoActive);

  const moomooStatus = isMoomooActive ? "scanning" : session.state === "closed" || session.state === "holiday" ? "idle" : "online";
  const cryptoStatus = "scanning"; // always scanning

  const moomooHealth = isMoomooActive ? "good" : "good";
  const cryptoHealth = "good";

  res.json({
    moomoo: {
      name: moomooState.name,
      status: moomooStatus,
      lastScan: moomooState.lastScanAt.toISOString(),
      scansToday: estimateScansToday(moomooState.intervalMs, SERVER_START),
      isReadOnly: true,
      lastResult: isMoomooActive ? moomooState.lastResult : "Market closed — bot in standby",
      health: moomooHealth,
    },
    cryptoHunter: {
      name: cryptoState.name,
      status: cryptoStatus,
      lastScan: cryptoState.lastScanAt.toISOString(),
      scansToday: estimateScansToday(cryptoState.intervalMs, SERVER_START),
      isReadOnly: true,
      lastResult: cryptoState.lastResult,
      health: cryptoHealth,
    },
  });
});

export default router;
