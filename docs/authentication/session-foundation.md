# Authentication and session foundation

Status: implemented authentication/session architecture with an additive, versioned migration proposal. The migration is not applied automatically and this document does not authorize changes to the visually approved UI-1 geometry or motion system.

## Approved anchor and branch

- Repository: `C:\Users\brock\Documents\Alt YucaTanaTrades\YucaTanaTrades-Replit`
- Approved UI commit: `ab29ba4f23f571633d34cefed9d088da3ab28d2e`
- Approved UI tag: `ui-1-visual-approved`
- Dedicated implementation branch: `codex/auth-session-foundation`
- Public brand: YucaTanaTrades
- Authenticated operating environment: Meridian OS

The approved UI-1 shell, dashboard geometry, navigation rail, top bar, chart composition, intelligence rail, responsive behavior, and motion system remain frozen.

## Phase 0.1 audit finding

No approved Phase 0.1 authentication document, authentication tag, authentication route contract, feature-flag contract, session-status contract, or migration set existed at the approved anchor or in reachable repository history.

The repository did provide useful general foundations:

- `replit.md` establishes Express, PostgreSQL, Drizzle, Wouter, React Query, and OpenAPI-first code generation.
- `lib/api-spec/openapi.yaml` is the API contract source of truth.
- `artifacts/api-server/src/lib/logger.ts` already redacts Authorization, Cookie, and Set-Cookie headers.
- `cookie-parser` is already locked for the API package.
- `docs/ui-1/implementation-log.md` records that authentication and database integration were not started and that account state was intentionally unavailable in UI-1.

This document and the authentication additions to the OpenAPI contract establish the missing foundation. The current phase requirements are authoritative where older repository notes are silent.

## Security decisions

### Opaque server-side sessions

The web application uses an opaque session credential, not a browser JWT.

1. Generate at least 256 bits of cryptographically random session-token material.
2. Send the raw token only in the session cookie.
3. Store only an HMAC-SHA-256 digest of the token in PostgreSQL. The HMAC key is derived from `SESSION_SECRET` with a domain-specific label so session, CSRF, recovery, and verification digests do not share an undifferentiated key.
4. Resolve identity from the server-side session row on every protected request.
5. Rotate the session token after successful sign-in or registration. Password-reset completion revokes every authenticated session for the target account and the presented browser context, then returns only a generic completion response; the client establishes a replacement guest context with the following `GET /auth/session`. Sign-out and sign-out-all return fresh guest contexts directly. Email verification does not rotate the session in this phase.
6. Revoke the current row on sign-out. Sign-out-all revokes every active session for the authenticated user, including the current row.
7. Enforce revocation plus both sliding idle expiry and absolute expiry for authenticated sessions. The idle deadline is refreshed on use but never beyond the absolute deadline. A guest session's idle and absolute deadlines are the same.
8. Compare digests in constant time where application-level comparison occurs.

The raw session token, CSRF token, password, password hash, reset token, verification token, and secret values must never be logged or returned outside their defined one-time response channel.

### Guest session and synchronizer CSRF

An unauthenticated browser receives a short-lived server-side guest session from `GET /auth/session`. The response includes the session's synchronizer token in `csrfToken`; the cookie remains HttpOnly.

Every unsafe authentication operation requires both:

- the session cookie; and
- the exact `X-CSRF-Token` value associated with that server-side session.

The server stores only a domain-separated HMAC digest of the CSRF token. It rejects missing, mismatched, expired, or revoked session/token pairs before processing a request. Unsafe requests also receive an Origin check against the validated application origin, with a strict same-origin Referer fallback where appropriate. `GET /auth/session` is the deliberate safe-method exception: it may create a guest context, replace an invalid context, or refresh authenticated idle expiry. Other safe endpoints do not mutate authentication state.

The CSRF token is not an authentication credential. Session rotation also rotates the CSRF token, and the resulting `SessionEnvelope` supplies the replacement.

### Password hashing

Passwords use the Node 24 built-in `node:crypto` Argon2 API with the `argon2id` algorithm. No password-hashing dependency is introduced.

