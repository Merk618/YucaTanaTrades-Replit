# Authentication/session foundation implementation report

## Scope and anchor

- Repository: `C:\Users\brock\Documents\Alt YucaTanaTrades\YucaTanaTrades-Replit`
- Branch: `codex/auth-session-foundation`
- Approved UI-1 commit: `ab29ba4f23f571633d34cefed9d088da3ab28d2e`
- Approved UI-1 tag: `ui-1-visual-approved`
- Migration status: proposed in `lib/db/migrations/0001_auth_session_foundation.sql`; not applied
- Merge/commit status: no commit and no merge were performed in this phase

The branch was created directly from the approved UI-1 commit. The UI-1 shell, dashboard geometry, navigation rail, top bar, chart and intelligence composition, responsive rules, and motion system were not redesigned or broadly refactored.

## Pre-implementation baseline

The frozen pnpm install linked the locked workspace packages without changing any manifest or lockfile. On this Windows host, the untouched repository had two platform-package failures before authentication source changed:

- `pnpm -r --if-present run test` stopped before test collection because `@rollup/rollup-win32-x64-msvc` was absent from the frozen installation.
- `pnpm run build` completed the TypeScript phase and then stopped in Vite/Rollup for the same missing native optional package. The API server's focused esbuild build also lacks the locked `@esbuild/win32-x64` platform binary.

The untouched full typecheck passed. These native-package failures remain reproducible and were not worked around by changing dependencies.

The Phase 0.1 audit found no approved authentication document, auth route/status/feature-flag contract, or auth migration at the anchor. The repository provided only the generic Express, OpenAPI, Drizzle, Wouter, React Query, cookie-parser, and logger foundations. Legacy journal, watchlist, position, portfolio, risk, and provider credential data had no owner identity.

## Implemented foundation

### Server and security

- Opaque 256-bit session cookies with only domain-separated HMAC-SHA-256 digests stored server-side.
- Secure environment-aware `HttpOnly`, `SameSite=Lax`, root-path cookie policy; production uses the `__Host-` prefix and requires `Secure`.
- Server-derived identity on every protected request; no browser JWT default, client-supplied owner ID, or fallback user.
- Synchronizer-token CSRF plus exact Origin/Referer validation for unsafe requests.
- Node 24 Argon2id password hashing with versioned encodings, random salts, bounded parameters, and generic credential failures.
- Guest/authenticated/expired session states, authentication rotation, sliding idle and absolute expiry, current-session revocation, logout-all via auth-version invalidation, and route/focus revalidation for externally revoked sessions.
- Layered HMAC-keyed rate limits for guest issuance, sign-in, registration, recovery, reset, and verification. Guest sign-out is rejected so it cannot bypass issuance limits.
- Normalized email keys, generic forgot-password behavior, audit-safe allowlisted logging, explicit trusted-proxy validation, and fail-closed production environment checks.
- Local development-token responses require an exact loopback API bind, loopback-only application origins, and a loopback-bound UI dev server; production rejects the capability.
- Every authentication-store call is bounded by a validated operation timeout. PostgreSQL pool acquisition, connection, query, statement, and lock waits also have finite limits so storage stalls resolve to unavailable rather than indefinite loading.
- One-time-token replacement and completion use a consistent user-then-token lock order and partial uniqueness constraints. Verification issuance failure during registration is contained, while a post-account session-store failure has an explicit sign-in recovery path.
- `Cache-Control: no-store, private`, `Pragma: no-cache`, `Expires: 0`, `Vary: Cookie`, and no ETag on every auth response.
- Development/test memory auth boots with `DATABASE_URL` absent and opens no database pool. Production rejects memory storage.

### Contracts and persistence proposal

- OpenAPI contracts for status, current session, sign-in, registration, sign-out, sign-out-all, forgot/reset password, and email verification request/completion.
- Root cookie security plus explicit public/optional overrides, CSRF header parameters, reachable authentication errors, and ownership-migration failures on protected legacy operations.
- Regenerated Zod request/response contracts and TypeScript schema models from the OpenAPI source. The existing Orval React-client generation remains blocked by the pre-existing missing esbuild platform binary, so the checked-in generated React client was not hand-edited.
- Additive Drizzle schema and transactional SQL migration proposal for users, schema version marker, sessions, reset tokens, verification tokens, rate windows, and audit events.
- Database readiness checks the completed auth migration version marker rather than a single table.
- Password reset and email verification completion are transactional in the database store.
- Legacy globally scoped user data fails closed with `503 ownership_migration_required`; no existing data is assigned to a fabricated owner.

### Client and UI

