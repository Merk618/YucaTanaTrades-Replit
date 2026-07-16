-- Authentication/session foundation only. This migration intentionally does
-- not alter legacy portfolio, journal, watchlist, risk, or provider tables.
--
-- One-shot, non-idempotent forward proposal. Apply this exact file once through
-- an approved SQL migration runner that preserves the transaction and records
-- provenance. Do not substitute `drizzle-kit push`: schema synchronization does
-- not execute the required auth_schema_versions insert below. Before execution,
-- verify the connection's schema/search_path and confirm that none of these
-- unqualified objects already exist.

BEGIN;

CREATE TYPE auth_session_kind AS ENUM ('guest', 'authenticated');
CREATE TYPE auth_audit_outcome AS ENUM ('success', 'failure', 'blocked');

CREATE TABLE auth_schema_versions (
  version integer PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  normalized_email text NOT NULL,
  display_name text,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  disabled_at timestamptz,
  auth_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_normalized_email_uidx ON users (normalized_email);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  kind auth_session_kind NOT NULL,
  auth_version integer,
  token_hmac text NOT NULL,
  csrf_token_hmac text NOT NULL,
  rotated_from_session_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  idle_expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revocation_reason text
);
CREATE UNIQUE INDEX auth_sessions_token_hmac_uidx ON auth_sessions (token_hmac);
CREATE INDEX auth_sessions_user_id_idx ON auth_sessions (user_id);
CREATE INDEX auth_sessions_expiry_idx
  ON auth_sessions (idle_expires_at, absolute_expires_at);

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hmac text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE UNIQUE INDEX password_reset_tokens_hmac_uidx
  ON password_reset_tokens (token_hmac);
CREATE UNIQUE INDEX password_reset_tokens_active_user_uidx
  ON password_reset_tokens (user_id) WHERE used_at IS NULL;
CREATE INDEX password_reset_tokens_user_id_idx
  ON password_reset_tokens (user_id);
CREATE INDEX password_reset_tokens_expiry_idx
  ON password_reset_tokens (expires_at);

CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hmac text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE UNIQUE INDEX email_verification_tokens_hmac_uidx
  ON email_verification_tokens (token_hmac);
CREATE UNIQUE INDEX email_verification_tokens_active_user_uidx
  ON email_verification_tokens (user_id) WHERE used_at IS NULL;
CREATE INDEX email_verification_tokens_user_id_idx
  ON email_verification_tokens (user_id);
CREATE INDEX email_verification_tokens_expiry_idx
  ON email_verification_tokens (expires_at);

CREATE TABLE auth_rate_limits (
  id uuid PRIMARY KEY,
  scope text NOT NULL,
  subject_hmac text NOT NULL,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX auth_rate_limits_window_uidx
  ON auth_rate_limits (scope, subject_hmac, window_started_at);
CREATE INDEX auth_rate_limits_cleanup_idx
  ON auth_rate_limits (window_started_at, blocked_until);

CREATE TABLE auth_audit_events (
  id uuid PRIMARY KEY,
  event text NOT NULL,
  outcome auth_audit_outcome NOT NULL,
  code text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id uuid REFERENCES auth_sessions(id) ON DELETE SET NULL,
  subject_hmac text,
  request_id text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_audit_events_user_id_idx ON auth_audit_events (user_id);
CREATE INDEX auth_audit_events_session_id_idx ON auth_audit_events (session_id);
CREATE INDEX auth_audit_events_occurred_at_idx
  ON auth_audit_events (occurred_at);

INSERT INTO auth_schema_versions (version) VALUES (1);

COMMIT;