The stored value is a versioned encoding containing the algorithm, parameters, random salt, and derived tag. The current policy uses a 16-byte random salt, a 32-byte tag, three passes, and parallelism of four. Production uses 64 MiB of memory; development and test use 32 MiB to bound local runtime cost without changing the production policy. Invalid-email, unknown-account, and otherwise unusable sign-in attempts verify against an equivalent dummy hash so account existence is not exposed through obvious timing differences.

The Node Argon2id capability is imported directly, so a runtime without that capability fails module startup in every environment. No environment substitutes a weaker hash.

### Cookie policy

| Environment | Cookie | Required attributes |
| --- | --- | --- |
| HTTPS production or preview | `__Host-ytt_session` | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, no `Domain`, bounded `Max-Age` |
| Loopback HTTP development | `ytt_session` | `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`, bounded `Max-Age`; `Secure` is disabled only because loopback HTTP cannot set a Secure cookie |

Production cookie security is derived from validated environment state and cannot be disabled by a convenience flag. The API accepts credentialed requests only from the configured application origin. Cross-origin wildcard CORS is incompatible with cookie authentication.

### Email normalization and credential responses

Email input is trimmed, Unicode-normalized consistently, and lowercased before lookup and uniqueness checks. Provider-specific transformations such as removing dots or plus-address tags are forbidden. The normalized value is the unique identity key; a separate presentation value may preserve user-facing casing.

Sign-in always returns the same generic credential error for an unknown email, incorrect password, disabled account, or otherwise unusable credential. Forgot-password always returns the same accepted response whether or not the account exists. Registration failures do not expose sensitive account state beyond what the product explicitly chooses to disclose later.

Registration intentionally contains verification-token issuance failure: the account and authenticated session still succeed, the account remains unverified, and a later verification request is the recovery path. The user row necessarily exists before session rotation; if durable session storage fails after account creation, registration returns unavailable and the user recovers by signing in with the password they just selected. A future aggregate registration transaction may narrow that operational boundary, but the current behavior is explicit, tested, and does not weaken credential or ownership checks.

### Rate limiting and audit-safe logging

Authentication endpoints apply layered fixed-window limits by route, normalized account-key digest where available, and privacy-preserving client-network key. Sign-in, registration, reset completion, and verification request/completion return `429` with `AuthError` when their limits are exceeded. Forgot-password deliberately remains a generic `202`, records a blocked audit outcome, and does not persist a reset token when limited so its response does not reveal account existence.

`GET /auth/session` does not charge a valid current-session lookup. Creation of a new guest session, including replacement after a missing, invalid, expired, or revoked cookie, is limited by an HMAC client-network key to 30 attempts per 15 minutes. A limited issuance attempt returns `429` and does not create or set a replacement session.

Audit records contain an allowlisted event name, outcome, request ID, optional user/session identifiers, coarse or keyed client-network metadata, and timestamp. They never contain request bodies, passwords, raw cookies, raw tokens, token digests, password hashes, CSRF values, Authorization headers, or secrets. Application errors are mapped to safe codes before logging.

## Environment validation and feature flags

Environment validation runs before the authentication router is created. The shared database module is import-safe without `DATABASE_URL`: it leaves the pool unconfigured and throws only if a database-backed operation is actually attempted. Consequently, `AUTH_STORE=memory` starts without `DATABASE_URL` and without opening a database pool, while `AUTH_STORE=database` is rejected during environment validation unless the URL is present.

