import type { ProviderDescriptor, ProviderHealth, ProviderStatusCode } from "./types";
import { PROVIDERS } from "./registry";
import { yahooHealthProbe } from "./providers/yahoo";
import { coinGeckoHealthProbe } from "./providers/coingecko";

// ─── Health checks ───────────────────────────────────────────────────────────
// Implemented no-key providers get a REAL network probe. Keyed providers report
// missing_api_key / future_ready based purely on env-var presence (we never log
// or expose the values). Gateway providers (OpenD) report not_connected when the
// host is unreachable/unconfigured. Results are cached briefly to avoid
// hammering the upstreams; a manual refresh bypasses the cache.

interface HealthRecord extends ProviderHealth {}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; record: HealthRecord }>();

function envConfigured(p: ProviderDescriptor): boolean {
  if (p.envVars.length === 0) return !p.requiresGateway; // gateway handled below
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

async function probe(p: ProviderDescriptor): Promise<{
  status: ProviderStatusCode;
  message: string;
  ok: boolean;
  latencyMs: number | null;
  detail: string | null;
}> {
  // Implemented, no-key, real network providers.
  if (p.implemented && !p.requiresKey && !p.requiresGateway) {
    const start = Date.now();
    try {
      if (p.id === "yahoo") await yahooHealthProbe();
      else if (p.id === "coingecko") await coinGeckoHealthProbe();
      const latencyMs = Date.now() - start;
      return {
        status: p.liveCapable ? "connected" : "delayed",
        message:
          p.id === "yahoo"
            ? "Delayed feed reachable (~15 min)."
            : "Reference feed reachable.",
        ok: true,
        latencyMs,
        detail: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status: ProviderStatusCode =
        msg === "rate_limited" ? "rate_limited" : "health_check_failed";
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

  // Gateway-based (MooMoo / OpenD) — needs a reachable local host.
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
          message:
            "Requires a reachable OpenD gateway (not available in cloud).",
          ok: false,
          latencyMs: null,
          detail: null,
        };
  }

  // Keyed providers.
  if (p.requiresKey) {
    const configured = envConfigured(p);
    return configured
      ? {
          status: "future_ready",
          message: "API key configured; live adapter not yet wired.",
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

  // No-key but not implemented (Kraken/Coinbase/SEC future-ready stubs).
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
    p.requiresGateway || p.requiresKey
      ? p.requiresGateway
        ? gatewayConfigured(p)
        : envConfigured(p)
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

export async function getProviderHealth(
  force = false,
): Promise<ProviderHealth[]> {
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

// Status for a single provider (used by router enrichment), from cache if fresh.
export async function getCachedProviderStatus(
  id: string,
): Promise<ProviderStatusCode | null> {
  const cached = cache.get(id);
  if (cached) return cached.record.status;
  const all = await getProviderHealth();
  return all.find((r) => r.id === id)?.status ?? null;
}
