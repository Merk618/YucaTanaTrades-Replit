import { Router } from "express";

const router = Router();

// Runtime credential store — persists for the lifetime of this server process.
// TODO: Persist to the `api_credentials` table in PostgreSQL so keys survive server restarts.
//       For now, add them as Replit Secrets (using the env var name below) for durable storage.
const runtimeStore = new Map<string, string>();

// POST /api/settings/credentials
// Body: { credentials: Record<string, string> }
// Saves one or more env vars into process.env (runtime only) so provider adapters pick them up.
// Keys are validated against a safe allowlist pattern before being set.
// Values are never returned to callers — only a count of saved entries is returned.
router.post("/settings/credentials", (req, res) => {
  const body = req.body as { credentials?: unknown };
  if (
    !body.credentials ||
    typeof body.credentials !== "object" ||
    Array.isArray(body.credentials)
  ) {
    res.status(400).json({ error: "credentials must be a non-array object" });
    return;
  }

  const credentials = body.credentials as Record<string, unknown>;
  let saved = 0;

  for (const [key, value] of Object.entries(credentials)) {
    // Only allow safe identifier patterns (uppercase letters, digits, underscores, 3–80 chars)
    if (!/^[A-Z][A-Z0-9_]{2,79}$/.test(key)) continue;
    if (typeof value !== "string" || !value.trim()) continue;
    const clean = value.trim();
    process.env[key] = clean;
    runtimeStore.set(key, clean);
    saved++;
  }

  res.json({ saved, message: saved > 0 ? "Credentials stored for this session" : "No valid credentials provided" });
});

// DELETE /api/settings/credentials
// Body: { envVars: string[] }
// Removes named env vars from process.env and the runtime store.
router.delete("/settings/credentials", (req, res) => {
  const body = req.body as { envVars?: unknown };
  if (!Array.isArray(body.envVars)) {
    res.status(400).json({ error: "envVars must be an array" });
    return;
  }

  let removed = 0;
  for (const key of body.envVars as unknown[]) {
    if (typeof key !== "string") continue;
    delete process.env[key];
    runtimeStore.delete(key);
    removed++;
  }

  res.json({ removed });
});

// GET /api/settings/credentials/status
// Returns which known provider env vars are set — never returns the actual values.
// Indicates whether the value came from the environment (durable) or runtime store (session-only).
router.get("/settings/credentials/status", (_req, res) => {
  const KNOWN_VARS = [
    "POLYGON_API_KEY",
    "ALPACA_API_KEY",
    "ALPACA_SECRET_KEY",
    "FMP_API_KEY",
    "OPENAI_API_KEY",
  ] as const;

  const status: Record<
    string,
    { set: boolean; source: "env" | "runtime" | null; maskedSuffix: string | null }
  > = {};

  for (const v of KNOWN_VARS) {
    const envVal = process.env[v]?.trim() ?? "";
    const runVal = runtimeStore.get(v) ?? "";
    const val = envVal || runVal;
    if (val) {
      status[v] = {
        set: true,
        maskedSuffix: val.slice(-4),
        source: envVal ? "env" : "runtime",
      };
    } else {
      status[v] = { set: false, maskedSuffix: null, source: null };
    }
  }

  res.json({ status });
});

export default router;
