import { Router, type IRouter } from "express";
import type { AuthRuntime } from "../auth/runtime";
import { createAuthRouter } from "./auth";
import healthRouter from "./health";
import journalRouter from "./journal";
import watchlistRouter from "./watchlist";
import botsRouter from "./bots";
import portfolioRouter from "./portfolio";
import positionsRouter from "./positions";
import marketRouter from "./market";
import settingsRouter from "./settings";

export function createApiRouter(runtime: AuthRuntime): IRouter {
  const router: IRouter = Router();
  const auth = runtime.middlewares;

  router.use(healthRouter);
  router.use(createAuthRouter(runtime));

  router.use(auth.requireTrustedOrigin);
  router.use(auth.loadPresentedSession);
  router.use(auth.requireAuthenticatedSession);
  router.use(auth.requireCsrf);

  // These legacy handlers currently operate on global rows or process-wide
  // provider credentials. They stay unavailable until a future ownership
  // migration also updates every handler to filter by the server-derived user.
  router.use("/journal", auth.ownershipMigrationRequired);
  router.use("/watchlist", auth.ownershipMigrationRequired);
  router.use("/positions", auth.ownershipMigrationRequired);
  router.use("/portfolio", auth.ownershipMigrationRequired);
  router.use("/settings", auth.ownershipMigrationRequired);

  router.use(journalRouter);
  router.use(watchlistRouter);
  router.use(botsRouter);
  router.use(portfolioRouter);
  router.use(positionsRouter);
  router.use(marketRouter);
  router.use(settingsRouter);

  return router;
}
