import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  setupType: text("setup_type").notNull(),
  side: text("side").notNull().default("long"),
  entryPrice: numeric("entry_price", { precision: 12, scale: 4 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 12, scale: 4 }),
  pnl: numeric("pnl", { precision: 12, scale: 4 }),
  pnlPercent: numeric("pnl_percent", { precision: 8, scale: 4 }),
  thesis: text("thesis").notNull(),
  mistakes: text("mistakes"),
  lessons: text("lessons"),
  outcome: text("outcome").notNull().default("open"),
  sector: text("sector"),
  tags: text("tags"),
  tradeDate: date("trade_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;
