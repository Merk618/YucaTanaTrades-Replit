/**
 * Central risk threshold configuration.
 *
 * ALL risk limits live here — the Risk page and Settings page both read from
 * this object, so there is exactly one place to change a number.
 */
export const RISK_CONFIG = {
  /** Max % of total portfolio in any single non-crypto holding */
  singlePositionLimit: 15,

  /** Max % of total portfolio in any single crypto holding */
  cryptoPositionLimit: 10,

  /** Max % of total portfolio allocated to crypto as a whole sleeve */
  cryptoAllocationLimit: 20,

  /** Max % of total portfolio in any one sector (Tech + Semis combined here) */
  sectorConcentrationLimit: 40,

  /** Max drawdown from recent highs before alert fires (estimated metric) */
  maxDrawdownAlert: 15,
} as const;

export type RiskConfig = typeof RISK_CONFIG;
