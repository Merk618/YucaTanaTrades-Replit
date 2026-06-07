import { Router, type IRouter } from "express";

const router: IRouter = Router();

// TODO: Connect to MooMoo/OpenD API, Kraken, Coinbase for live portfolio data
router.get("/portfolio/summary", (_req, res) => {
  res.json({
    totalValue: 220847.32,
    dayChange: 3241.88,
    dayChangePct: 1.49,
    totalGain: 42183.44,
    totalGainPct: 23.6,
    rothIra: 125340.0,
    individual: 67208.0,
    crypto: 28299.32,
  });
});

export default router;
