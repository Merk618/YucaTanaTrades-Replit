import type { PortfolioPosition, PortfolioPositionSleeve } from "@workspace/api-client-react";

export type { PortfolioPosition, PortfolioPositionSleeve };

export const SLEEVE_LABELS: Record<PortfolioPositionSleeve, string> = {
  rothIra: "Roth IRA",
  individual: "Individual",
  crypto: "Crypto",
};

export function sleeveLabel(sleeve: PortfolioPositionSleeve): string {
  return SLEEVE_LABELS[sleeve] ?? sleeve;
}
