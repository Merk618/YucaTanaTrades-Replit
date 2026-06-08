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

**How to apply:** Any mock/sample/illustrative UI surface (e.g. Sector Heatmap, sample bot
logs, hardcoded portfolio/bots JSON) must carry a `DemoBadge` (`components/demo-badge.tsx`).
Derive market-state labels from the real `/api/market/session` and per-quote source metadata
(`isDelayed`/`isLive`/`isStale`/`sourceLabel`), not hardcoded "OPEN"/"LIVE" strings. Reuse the
`use-market.ts` helpers (`useMarketQuotes`, `isQuoteUsable`, `formatPrice`, `quoteBadge`).
Generated React Query option objects require an explicit `queryKey` (pass the generated
`getGet*QueryKey(...)`), or typecheck fails (TS2741).
