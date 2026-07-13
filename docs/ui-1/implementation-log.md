# YucaTanaTrades UI-1 implementation log

Status: visually approved on 2026-07-12. UI-1 geometry and motion are frozen at this handoff.

## Canonical base

- Repository: C:\Users\brock\Documents\Alt YucaTanaTrades\YucaTanaTrades-Replit
- Remote: https://github.com/merk618/YucaTanaTrades-Replit.git
- Verified base commit: 3899ebfc4a1315c1b978eed35f50c238cddd0efc
- Base description: Fix GitHub Pages TypeScript build
- Exact base tag: none
- Initial branch: main (one local commit ahead of origin/main)
- UI branch: codex/ui-1-final-desktop
- Initial nested-repository working tree: clean
- Outer Alt YucaTanaTrades scratch app: noncanonical and untouched

The Replit provenance is established by the remote, .replit, replit.md, pnpm workspace structure, and canonical API/frontend artifacts. No repository tag literally named Phase 0.1 exists.

## Authoritative visual reference

- File: [desktop-reference.png](./desktop-reference.png)
- Dimensions: 1536 × 1024
- Size: 1,896,644 bytes
- SHA-256: 07D7CB110A4E6C98AE933A4CFE2F513BA649448097D21599530A6D256F098480

## Component classification