| Setting | Policy |
| --- | --- |
| `NODE_ENV` | Must be one of `development`, `test`, or `production`. |
| `AUTH_STORE` | Defaults to `database` in production and `memory` in development/test. Production rejects `memory`. |
| `AUTH_BIND_HOST` | Defaults to `0.0.0.0` in production and `127.0.0.1` outside production. Development-token exposure requires an exact loopback IP and loopback-only application origins. |
| `AUTH_STORE_OPERATION_TIMEOUT_MS` | Bounds every authentication-store operation; defaults to 8000 ms and accepts only 250–30000 ms. Database connections, queries, statements, and lock waits also have finite driver-level limits. |
| `DATABASE_URL` | Required only when `AUTH_STORE=database`; the database store persists users, sessions, tokens, limits, and audit events. |
| `SESSION_SECRET` | Required in production. Development/test generate an ephemeral secret when omitted. Validation requires at least 32 raw UTF-8 bytes and 12 distinct characters. |
| `APP_ORIGIN` / `AUTH_ALLOWED_ORIGINS` | Production requires at least one exact HTTPS origin through either setting. Development/test use validated loopback defaults when neither is supplied; non-Secure cookies are permitted only when every allowed origin is loopback HTTP, HTTPS origins require `AUTH_COOKIE_SECURE=true`, and non-loopback HTTP origins remain rejected. |
| `AUTH_ENABLED` | Explicitly required in production. When false, status reports unavailable and protected routes fail closed. |
| `AUTH_REGISTRATION_ENABLED` | Defaults false in production and true in development/test. |
| `AUTH_PASSWORD_RESET_ENABLED` | Defaults false in production. In development/test it defaults true only when `AUTH_EXPOSE_DEV_TOKENS=true`; otherwise it defaults false. Production should enable it only with an approved delivery channel. |
| `AUTH_EMAIL_VERIFICATION_ENABLED` | Defaults false in production. In development/test it defaults true only when `AUTH_EXPOSE_DEV_TOKENS=true`; otherwise it defaults false. Production should enable it only with an approved delivery channel. |
| `AUTH_COOKIE_SECURE` | Defaults true in production and false in development/test. Production rejects false. When true in any environment, the cookie uses the `__Host-` prefix. |
| `AUTH_TRUST_PROXY` | Validated comma-separated trusted IP/CIDR entries or safe aliases such as `loopback`, `linklocal`, and `uniquelocal`; catch-all zero-prefix CIDRs are rejected. Defaults false in every environment. Direct TLS deployments may leave it false; proxied production deployments must configure only their exact trusted proxies. |
| `AUTH_EXPOSE_DEV_TOKENS` | Explicit local-only escape hatch for testing. Production rejects true; nonproduction also requires the API/UI to bind an exact loopback IP and allows only loopback application origins. Selected recovery/verification responses may include `developmentToken`; tokens are never logged. |
| `AUTH_USER_DATA_MIGRATION_READY` | Must remain false in this phase. Startup rejects true because legacy user-owned handlers are not ownership-scoped. |
| `AUTH_SESSION_TTL_SECONDS` | Validated bounded positive integer; governs authenticated absolute expiry. |
| `AUTH_GUEST_SESSION_TTL_SECONDS` | Independently bounded positive integer governing guest-session lifetime. The validator does not compare it with authenticated lifetime. |
| `AUTH_RESET_TOKEN_TTL_SECONDS` | Validated short lifetime for single-use reset tokens. |
| `AUTH_VERIFICATION_TOKEN_TTL_SECONDS` | Validated bounded lifetime for single-use verification tokens. |

Current defaults are 30 minutes for guest sessions, 24 hours for authenticated sliding idle expiry, 30 days for authenticated absolute expiry, 30 minutes for reset tokens, and 24 hours for verification tokens. The idle duration is fixed in this phase. Configurable bounds are 5 minutes–24 hours for guests, 1 hour–365 days for authenticated absolute expiry, 5 minutes–24 hours for reset tokens, and 1–7 days for verification tokens.

`GET /auth/status` exposes only service availability and the three safe feature booleans. It never exposes secrets, configuration values, internal provider state, or account existence.

Local development may use the loopback cookie policy and either the memory store or an explicitly selected local database. The memory store is development/test-only and carries no production durability or scaling claim. Local behavior must not print recovery or verification tokens to logs, alter the production hashing policy, accept arbitrary origins, or silently bypass CSRF. Automated tests prefer fixtures or direct store setup; the explicitly gated development-token response exists only for local end-to-end work and is forbidden in production.

Every `/auth/*` response, including errors, sends `Cache-Control: no-store, private`, `Pragma: no-cache`, `Expires: 0`, and `Vary: Cookie`; the application does not emit entity tags. These rules prevent session, identity, CSRF, and one-time-token responses from being cached by browsers or intermediaries.

## Status model

The wire contract uses `SessionState`:

- `guest`: a valid guest session and CSRF token, with `user = null`
- `authenticated`: a valid server-derived user identity and expiry
- `expired`: the presented session is expired or revoked; `user = null` and a replacement CSRF-capable guest context may be established

Client-only `loading` exists while status/session lookup is pending. `unavailable` is derived from `GET /auth/status`, an explicit `503`, or a transport failure; it is not misrepresented as `guest`.

