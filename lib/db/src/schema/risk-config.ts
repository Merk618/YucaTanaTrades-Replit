import { pgTable, integer, timestamp } from "drizzle-orm/pg-core";

export const riskConfigTable = pgTable("risk_config", {
  id: integer("id").primaryKey().default(1),
  singlePositionLimit: integer("single_position_limit").notNull().default(15),
  cryptoPositionLimit: integer("crypto_position_limit").notNull().default(10),
  cryptoAllocationLimit: integer("crypto_allocation_limit").notNull().default(20),
  sectorConcentrationLimit: integer("sector_concentration_limit").notNull().default(40),
  maxDrawdownAlert: integer("max_drawdown_alert").notNull().default(15),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type RiskConfigRow = typeof riskConfigTable.$inferSelect;
