import { Router, type IRouter } from "express";
import {
  GetMarketQuotesQueryParams,
  GetSourceHealthQueryParams,
  GetSourceHealthResponse,
  GetMarketSessionResponse,
} from "@workspace/api-zod";
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
    // Validate & coerce query params (refresh is a boolean flag).
    const { refresh: force } = GetSourceHealthQueryParams.parse(req.query);
    const providers = await getProviderHealth(!!force);
    const byId = new Map<string, ProviderHealth>(providers.map((p) => [p.id, p]));

    const ASSET_LABELS: Record<AssetClass, string> = {
      equity: "Equities",
      etf: "ETFs",
      crypto: "Crypto",
      fundamentals: "Fundamentals",
      ai: "AI Analysis",
    };

    const PRICE_CLASSES: AssetClass[] = ["equity", "etf", "crypto", "fundamentals"];

    const priceSummary = PRICE_CLASSES.map((assetClass) => {
      const ranked = quoteProvidersFor(assetClass);
      const active = ranked.find((p) => {
        const h = byId.get(p.id);
        return h && p.implemented && HEALTHY.has(h.status);
      });
      // Fallback is in use only when the active provider is not the highest-priority
      // *implemented* provider for this asset class. Future-ready stubs (not implemented)
      // are not counted as a "primary" — they cannot serve data yet.
      const primaryImplemented = ranked.find((p) => p.implemented);
      const fallbackInUse =
        !!active && !!primaryImplemented && active.id !== primaryImplemented.id;
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

    // AI is analysis-only and must never appear as a price source.
    // Represent it explicitly so Settings can show it with the correct label.
    const aiSummary = {
      assetClass: "ai" as AssetClass,
      label: ASSET_LABELS.ai,
      activeProvider: null,
      activeProviderLabel: null,
      status: "analysis_only",
      fallbackInUse: false,
      sourceLabel: "Analysis only — never a price source",
    };

    const summary = [...priceSummary, aiSummary];

    const payload = GetSourceHealthResponse.parse({
      asOf: new Date().toISOString(),
      providers,
      summary,
    });
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to compute source health");
    res.status(500).json({ error: "Failed to compute source health" });
  }
});

// GET /market/session
router.get("/market/session", (req, res) => {
  try {
    const session = getMarketSession();
    const payload = GetMarketSessionResponse.parse({
      asOf: session.asOf,
      equities: {
        state: session.equities.state,
        isOpen: session.equities.isOpen,
        label: session.equities.label,
        timezone: session.equities.timezone,
        nextChange: session.equities.nextChange ?? null,
      },
      crypto: {
        state: session.crypto.state,
        isOpen: session.crypto.isOpen,
        label: session.crypto.label,
        // Crypto is 24/7 globally — timezone is not applicable.
        nextChange: null,
      },
    });
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "Failed to compute market session");
    res.status(500).json({ error: "Failed to compute market session" });
  }
});

// GET /market/test — verify all implemented sources across equity + crypto symbols.
router.get("/market/test", async (req, res) => {
  try {
    const symbols = ["SPY", "QQQ", "NVDA", "MSFT", "BTC", "ETH", "SOL", "SUI"];
    const quotes = await getQuotes(symbols, req.log);
    res.json({ asOf: new Date().toISOString(), quotes });
  } catch (err) {
    req.log.error({ err }, "Test quote fetch failed");
    res.status(500).json({ error: "Test quote fetch failed" });
  }
});

export default router;
