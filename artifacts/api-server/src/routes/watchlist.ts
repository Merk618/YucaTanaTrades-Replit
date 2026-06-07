import { Router, type IRouter } from "express";
import { db, watchlistTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { AddWatchlistItemBody, RemoveWatchlistItemParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/watchlist", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(watchlistTable)
      .orderBy(desc(watchlistTable.addedAt));

    const mapped = items.map((item) => ({
      id: item.id,
      ticker: item.ticker,
      sector: item.sector ?? null,
      notes: item.notes ?? null,
      priority: item.priority as "high" | "medium" | "low",
      addedAt: item.addedAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list watchlist items");
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

router.post("/watchlist", async (req, res) => {
  try {
    const body = AddWatchlistItemBody.parse(req.body);
    const [item] = await db
      .insert(watchlistTable)
      .values({
        ticker: body.ticker.toUpperCase(),
        sector: body.sector ?? null,
        notes: body.notes ?? null,
        priority: body.priority ?? "medium",
      })
      .returning();

    res.status(201).json({
      id: item.id,
      ticker: item.ticker,
      sector: item.sector ?? null,
      notes: item.notes ?? null,
      priority: item.priority as "high" | "medium" | "low",
      addedAt: item.addedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add watchlist item");
    res.status(400).json({ error: "Invalid watchlist item data" });
  }
});

router.delete("/watchlist/:id", async (req, res) => {
  try {
    const { id } = RemoveWatchlistItemParams.parse({ id: Number(req.params.id) });
    await db.delete(watchlistTable).where(eq(watchlistTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to remove watchlist item");
    res.status(500).json({ error: "Failed to remove watchlist item" });
  }
});

export default router;
