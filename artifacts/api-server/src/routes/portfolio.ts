import { Router, type IRouter } from "express";
import { db, positionsTable } from "@workspace/db";
import { getQuotes } from "../services/market/router";

const router: IRouter = Router();

router.get("/portfolio/summary", async (req, res) => {
  try {
    const rows = await db.select().from(positionsTable);

    if (rows.length === 0) {
      res.json({
        totalValue: 0,
        dayChange: 0,
        dayChangePct: 0,
        totalGain: 0,
        totalGainPct: 0,
        rothIra: 0,
        individual: 0,
        crypto: 0,
      });
      return;
    }

    const symbols = rows.map((r) => r.ticker);
    const quotes = await getQuotes(symbols, req.log);
    const priceMap = new Map(quotes.map((q) => [q.symbol, q]));

    let rothIra = 0;
    let individual = 0;
    let crypto = 0;
    let dayChange = 0;
    let totalGain = 0;
    let totalCost = 0;

    for (const pos of rows) {
      const shares = Number(pos.shares);
      const avgCost = Number(pos.avgCost);
      const q = priceMap.get(pos.ticker);
      const price = q && q.price > 0 ? q.price : null;
      if (price === null) continue;

      const value = price * shares;
      const posChange = (q?.change ?? 0) * shares;
      const cost = avgCost * shares;

      dayChange += posChange;
      totalGain += value - cost;
      totalCost += cost;

      if (pos.sleeve === "rothIra") rothIra += value;
      else if (pos.sleeve === "individual") individual += value;
      else if (pos.sleeve === "crypto") crypto += value;
    }

    const totalValue = rothIra + individual + crypto;
    const prevTotal = totalValue - dayChange;
    const dayChangePct = prevTotal > 0 ? (dayChange / prevTotal) * 100 : 0;
    const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    res.json({
      totalValue,
      dayChange,
      dayChangePct,
      totalGain,
      totalGainPct,
      rothIra,
      individual,
      crypto,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to compute portfolio summary");
    res.status(500).json({ error: "Failed to compute portfolio summary" });
  }
});

export default router;
