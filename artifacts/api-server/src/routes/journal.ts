import { Router, type IRouter } from "express";
import { db, journalEntriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateJournalEntryBody,
  UpdateJournalEntryBody,
  GetJournalEntryParams,
  UpdateJournalEntryParams,
  DeleteJournalEntryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/journal", async (req, res) => {
  try {
    const entries = await db
      .select()
      .from(journalEntriesTable)
      .orderBy(desc(journalEntriesTable.tradeDate));

    const mapped = entries.map((e) => ({
      id: e.id,
      ticker: e.ticker,
      setupType: e.setupType,
      side: e.side,
      entryPrice: Number(e.entryPrice),
      exitPrice: e.exitPrice != null ? Number(e.exitPrice) : null,
      pnl: e.pnl != null ? Number(e.pnl) : null,
      pnlPercent: e.pnlPercent != null ? Number(e.pnlPercent) : null,
      thesis: e.thesis,
      mistakes: e.mistakes ?? null,
      lessons: e.lessons ?? null,
      outcome: e.outcome,
      sector: e.sector ?? null,
      tags: e.tags ?? null,
      tradeDate: e.tradeDate,
      createdAt: e.createdAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list journal entries");
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

router.post("/journal", async (req, res) => {
  try {
    const body = CreateJournalEntryBody.parse(req.body);
    const [entry] = await db
      .insert(journalEntriesTable)
      .values({
        ticker: body.ticker,
        setupType: body.setupType,
        side: body.side,
        entryPrice: String(body.entryPrice),
        exitPrice: body.exitPrice != null ? String(body.exitPrice) : null,
        pnl: body.pnl != null ? String(body.pnl) : null,
        pnlPercent: body.pnlPercent != null ? String(body.pnlPercent) : null,
        thesis: body.thesis,
        mistakes: body.mistakes ?? null,
        lessons: body.lessons ?? null,
        outcome: body.outcome,
        sector: body.sector ?? null,
        tags: body.tags ?? null,
        tradeDate: body.tradeDate,
      })
      .returning();

    res.status(201).json({
      ...entry,
      entryPrice: Number(entry.entryPrice),
      exitPrice: entry.exitPrice != null ? Number(entry.exitPrice) : null,
      pnl: entry.pnl != null ? Number(entry.pnl) : null,
      pnlPercent: entry.pnlPercent != null ? Number(entry.pnlPercent) : null,
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create journal entry");
    res.status(400).json({ error: "Invalid journal entry data" });
  }
});

router.get("/journal/summary", async (req, res) => {
  try {
    const entries = await db.select().from(journalEntriesTable);

    const wins = entries.filter((e) => e.outcome === "win");
    const losses = entries.filter((e) => e.outcome === "loss");
    const breakevens = entries.filter((e) => e.outcome === "breakeven");
    const openTrades = entries.filter((e) => e.outcome === "open");
    const closed = entries.filter((e) => e.outcome !== "open");

    const totalPnl = entries.reduce(
      (sum, e) => sum + (e.pnl != null ? Number(e.pnl) : 0),
      0,
    );
    const avgWin =
      wins.length > 0
        ? wins.reduce((sum, e) => sum + (e.pnl != null ? Number(e.pnl) : 0), 0) / wins.length
        : 0;
    const avgLoss =
      losses.length > 0
        ? losses.reduce((sum, e) => sum + (e.pnl != null ? Number(e.pnl) : 0), 0) / losses.length
        : 0;

    res.json({
      totalTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      openTrades: openTrades.length,
      winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
      totalPnl,
      avgWin,
      avgLoss,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get journal summary");
    res.status(500).json({ error: "Failed to compute journal summary" });
  }
});

router.get("/journal/:id", async (req, res) => {
  try {
    const { id } = GetJournalEntryParams.parse({ id: Number(req.params.id) });
    const [entry] = await db
      .select()
      .from(journalEntriesTable)
      .where(eq(journalEntriesTable.id, id));

    if (!entry) return res.status(404).json({ error: "Not found" });

    res.json({
      ...entry,
      entryPrice: Number(entry.entryPrice),
      exitPrice: entry.exitPrice != null ? Number(entry.exitPrice) : null,
      pnl: entry.pnl != null ? Number(entry.pnl) : null,
      pnlPercent: entry.pnlPercent != null ? Number(entry.pnlPercent) : null,
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get journal entry");
    res.status(500).json({ error: "Failed to fetch journal entry" });
  }
});

router.patch("/journal/:id", async (req, res) => {
  try {
    const { id } = UpdateJournalEntryParams.parse({ id: Number(req.params.id) });
    const body = UpdateJournalEntryBody.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (body.ticker !== undefined) updateData.ticker = body.ticker;
    if (body.setupType !== undefined) updateData.setupType = body.setupType;
    if (body.side !== undefined) updateData.side = body.side;
    if (body.entryPrice !== undefined) updateData.entryPrice = String(body.entryPrice);
    if (body.exitPrice !== undefined) updateData.exitPrice = body.exitPrice != null ? String(body.exitPrice) : null;
    if (body.pnl !== undefined) updateData.pnl = body.pnl != null ? String(body.pnl) : null;
    if (body.pnlPercent !== undefined) updateData.pnlPercent = body.pnlPercent != null ? String(body.pnlPercent) : null;
    if (body.thesis !== undefined) updateData.thesis = body.thesis;
    if (body.mistakes !== undefined) updateData.mistakes = body.mistakes;
    if (body.lessons !== undefined) updateData.lessons = body.lessons;
    if (body.outcome !== undefined) updateData.outcome = body.outcome;
    if (body.sector !== undefined) updateData.sector = body.sector;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.tradeDate !== undefined) updateData.tradeDate = body.tradeDate;

    const [entry] = await db
      .update(journalEntriesTable)
      .set(updateData)
      .where(eq(journalEntriesTable.id, id))
      .returning();

    if (!entry) return res.status(404).json({ error: "Not found" });

    res.json({
      ...entry,
      entryPrice: Number(entry.entryPrice),
      exitPrice: entry.exitPrice != null ? Number(entry.exitPrice) : null,
      pnl: entry.pnl != null ? Number(entry.pnl) : null,
      pnlPercent: entry.pnlPercent != null ? Number(entry.pnlPercent) : null,
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update journal entry");
    res.status(400).json({ error: "Invalid update data" });
  }
});

router.delete("/journal/:id", async (req, res) => {
  try {
    const { id } = DeleteJournalEntryParams.parse({ id: Number(req.params.id) });
    await db.delete(journalEntriesTable).where(eq(journalEntriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete journal entry");
    res.status(500).json({ error: "Failed to delete journal entry" });
  }
});

export default router;