## Endpoint contract

All paths are relative to `/api`. Every unsafe operation requires `X-CSRF-Token` and the opaque session cookie.

| Method and path | Operation ID | Authentication | Result |
| --- | --- | --- | --- |
| `GET /auth/status` | `getAuthStatus` | Public | Availability and safe feature flags |
| `GET /auth/session` | `getCurrentSession` | Optional cookie | Guest, authenticated, or expired `SessionEnvelope`; creates guest context when needed |
| `POST /auth/sign-in` | `signIn` | Guest/session cookie + CSRF | Generic credential handling; rotates to authenticated session |
| `POST /auth/register` | `registerAccount` | Guest/session cookie + CSRF | Creates account when enabled; rotates to authenticated session |
| `POST /auth/sign-out` | `signOut` | Authenticated session + CSRF | Revokes current session and returns a new guest envelope |
| `POST /auth/sign-out-all` | `signOutAllDevices` | Authenticated session + CSRF | Revokes every session for the current user and returns a new guest envelope |
| `POST /auth/password/forgot` | `requestPasswordReset` | Guest/session cookie + CSRF | Generic accepted response without account enumeration |
| `POST /auth/password/reset` | `completePasswordReset` | Guest/session cookie + CSRF | Consumes one-time token, updates Argon2id hash, revokes prior sessions; the client then refreshes session state |
| `POST /auth/email-verification/request` | `requestEmailVerification` | Authenticated session + CSRF | Generic accepted resend response |
| `POST /auth/email-verification/complete` | `completeEmailVerification` | Guest/session cookie + CSRF | Consumes one-time verification token |

The OpenAPI security scheme is `cookieAuth`. The Secure-cookie name appears in the formal scheme; its description records the loopback-HTTP-only development name. Generated clients must be regenerated from the OpenAPI source rather than hand-edited.

### One-time delivery links

An approved mail delivery provider is outside this phase. When delivery is added, password-reset and email-verification links place the raw one-time token in the URL fragment, for example `/reset-password#token=...` and `/verify-email#token=...`. Fragments are not sent in HTTP requests or Referer headers, and the public app declares a `no-referrer` policy. The client reads the fragment once, scrubs sensitive fragment or query keys before paint with `history.replaceState`, retains only a fragment-derived token in memory for the completion call, and sends it to the API only in the JSON request body. Query-string token delivery is not supported by the foundation contract.

The optional `developmentToken` response property is gated by `AUTH_EXPOSE_DEV_TOKENS`, is never present in production, and does not represent a production delivery channel. Forgot-password remains generic: a development token may be a nonpersisted decoy when the account is unknown or the request is limited.

## Database schema proposal

The migration is additive and ownership-safe. `lib/db/migrations/0001_auth_session_foundation.sql` is the concrete versioned proposal and matches the Drizzle schema. It is intentionally one-shot and non-idempotent: transactional PostgreSQL DDL makes a failed first application atomic, while a second application must fail instead of silently accepting drift. It is not applied automatically. Before execution, an operator must confirm the approved PostgreSQL schema and `search_path`, verify that the unqualified object names do not collide, and record provenance. The file must be executed through an approved SQL migration runner because `drizzle-kit push` will not execute the required `auth_schema_versions` insert. The database store reports unavailable until the authentication tables and version row exist. The companion `lib/db/migrations/0001_auth_session_foundation.down.sql` is a reviewed rollback proposal, not an automatically runnable down migration. This phase does not claim that a migration journal, deployment cutover, or rollback execution has occurred.

### `users`

- UUID primary key
- normalized email with a unique index
- presentation email
- optional display name
- versioned Argon2id password encoding
- email verification timestamp
- disabled timestamp
- authentication version for bulk session invalidation
- created and updated timestamps

### `auth_sessions`

- UUID primary key
- nullable user foreign key so guest sessions are first-class
- unique HMAC session-token digest
- HMAC CSRF-token digest
- guest/authenticated state
- created, last-seen, idle-expiry, and absolute-expiry timestamps
- revoked timestamp and revocation reason
- optional predecessor session ID for rotation audit
- authentication version captured at issuance

