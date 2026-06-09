import { Router, type IRouter } from "express";
import { db, positionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  CreatePositionBody,
  UpdatePositionBody,
  GetPositionParams,
  UpdatePositionParams,
  DeletePositionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapRow(row: typeof positionsTable.$inferSelect) {
  return {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    shares: Number(row.shares),
    avgCost: Number(row.avgCost),
    sleeve: row.sleeve as "rothIra" | "individual" | "crypto",
    sector: row.sector,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/positions", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(positionsTable)
      .orderBy(asc(positionsTable.id));
    res.json(rows.map(mapRow));
  } catch (err) {
    req.log.error({ err }, "Failed to list positions");
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

router.post("/positions", async (req, res) => {
  try {
    const body = CreatePositionBody.parse(req.body);
    const [row] = await db
      .insert(positionsTable)
      .values({
        ticker: body.ticker.toUpperCase(),
        name: body.name,
        shares: String(body.shares),
        avgCost: String(body.avgCost),
        sleeve: body.sleeve,
        sector: body.sector,
      })
      .returning();
    res.status(201).json(mapRow(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create position");
    res.status(400).json({ error: "Invalid position data" });
  }
});

router.get("/positions/:id", async (req, res) => {
  try {
    const { id } = GetPositionParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Position not found" });
      return;
    }
    res.json(mapRow(row));
  } catch (err) {
    req.log.error({ err }, "Failed to get position");
    res.status(500).json({ error: "Failed to fetch position" });
  }
});

router.patch("/positions/:id", async (req, res) => {
  try {
    const { id } = UpdatePositionParams.parse({ id: Number(req.params.id) });
    const body = UpdatePositionBody.parse(req.body);

    const updateValues: Partial<typeof positionsTable.$inferInsert> = {};
    if (body.ticker !== undefined) updateValues.ticker = body.ticker.toUpperCase();
    if (body.name !== undefined) updateValues.name = body.name;
    if (body.shares !== undefined) updateValues.shares = String(body.shares);
    if (body.avgCost !== undefined) updateValues.avgCost = String(body.avgCost);
    if (body.sleeve !== undefined) updateValues.sleeve = body.sleeve;
    if (body.sector !== undefined) updateValues.sector = body.sector;

    const [row] = await db
      .update(positionsTable)
      .set(updateValues)
      .where(eq(positionsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Position not found" });
      return;
    }
    res.json(mapRow(row));
  } catch (err) {
    req.log.error({ err }, "Failed to update position");
    res.status(400).json({ error: "Invalid position data" });
  }
});

router.delete("/positions/:id", async (req, res) => {
  try {
    const { id } = DeletePositionParams.parse({ id: Number(req.params.id) });
    await db.delete(positionsTable).where(eq(positionsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete position");
    res.status(500).json({ error: "Failed to delete position" });
  }
});

export default router;
