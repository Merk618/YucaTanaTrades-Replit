---
name: Market data trust rules
description: How YucaTanaTrades labels market data sources honestly; constraints that any future market-data work must respect.
---

# Market data trust architecture

The terminal must never present fake or simulated data as real/live.

**The rules (do not violate):**
- No fabricated/simulated prices and no random "ticking". Unfetchable quotes return
  `price=0 provider="none"` and are filtered out (`isQuoteUsable`), shown as honest
  empty/error states — never invented numbers.
- Equity/ETF quotes are REAL but delayed (~15min, Yahoo) → label "DELAYED", never "LIVE".
- Crypto is reference data (CoinGecko) → label "REFERENCE", never "LIVE".
- Never show "Connected" for a provider without a passing health probe. Keyed providers
  (MooMoo/OpenD, Polygon, Alpaca, FMP, Kraken, Coinbase, SEC EDGAR, AI) are future-ready
  stubs reported as missing/future-ready until real creds + health check exist.
- AI is NEVER a market-data source. AI Daily Briefing etc. carry a DEMO DATA badge.
- All bots are READ-ONLY — no live trade execution, ever.
- API keys stay server-side; the /health response exposes env var *names* only, never values.

**Why:** The product's value depends on users trusting that what's labeled real is real.
A single fake "LIVE" badge over simulated data destroys that trust.

**How to apply:** Any mock/sample/illustrative UI surface must carry a demo badge — never
let illustrative data read as real. Derive market-state labels from the real market-session
endpoint and per-quote source metadata, not hardcoded "OPEN"/"LIVE" strings. The forced
health probe (`?refresh=true`) bypasses the server-side health cache and should be wired only
to explicit user actions (e.g. a "Re-check" button), never to auto-refresh — forcing a probe
on every tick risks rate-limiting upstream providers (CoinGecko in particular).

**Codegen gotcha:** Generated React Query option objects require an explicit `queryKey` (pass
the matching generated query-key helper), or typecheck fails (TS2741). When a generated GET
hook needs new query params, add them to the OpenAPI spec and regenerate rather than
hand-rolling a fetch — keep the contract as the single source of truth.
