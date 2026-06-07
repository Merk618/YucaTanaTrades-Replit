import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  sector: text("sector"),
  notes: text("notes"),
  priority: text("priority").notNull().default("medium"),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistTable).omit({
  id: true,
  addedAt: true,
});
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type WatchlistItem = typeof watchlistTable.$inferSelect;