| Existing area | Source | Decision | UI-1 treatment |
| --- | --- | --- | --- |
| App router | artifacts/yucatanatrades/src/App.tsx | ADAPT | Preserve Wouter, React Query, and canonical routes; remove rejected global ticker/background layers and add UI-1 routes. |
| Wide desktop shell | components/app-shell.tsx | RECREATE | Rewrite as a 58px icon rail, horizontal navigation, honest utilities, command palette, and persistent route-motion shell. |
| Dashboard | pages/home.tsx | RECREATE | Replace equal-card composition with the reference geometry and dense analytical hierarchy. |
| Ticker tape | components/ticker-tape.tsx | REJECT | Do not mount; replace with a fixed, non-scrolling, visibly labeled Demo strip. |
| Global animated background | components/animated-background.tsx | ADAPT concept only | Recreate as a replaceable, bounded AtmosphericHero layer. No code copied. |
| Global particle field | components/particle-field.tsx | REJECT | Sparse static points live only in the bounded hero; no global particle loop. |
| Demo badge | components/demo-badge.tsx | ADAPT concept only | Generalize into a typed truth-state badge in a new UI-1 component. |
| Count-up hook | hooks/use-count-up.ts | KEEP | Reuse only for explicitly labeled Demo portfolio entrance; it honors reduced motion. |
| Spotlight/scroll-reveal hooks | existing hooks | KEEP available | No required changes; UI-1 motion is centralized in lib/motion.ts. |
| Market/provider hooks | hooks/use-market.ts | KEEP untouched | Reserved for later integration; UI-1 never silently falls back to fixtures. |
| Existing feature routes | pages/*.tsx | KEEP | Preserve canonical functionality; only shell presentation changes around them. |

## ADAPT / PORT register

No donor repository code is ported in UI-1.

| Decision | Source project/path | Destination | Existing dependencies | Portability risk | Canonical implication | Method |
| --- | --- | --- | --- | --- | --- | --- |
| ADAPT | Replit src/App.tsx | same path | React, Wouter, React Query, Framer Motion | Existing feature routes use older page styling | Router architecture remains canonical | Hand rewrite |
| RECREATE | Replit components/app-shell.tsx | same path | React, Wouter, Framer Motion, Lucide | Responsive chrome must not break deep routes | Persistent shell and route model preserved | Hand rewrite; no donor code |
| RECREATE | Replit pages/home.tsx | same path plus focused UI-1 components | Existing frontend stack | Dense geometry at 1024/768 widths | Data arrives through provider-neutral contracts | Hand rewrite; no donor code |
| ADAPT concept | Replit animated-background.tsx | components/ui1/atmospheric-hero.tsx | React, Framer Motion, SVG/CSS | Ambient effects can compete with readability | Visual layer remains replaceable for later globe | New code; no copy |
| ADAPT concept | Replit demo-badge.tsx | components/ui1/truth-badge.tsx | React | State labels must remain consistent | Truth state becomes contract-driven | New code; no copy |

## Authorized file plan

Created in the frontend:

- src/contracts/dashboard.ts
- src/data/ui1-demo.ts
- src/lib/motion.ts
- src/components/ui1/truth-badge.tsx
- src/components/ui1/market-strip.tsx
- src/components/ui1/atmospheric-hero.tsx
- src/components/ui1/portfolio-band.tsx
- src/components/ui1/market-chart.tsx
- src/components/ui1/intelligence-rail.tsx
- src/components/ui1/supporting-analytics.tsx
- src/pages/preview-route.tsx
- src/ui1.css
- src/ui1-dashboard.css
- src/ui1-panels.css

Modified:

- src/App.tsx
- src/components/app-shell.tsx
- src/pages/home.tsx
- src/main.tsx

Documentation and capture artifacts live under docs/ui-1/.

## Untouched boundary

The following must remain untouched in UI-1:

- artifacts/api-server/**
- lib/db/**
- lib/api-spec/**
- generated API clients and schemas
- provider services and routing
- database schema and migrations
- .replit, deployment, and workflow configuration
- package manifests and every lockfile
- the outer scratch app
- donor repositories and donor backends

## Geometry

Reference desktop:

- Rail: 58px
- Rail-to-workspace gap: 35px at 1536
- Top chrome: 60px
- Market strip: 65px
- Main columns: fluid primary workspace + 345px intelligence rail
- Main column gap: 20px
- Hero: 258px
- Portfolio band: 84px
- Dashboard chart: 258px
- Supporting analytics: 187px
- Intelligence rail: 183px + 186px + 134px + 172px + compact status

Breakpoints:

- 1360px and above: full reference proportions
- 1180–1359px: compact two-column desktop; intelligence rail 310px
- 900–1179px: rail retained; intelligence modules become a two-column band below the primary workspace
- 768–899px: 54px tablet rail, compressed/scrollable top navigation, user-scrolled market strip, full-width chart
- below 768px: mobile product redesign remains deferred; UI-1 preserves tablet geometry

## Truth-state behavior

Every data contract owns dataState and provenance. Supported states are live, delayed, historical, demo, simulated, ai-generated, and unavailable.

UI-1 fixtures are deterministic and visibly labeled. Provider failure is represented by an unavailable contract and never replaced with Demo values. Calendar, news, AI provider, account, and live provider states are explicitly unavailable or deferred. No streaming, provider health, authentication, or production AI claim is made.

## Motion system

Central tokens cover durations, easing, springs, stagger, panel reveal, and route transitions. Components use shared spring active indicators, a brief coordinated entrance, bounded hero parallax, a spatial command palette, explicitly labeled Demo portfolio interpolation, chart interactions, selected-row continuity, gauge interpolation, and persistent-shell route transitions.

prefers-reduced-motion removes parallax, orbit/dash motion, spring travel, count-up rolling, and large entrance movement while retaining short opacity feedback and all functions. Ambient CSS animations pause while the document is hidden.

## Performance budget

- Hero: no more than three active visual layers; transform/opacity only; no full-screen animated blur
- Chart: deterministic static arrays; pointer updates are requestAnimationFrame-throttled; no streaming timer
- Glass: blur limited to bounded hero/search/rail surfaces
- Route transitions: shell remains mounted; only content opacity/transform changes
- Search: keyboard event and focused input remain independent of ambient animation
- Tab hidden: ambient motion paused via visibilitychange
- Target: modern desktop 60fps, with reduced tablet amplitude and static fallback

## Dependency and integration status

- Dependency additions: none
- Package changes: none
- Lockfile changes: none
- Live data integration: not started
- AI integration: not started
- Authentication/database integration: not started
- Meridian Eclipse globe: deferred until after visual approval
