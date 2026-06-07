import { Router, type IRouter } from "express";

const router: IRouter = Router();

// TODO: Connect to live MooMoo/OpenD and CryptoHunter APIs for real status
router.get("/bots/status", (_req, res) => {
  const now = new Date();
  const fourMinAgo = new Date(now.getTime() - 4 * 60 * 1000).toISOString();
  const twelveMinAgo = new Date(now.getTime() - 12 * 60 * 1000).toISOString();

  res.json({
    moomoo: {
      name: "MooMoo Stock Trader Bot",
      status: "online",
      lastScan: fourMinAgo,
      scansToday: 47,
      isReadOnly: true,
      lastResult: "No signals — market conditions not optimal",
      health: "good",
    },
    cryptoHunter: {
      name: "Crypto Hunter Bot",
      status: "scanning",
      lastScan: twelveMinAgo,
      scansToday: 31,
      isReadOnly: true,
      lastResult: "BTC momentum building — monitoring for breakout confirmation",
      health: "good",
    },
  });
});

export default router;