The table has a unique token-digest index, a user index, and a composite idle/absolute-expiry index. The service enforces the invariant `idle_expires_at <= absolute_expires_at` whenever it creates or refreshes a session; the proposal intentionally does not add a database `CHECK`, so any future writer must preserve the same invariant. No device metadata is stored in this phase.

### `password_reset_tokens` and `email_verification_tokens`

- purpose-specific table with a UUID primary key
- non-null user foreign key
- unique HMAC digest of the random one-time token
- created and expiry timestamps
- nullable `used_at` timestamp representing consumption or invalidation

Issuing a new token atomically invalidates prior unused tokens of that purpose and inserts the replacement through one store operation. The PostgreSQL implementation serializes issuance and completion on the user row before locking token rows, while a partial unique index permits at most one unused token per user and purpose. Password-reset completion atomically consumes the token, updates the password and authentication version, revokes the user's sessions, and invalidates remaining reset tokens. Email-verification completion atomically consumes the token, marks the user verified, and invalidates the user's remaining verification tokens. No separate revocation or request-metadata columns are stored in this phase.

### `auth_rate_limits`

- keyed digest of route plus account/network dimension
- fixed window start
- attempt count and updated timestamp
- optional blocked-until timestamp

The application may use an external limiter later, but the security behavior and contract cannot depend on process-local memory in a horizontally scaled production deployment.

The expiry indexes support a future bounded maintenance job that deletes expired or long-revoked guest sessions, consumed/expired one-time tokens, and stale limiter windows according to an approved audit-retention policy. That scheduled cleanup is required before production rollout but is not installed or run in this phase.

### `auth_audit_events`

- append-only UUID primary key
- optional user and session foreign keys
- allowlisted event and outcome codes
- request ID
- HMAC privacy-preserving network subject
- timestamp

No device field or arbitrary JSON metadata object is stored in this phase.

Audit events index both nullable foreign keys and the occurrence timestamp. User deletion cascades through sessions and one-time tokens, while audit references use `ON DELETE SET NULL` so retained security events do not keep user or session rows alive.

### User-scoped ownership migration

The current `journal_entries`, `watchlist`, `positions`, and `risk_config` tables have no owner. Existing routes query global data, `risk_config` is a singleton row, and startup can seed global positions. No existing row may be assigned to a newly registered user or a fabricated `userId = 1`.

Proposed stages:

1. Create authentication tables, indexes, foreign keys, and enums without changing UI-1.
2. Add nullable `user_id` and an ownership state to each user-scoped table. Existing rows become `legacy_unowned` and remain quarantined.
3. Make every new write take `user_id` only from the authenticated server context. Never accept ownership from request bodies.
4. Filter list, summary, detail, update, and delete operations by both record identity and authenticated `user_id`. A record owned by another user is indistinguishable from a missing record.
5. Replace singleton risk ownership with one row per user under a unique `user_id` constraint.
6. Disable automatic assignment or production seeding of portfolio/account data. Legacy rows remain inaccessible until a later explicit, audited ownership-import process is approved.
7. After quarantine and cutover validation, make ownership non-null for newly active user records while retaining quarantined legacy data in a separate controlled path or archive table.

This is the narrow ownership migration required for authentication; it is not authorization to begin a broad database-domain migration.

## Route guards and brand boundary

Public authentication screens remain YucaTanaTrades-branded. Meridian OS names the authenticated operating environment after a session is established.

The authentication provider and route guard sit outside the frozen `AppShell`:

- `loading` waits for session lookup without flashing private content;
- `guest` routes to the public sign-in or registration flow;
- `authenticated` mounts the existing frozen Meridian OS shell;
- `expired` presents a clear session-expired path back to sign-in;
- `unavailable` presents an honest unavailable state with retry behavior.

The shell must derive the user from `SessionEnvelope.user`. It must not fabricate account tier, membership, provider connection, portfolio state, initials, or identity. Protected API routes independently enforce authentication and ownership; client guards are navigation behavior, not the security boundary.

## Explicit non-goals

This phase does not begin or modify:

- live market data or brokerage integration
- production AI
- the final Kimi globe
- payment processing or subscription tiers
- social login
- passkeys
- broad database-domain migration
- provider credential architecture
- the approved UI-1 geometry or motion system
- a merge into `main`
