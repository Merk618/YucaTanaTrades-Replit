import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const positionsTable = pgTable("positions", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  shares: numeric("shares", { precision: 18, scale: 8 }).notNull(),
  avgCost: numeric("avg_cost", { precision: 18, scale: 4 }).notNull(),
  sleeve: text("sleeve").notNull().default("individual"),
  sector: text("sector").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPositionSchema = createInsertSchema(positionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positionsTable.$inferSelect;
