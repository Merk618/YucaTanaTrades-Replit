# UI-2 approved experience

UI-2 freezes the visually approved YucaTanaTrades and Meridian OS experience on the `codex/ui-2-experience-routes` branch. It completes the primary application routes, refines the authentication entrance, fixes the reset-password completion state, and adds a strictly development-only Review Access flow.

## Approved route surfaces

- `/` — Overview
- `/markets` — Markets
- `/charts` — Charts
- `/portfolio` — Portfolio
- `/research` — Research
- `/news` — News Intelligence
- `/ai-lab` — Meridian AI Hub
- `/sign-in`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` — authentication surfaces

All market, portfolio, research, news, and AI content remains explicitly labeled as Demo, Historical, Delayed, AI-generated, unavailable, or deferred. UI-2 does not connect live market data, brokerage providers, production AI, payments, or an external database.

## Development Review Access

Review Access is a local visual-review convenience, not a production administrator path. It requires a non-production environment, an explicit server feature flag, the in-memory authentication store, and an exact loopback-bound API. The access code is supplied only through server process environment and is never committed or returned by an API.

The resulting `development_review` principal is short-lived and non-persistent. It can open the static Meridian OS shell, inspect its current session, and sign out. It cannot access protected user, provider, billing, deployment, database, or administrative operations. Production registers no Review Access endpoint and returns `404`.

## Curated evidence

The repository keeps 15 lightweight JPEG screenshots, totaling less than 1 MiB, under `screenshots/`. They cover the public entrance, Review Access, registration, reset completion, unavailable authentication, all seven primary route surfaces, the command palette, tablet behavior, and mobile behavior.

`evidence-validation.json` records the retained runtime validation set, including frame counts, durations, dimensions, and visual-delta checks for the motion recordings. A pre-submit Review Access recording and its raw frames were deleted because the populated digit cells exposed the entered local review code. The remaining animated WebP recordings, raw frame sequences, browser logs, preview PID files, build output, and other runtime harness artifacts intentionally remain outside the commit.

## Validation boundary

The approved handoff was validated with the full workspace typecheck, API and frontend Vitest suites, Node-native tests, focused Review Access and reset-password regression tests, the canonical production build, `git diff --check`, and scans for secrets, the local access-code literal, and unsafe user-ID fallbacks. The authentication migration remains unapplied.
