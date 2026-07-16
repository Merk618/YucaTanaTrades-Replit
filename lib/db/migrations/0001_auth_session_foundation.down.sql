-- Rollback proposal for 0001_auth_session_foundation.sql.
-- This file is intentionally not applied automatically. Before use, stop
-- authentication traffic, take a verified backup, use the same approved
-- PostgreSQL schema/search_path as the forward migration, and confirm that no
-- later authentication schema version or downstream dependency exists.

BEGIN;

SET LOCAL lock_timeout = '5s';

LOCK TABLE
  auth_schema_versions,
  users,
  auth_sessions,
  password_reset_tokens,
  email_verification_tokens,
  auth_rate_limits,
  auth_audit_events
IN ACCESS EXCLUSIVE MODE;

DO $rollback$
DECLARE
  applied_versions integer[];
BEGIN
  SELECT array_agg(version ORDER BY version)
    INTO applied_versions
    FROM auth_schema_versions;

  IF applied_versions IS DISTINCT FROM ARRAY[1]::integer[] THEN
    RAISE EXCEPTION
      'Rollback refused: expected only auth schema version 1, found %',
      applied_versions;
  END IF;
END
$rollback$;

DROP TABLE auth_audit_events;
DROP TABLE password_reset_tokens;
DROP TABLE email_verification_tokens;
DROP TABLE auth_sessions;
DROP TABLE auth_rate_limits;
DROP TABLE users;
DROP TABLE auth_schema_versions;

DROP TYPE auth_audit_outcome;
DROP TYPE auth_session_kind;

COMMIT;
