import type { ProviderDescriptor, ProviderHealth, ProviderStatusCode } from "./types";
import { PROVIDERS } from "./registry";
import { yahooHealthProbe } from "./providers/yahoo";
import { coinGeckoHealthProbe } from "./providers/coingecko";
import { krakenHealthProbe } from "./providers/kraken";
import { coinbaseHealthProbe } from "./providers/coinbase";
import { polygonHealthProbe } from "./providers/polygon";
import { alpacaHealthProbe } from "./providers/alpaca";
import { fmpHealthProbe } from "./providers/fmp";

// ─── Health checks ───────────────────────────────────────────────────────────
// Every implemented provider gets a real network probe when checked.
// Keyed providers only probe if the required env vars are present; otherwise
// they report missing_api_key immediately.
// Results are cached to avoid hammering upstreams; manual refresh bypasses cache.
// API key values are NEVER logged or returned to callers — only env var names.

interface HealthRecord extends ProviderHealth {}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; record: HealthRecord }>();

function envConfigured(p: ProviderDescriptor): boolean {
  if (p.envVars.length === 0) return !p.requiresGateway;
  return p.envVars.every((v) => {
    const val = process.env[v];
    return typeof val === "string" && val.trim().length > 0;
  });
}

function gatewayConfigured(p: ProviderDescriptor): boolean {
  return p.envVars.every((v) => {
    const val = process.env[v];
    return typeof val === "string" && val.trim().length > 0;
  });
}

// Map a probe error to an honest status code.
function errorToStatus(msg: string): ProviderStatusCode {
  if (msg === "rate_limited") return "rate_limited";
  if (msg === "auth_failed" || msg.includes("auth_failed")) return "auth_failed";
  if (msg.includes("missing_api_key") || msg.includes("missing_credentials")) return "missing_api_key";
  return "health_check_failed";
}

// Real-network probe dispatchers, keyed by provider id.
// Each throws on failure with a machine-readable error string.
const NO_KEY_PROBES: Record<string, () => Promise<void>> = {
  yahoo:     yahooHealthProbe,
  coingecko: coinGeckoHealthProbe,
  kraken:    krakenHealthProbe,
  coinbase:  coinbaseHealthProbe,
};

const KEYED_PROBES: Record<string, () => Promise<void>> = {
  polygon: polygonHealthProbe,
  alpaca:  alpacaHealthProbe,
  fmp:     fmpHealthProbe,
};

