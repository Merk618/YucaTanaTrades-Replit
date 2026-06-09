import { Router, type IRouter } from "express";
import healthRouter from "./health";
import journalRouter from "./journal";
import watchlistRouter from "./watchlist";
import botsRouter from "./bots";
import portfolioRouter from "./portfolio";
import positionsRouter from "./positions";
import marketRouter from "./market";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(journalRouter);
router.use(watchlistRouter);
router.use(botsRouter);
router.use(portfolioRouter);
router.use(positionsRouter);
router.use(marketRouter);
router.use(settingsRouter);

export default router;
