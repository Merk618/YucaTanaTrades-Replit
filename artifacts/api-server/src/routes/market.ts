import { Router, type IRouter } from "express";
import { GetMarketQuotesQueryParams } from "@workspace/api-zod";
import { getQuotes } from "../services/market/router";
import { getProviderHealth } from "../services/market/health";
import { getMarketSession } from "../services/market/session";
import { quoteProvidersFor } from "../services/market/registry";
import type { AssetClass, ProviderHealth } from "../services/market/types";

const router: IRouter = Router();

const HEALTHY = new Set(["connected", "delayed", "read_only"]);

// GET /market/quotes?symbols=SPY,BTC,NVDA
router.get("/market/quotes", async (req, res) => {
  try {
    const { symbols } = GetMarketQuotesQueryParams.parse(req.query);
    const list = symbols
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      return res.status(400).json({ error: "No symbols provided" });
    }
    const quotes = await getQuotes(list, req.log);
    return res.json({ asOf: new Date().toISOString(), quotes });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch market quotes");
    return res.status(400).json({ error: "Invalid quote request" });
  }
});

// GET /market/health
router.get("/market/health", async (req, res) => {
  try {
    const force = req.query.refresh === "true" || req.query.force === "true";
    const providers = await getProviderHealth(force);
    const byId = new Map<string, ProviderHealth>(providers.map((p) => [p.id, p]));

    const ASSET_LABELS: Record<AssetClass, string> = {
      equity: "Equities",
      etf: "ETFs",
      crypto: "Crypto",
      fundamentals: "Fundamentals",
      ai: "AI Analysis",
    };

    const classes: AssetClass[] = ["equity", "etf", "crypto", "fundamentals"];
    const summary = classes.map((assetClass) => {
      const ranked = quoteProvidersFor(assetClass);
      const active = ranked.find((p) => {
        const h = byId.get(p.id);
        return h && p.implemented && HEALTHY.has(h.status);
      });
      // Fallback in use if a higher-priority provider exists but isn't the active one.
      const fallbackInUse =
        !!active && ranked.length > 0 && ranked[0]!.id !== active.id;
      const h = active ? byId.get(active.id) : undefined;
      return {
        assetClass,
        label: ASSET_LABELS[assetClass],
        activeProvider: active?.id ?? null,
        activeProviderLabel: active?.name ?? null,
        status: h?.status ?? "not_connected",
        fallbackInUse,
        sourceLabel: active?.sourceLabel ?? null,
      };
    });

    res.json({ asOf: new Date().toISOString(), providers, summary });
  } catch (err) {
    req.log.error({ err }, "Failed to compute source health");
    res.status(500).json({ error: "Failed to compute source health" });
  }
});

// GET /market/session
router.get("/market/session", (req, res) => {
  try {
    const session = getMarketSession();
    res.json({
      asOf: session.asOf,
      equities: {
        state: session.equities.state,
        isOpen: session.equities.isOpen,
        label: session.equities.label,
        timezone: session.equities.timezone,
        nextChange: session.equities.nextChange,
      },
      crypto: {
        state: session.crypto.state,
        isOpen: session.crypto.isOpen,
        label: session.crypto.label,
        nextChange: null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to compute market session");
    res.status(500).json({ error: "Failed to compute market session" });
  }
});

// GET /market/test — verify real sources with a small fetch (SPY + BTC).
router.get("/market/test", async (req, res) => {
  try {
    const quotes = await getQuotes(["SPY", "BTC"], req.log);
    res.json({ asOf: new Date().toISOString(), quotes });
  } catch (err) {
    req.log.error({ err }, "Test quote fetch failed");
    res.status(500).json({ error: "Test quote fetch failed" });
  }
});

export default router;