async function probe(p: ProviderDescriptor): Promise<{
  status: ProviderStatusCode;
  message: string;
  ok: boolean;
  latencyMs: number | null;
  detail: string | null;
}> {
  // ── Gateway-based: requires local reachable infra ────────────────────────────
  if (p.requiresGateway) {
    const configured = gatewayConfigured(p);
    return configured
      ? {
          status: "future_ready",
          message: "Gateway host configured; live adapter not yet wired.",
          ok: false,
          latencyMs: null,
          detail: null,
        }
      : {
          status: "not_connected",
          message: "Requires a reachable OpenD gateway (not available in cloud).",
          ok: false,
          latencyMs: null,
          detail: null,
        };
  }

  // ── Implemented, no key required: real network probe ─────────────────────────
  if (p.implemented && !p.requiresKey) {
    const probeFn = NO_KEY_PROBES[p.id];
    if (!probeFn) {
      return { status: "future_ready", message: "Adapter implemented; probe not yet wired.", ok: false, latencyMs: null, detail: null };
    }
    const start = Date.now();
    try {
      await probeFn();
      const latencyMs = Date.now() - start;
      const status: ProviderStatusCode = p.liveCapable ? "connected" : "delayed";
      const message =
        p.id === "yahoo"   ? "Delayed feed reachable (~15 min)." :
        p.id === "kraken"  ? "Live exchange ticker reachable." :
        p.id === "coinbase"? "Live exchange stats reachable." :
        "Reference feed reachable.";
      return { status, message, ok: true, latencyMs, detail: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = errorToStatus(msg);
      return {
        status,
        message:
          status === "rate_limited"
            ? "Upstream rate limit hit; will retry."
            : "Health check failed — feed unreachable.",
        ok: false,
        latencyMs: Date.now() - start,
        detail: msg,
      };
    }
  }

  // ── Implemented, key required: check key presence, then real probe ────────────
  if (p.implemented && p.requiresKey) {
    if (!envConfigured(p)) {
      return {
        status: "missing_api_key",
        message: `Add ${p.envVars.join(", ")} to Replit Secrets to enable.`,
        ok: false,
        latencyMs: null,
        detail: null,
      };
    }
    const probeFn = KEYED_PROBES[p.id];
    if (!probeFn) {
      return {
        status: "future_ready",
        message: "API key configured; live adapter not yet wired.",
        ok: false,
        latencyMs: null,
        detail: null,
      };
    }
    const start = Date.now();
    try {
      await probeFn();
      const latencyMs = Date.now() - start;
      const status: ProviderStatusCode = p.liveCapable ? "connected" : "delayed";
      return {
        status,
        message: `${p.name} reachable${p.isDelayed ? " (delayed feed)" : ""}.`,
        ok: true,
        latencyMs,
        detail: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = errorToStatus(msg);
      const humanMsg =
        status === "auth_failed"    ? `Authentication failed — check ${p.envVars.join(", ")}.` :
        status === "rate_limited"   ? "Rate limited — will retry." :
        status === "missing_api_key"? `Add ${p.envVars.join(", ")} to Replit Secrets.` :
        "Health check failed — provider unreachable.";
      return { status, message: humanMsg, ok: false, latencyMs: Date.now() - start, detail: msg };
    }
  }

  // ── Not implemented / pure future-ready stubs ─────────────────────────────────
  if (p.requiresKey) {
    const configured = envConfigured(p);
    return configured
      ? {
          status: "future_ready",
          message: "API key configured; adapter not yet wired.",
          ok: false,
          latencyMs: null,
          detail: null,
        }
      : {
          status: "missing_api_key",
          message: `Add ${p.envVars.join(", ")} to enable.`,
          ok: false,
          latencyMs: null,
          detail: null,
        };
  }

  return {
    status: "future_ready",
    message: "Public feed available; adapter not yet wired.",
    ok: false,
    latencyMs: null,
    detail: null,
  };
}

async function checkProvider(
  p: ProviderDescriptor,
  prev: HealthRecord | undefined,
): Promise<HealthRecord> {
  const result = await probe(p);
  const now = new Date().toISOString();
  const configured =
    p.requiresGateway
      ? gatewayConfigured(p)
      : p.requiresKey
        ? envConfigured(p)
        : true;
  return {
    id: p.id,
    name: p.name,
    status: result.status,
    assetClasses: p.assetClasses,
    capabilities: p.capabilities,
    configured,
    readOnly: p.readOnly,
    isTradingCapable: p.isTradingCapable,
    liveCapable: p.liveCapable,
    envVars: p.envVars,
    sourceLabel: p.sourceLabel,
    message: result.message,
    lastCheckedAt: now,
    lastSuccessAt: result.ok ? now : (prev?.lastSuccessAt ?? null),
    latencyMs: result.latencyMs,
    detail: result.detail,
  };
}

export async function getProviderHealth(force = false): Promise<ProviderHealth[]> {
  const out: ProviderHealth[] = [];
  await Promise.all(
    PROVIDERS.map(async (p) => {
      const cached = cache.get(p.id);
      if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
        out.push(cached.record);
        return;
      }
      const record = await checkProvider(p, cached?.record);
      cache.set(p.id, { at: Date.now(), record });
      out.push(record);
    }),
  );
  // Preserve registry order for stable UI.
  const order = new Map(PROVIDERS.map((p, i) => [p.id, i]));
  out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return out;
}

// Status for a single provider (from cache if fresh), used by router enrichment.
export async function getCachedProviderStatus(id: string): Promise<ProviderStatusCode | null> {
  const cached = cache.get(id);
  if (cached) return cached.record.status;
  const all = await getProviderHealth();
  return all.find((r) => r.id === id)?.status ?? null;
}