- Public YucaTanaTrades sign-in, registration, forgot/reset-password, and email-verification surfaces using the frozen UI-1 color, typography, glass, and motion language.
- Meridian OS mounts only after a server-authenticated session. The existing account slots now display only server-provided name/email and sign-out controls; no tier, membership, provider, or portfolio state is fabricated.
- Guest, loading, expired, unavailable, and authenticated states with retry and sanitized local `returnTo` handling.
- Cookie credentials are mandatory in the web API client; the in-memory CSRF token is attached only to unsafe same-origin requests.
- Reset and verification tokens are accepted from URL fragments only, scrubbed before paint, protected by a `no-referrer` document policy, and retained only in component memory.
- Session identity changes clear the React Query cache. A mutation/revalidation gate prevents stale refreshes from overwriting newer authentication state, and guest, expired, and authenticated contexts revalidate on expiry, focus, and visibility changes.
- Protected return destinations preserve safe local paths, query strings, and fragments; unsafe or external destinations collapse to `/`.

## Validation results

- Full workspace typecheck: passed after implementation. The final direct locked-compiler recheck also passed the root build plus API, UI, mockup, scripts, and generated-client TypeScript targets. A subsequent `pnpm run typecheck` wrapper retry stopped before invoking TypeScript because pnpm requested an interactive `node_modules` purge in a non-TTY (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`); no purge or installation was allowed.
- Directly executable focused tests: 31/31 passed: 29 client-contract cases plus two bounded-store `node:test` cases (email contract, return routing, auth state, safe error policy/copy, mutation serialization, fragment-token handling, cookie/CSRF behavior, and store timeouts).
- API-focused authentication source coverage contains 45 cases: 43 Vitest cases covering crypto, environment, memory store, service, atomic token behavior, session issuance limits, cache/parser headers, HTTP routes, logout, reset, verification, guards, fault recovery, and ownership, plus the two directly executed bounded-store cases. Vitest execution is blocked before collection by the pre-existing missing Rollup native package.
- Full production build: TypeScript passed; workspace Vite build remains blocked by the same pre-existing Rollup package.
- Focused API esbuild: remains blocked by the pre-existing missing esbuild platform package.
- Focused production UI bundle using the already available external workspace Vite runtime passed at the bundle-validation checkpoint with 2,244 modules transformed. A stable-tree rerun requiring temporary output outside the repository was denied by the execution environment's usage gate; no dependency or source workaround was attempted.
- `git diff --check`: passed.
- Package manifests, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`: unchanged.
- OpenAPI YAML parse, unique-key check, protected-operation security audit, and CSRF audit: passed.
- Latest memory-mode runtime booted with `DATABASE_URL` explicitly removed.

Runtime HTTP checks passed:

- registration `201`, verification request `202`, verification completion `200`;
- authenticated current-session lookup returned verified server identity;
- valid current-session lookups emitted no redundant `Set-Cookie`; auth responses, including malformed-JSON parser errors, were non-cacheable and emitted no ETag;
- loopback cookie was `HttpOnly`, `SameSite=Lax`, `Path=/`, and intentionally not `Secure` on HTTP;
- malformed email registration failed validation, and the eleventh distinct invalid verification completion was rate-limited after ten generic failures;
- guest sign-out returned `401`, untrusted Origin returned `403`, quarantined ownership returned `503`, logout-all returned a guest context, and the revoked cookie resolved as `expired`.

Browser checks passed for registration, generic wrong-credential handling, sign-in, sign-out, password reset, old-password rejection, new-password sign-in, verification request/completion, route protection, externally revoked session handling, loading, unavailable/retry, and authenticated-shell identity. At an 820×1180 tablet viewport the auth routes had no horizontal overflow. The validation browser reported reduced motion enabled; four loaded reduced-motion media groups were active, auth aurora animation resolved to `none`, panel transform to `none`, and interface transition duration to 80 ms.

The final failure/recovery check stopped the API while a fragment-derived reset token was held only in component memory. The UI failed closed to the unavailable boundary, the URL remained scrubbed, and retry after API recovery restored the same reset form without a “reset link required” state. This confirms the auth service-route boundary keeps the token-owning component mounted across transient loading/unavailable states.

Temporary runtime evidence remains untracked under `.auth-runtime/evidence/`:

- `sign-in-desktop.png`
- `authenticated-dashboard.png`
- `account-menu.png`
- `sign-in-tablet.png`
- `register-tablet.png`
- `auth-loading.png`
- `auth-unavailable.png`

## Production gate and deferred work

Before production rollout:

1. Review and apply the proposed migration through an approved migration runner.
2. Configure a durable database, production session secret, exact HTTPS origins, and exact trusted proxies for the deployment topology.
3. Add approved email delivery before enabling recovery or verification in production.
4. Install a bounded cleanup job for expired/revoked guest sessions, consumed/expired one-time tokens, and stale limiter windows under an approved retention policy.
5. Complete the separate ownership migration before enabling legacy user-scoped data routes.
6. Restore the frozen installation's missing Windows optional platform packages through the approved dependency/install workflow, then rerun Vitest and the native production builds without changing package ranges.

Live market data, brokerage integration, production AI, the final Kimi globe, payments, subscription tiers, social login, passkeys, broad domain migration, and a main-branch merge remain outside this phase.
