# YucaTanaTrades

A premium AI-powered financial trading terminal web app with a gold/dark luxury aesthetic (Bloomberg + TradingView feel).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/yucatanatrades run dev` — run the frontend (port 20531)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, Framer Motion, Lucide React, wouter router
- Backend: Express 5, PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/`)
- Build: esbuild (CJS bundle)
- Forms: react-hook-form
- Charts: Recharts (available, not yet used)

## Where things live

- `artifacts/yucatanatrades/` — React+Vite frontend, preview path `/`
- `artifacts/api-server/` — Express API server, path prefix `/api`
- `lib/db/src/schema/` — Drizzle schema (journal_entries, watchlist tables)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `artifacts/yucatanatrades/src/data/mockData.ts` — Mock market/scanner/bot data
- `artifacts/yucatanatrades/src/pages/` — All 9 page components
- `artifacts/yucatanatrades/src/components/` — AppShell, TickerTape, AnimatedBackground

## Architecture decisions

- All bots operate READ-ONLY — no live trade execution ever
- OpenAPI contract-first: spec → codegen → hooks in frontend, Zod validation in backend
- Dark-only theme: deep navy background (220 20% 4%), gold primary (43 63% 52%), emerald accent (160 100% 39%)
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (prices/tickers)
- `glass-card` CSS utility class: backdrop-blur, card/80 bg, gold gradient overlay
- Google Fonts `@import` must be FIRST line of index.css (before `@import "tailwindcss"`)

## Product

9-page trading terminal:
1. **Command Center** — Portfolio totals, index overview, AI daily briefing, top opportunities, news/catalysts, bot status
2. **Markets** — Sector heatmap, gainers/losers, tabbed price grid across stocks/crypto/ETFs
3. **Scanners** — 6 scanner tabs (Momentum, Breakouts, Dip-Buy, Oversold, Options, Unusual Volume), sortable signal tables
4. **Research** — AI chat terminal (GPT-4o style), research reports library, quick-analysis presets
5. **Portfolio** — Three-sleeve breakdown (Roth IRA, Individual, Crypto), full holdings table with gain tracking
6. **Bots** — Bot status cards (READ-ONLY mode), observation ledger, activity logs
7. **Journal** — Trade log with full CRUD (POST to real API), tabs by outcome, lessons panel
8. **Risk** — Overall risk score, metric cards, alerts, position sizing vs limits
9. **Settings** — API connections status, notification toggles, risk threshold display

## Live API endpoints (all under /api)

- `GET/POST /api/journal` — journal CRUD with real PostgreSQL
- `GET /api/journal/summary` — win rate, total P&L, counts
- `GET/POST/DELETE /api/watchlist` — watchlist items
- `GET /api/bots/status` — bot status (mock)
- `GET /api/portfolio/summary` — portfolio totals (mock)

## User preferences

- READ-ONLY mode for all bots — no live execution
- Premium luxury aesthetic: Bloomberg + TradingView feel
- Gold (#C4A44A) primary color throughout
- JetBrains Mono for all prices and ticker symbols

## Gotchas

- Google Fonts must be the FIRST `@import` in `index.css` or fonts won't load
- `glass-card` utility is defined in `@layer utilities` in `index.css`
- The Vite dev server needs `server.allowedHosts: true` for Replit proxy to work
- Proxy routes by path: frontend at `/`, API at `/api`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- DB seeds are in `artifacts/api-server/src/seed.ts` (10 journal entries, 15 watchlist items)
