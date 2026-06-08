import { Router, type IRouter } from "express";
import { getQuotes } from "../services/market/router";

const router: IRouter = Router();

interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  sleeve: "rothIra" | "individual" | "crypto";
}

const POSITIONS: Position[] = [
  { ticker: "NVDA", shares: 12,   avgCost: 650.00,   sleeve: "rothIra" },
  { ticker: "AVGO", shares: 5,    avgCost: 1100.00,  sleeve: "rothIra" },
  { ticker: "ASTS", shares: 200,  avgCost: 10.50,    sleeve: "rothIra" },
  { ticker: "MSFT", shares: 18,   avgCost: 340.00,   sleeve: "individual" },
  { ticker: "SMR",  shares: 400,  avgCost: 5.50,     sleeve: "individual" },
  { ticker: "KTOS", shares: 150,  avgCost: 18.00,    sleeve: "individual" },
  { ticker: "BTC",  shares: 0.28, avgCost: 42000.00, sleeve: "crypto" },
  { ticker: "ETH",  shares: 2.1,  avgCost: 2100.00,  sleeve: "crypto" },
  { ticker: "SOL",  shares: 8.5,  avgCost: 100.00,   sleeve: "crypto" },
];

router.get("/portfolio/summary", async (req, res) => {
  try {
    const symbols = POSITIONS.map((p) => p.ticker);
    const quotes = await getQuotes(symbols, req.log);
    const priceMap = new Map(quotes.map((q) => [q.symbol, q]));

    let rothIra = 0;
    let individual = 0;
    let crypto = 0;
    let dayChange = 0;
    let totalGain = 0;
    let totalCost = 0;

    for (const pos of POSITIONS) {
      const q = priceMap.get(pos.ticker);
      const price = q && q.price > 0 ? q.price : null;
      if (price === null) continue;

      const value = price * pos.shares;
      const posChange = (q?.change ?? 0) * pos.shares;
      const cost = pos.avgCost * pos.shares;

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
