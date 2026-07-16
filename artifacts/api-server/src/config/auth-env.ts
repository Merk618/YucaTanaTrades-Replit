import { randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";

export type AuthStoreMode = "database" | "memory";

export interface AuthEnvironment {
  nodeEnv: "development" | "test" | "production";
  enabled: boolean;
  features: {
    registration: boolean;
    passwordReset: boolean;
    emailVerification: boolean;
  };
  sessionSecret: string;
  generatedDevelopmentSecret: boolean;
  storeMode: AuthStoreMode;
  bindHost: string;
  storeOperationTimeoutMs: number;
  cookie: {
    name: string;
    secure: boolean;
    httpOnly: true;
    sameSite: "lax";
    path: "/";
  };
  allowedOrigins: ReadonlySet<string>;
  trustProxy: false | string[];
  exposeDevelopmentTokens: boolean;
  userDataMigrationReady: false;
  userDataStatus: "migration_required";
  session: {
    guestTtlMs: number;
    idleTtlMs: number;
    absoluteTtlMs: number;
  };
  password: {
    memoryKiB: number;
    passes: number;
    parallelism: number;
    tagLength: number;
  };
  tokenTtl: {
    passwordResetMs: number;
    emailVerificationMs: number;
  };
}

const booleanFromEnvironment = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const integerFromEnvironment = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value));

const rawEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_ENABLED: booleanFromEnvironment.optional(),
  AUTH_REGISTRATION_ENABLED: booleanFromEnvironment.optional(),
  AUTH_PASSWORD_RESET_ENABLED: booleanFromEnvironment.optional(),
  AUTH_EMAIL_VERIFICATION_ENABLED: booleanFromEnvironment.optional(),
  SESSION_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  AUTH_STORE: z.enum(["database", "memory"]).optional(),
  AUTH_BIND_HOST: z.string().trim().min(1).max(253).optional(),
  AUTH_STORE_OPERATION_TIMEOUT_MS: integerFromEnvironment.optional(),
  AUTH_COOKIE_SECURE: booleanFromEnvironment.optional(),
  AUTH_ALLOWED_ORIGINS: z.string().optional(),
  AUTH_TRUST_PROXY: z.string().optional(),
  APP_ORIGIN: z.string().optional(),
  AUTH_EXPOSE_DEV_TOKENS: booleanFromEnvironment.default("false"),
  AUTH_USER_DATA_MIGRATION_READY: booleanFromEnvironment.default("false"),
  AUTH_SESSION_TTL_SECONDS: integerFromEnvironment.optional(),
  AUTH_GUEST_SESSION_TTL_SECONDS: integerFromEnvironment.optional(),
  AUTH_RESET_TOKEN_TTL_SECONDS: integerFromEnvironment.optional(),
  AUTH_VERIFICATION_TOKEN_TTL_SECONDS: integerFromEnvironment.optional(),
});

const DEVELOPMENT_ORIGINS = [
  "http://127.0.0.1:20531",
  "http://localhost:20531",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
];

const TRUST_PROXY_ALIASES = new Set(["loopback", "linklocal", "uniquelocal"]);

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

function parseTrustProxy(raw: string | undefined): false | string[] {
  if (!raw?.trim() || raw.trim().toLowerCase() === "false") return false;

  const entries = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (entries.length === 0 || entries.includes("true")) {
    throw new Error(
      "AUTH_TRUST_PROXY must list explicit IP addresses, CIDRs, or safe proxy aliases.",
    );
  }

  for (const entry of entries) {
    if (TRUST_PROXY_ALIASES.has(entry)) continue;
    const [address, prefix, ...extra] = entry.split("/");
    const family = address ? isIP(address) : 0;
    if (!family || extra.length > 0) {
      throw new Error(`AUTH_TRUST_PROXY contains an invalid entry: ${entry}`);
    }
    if (prefix !== undefined) {
      const bits = Number(prefix);
      const maximum = family === 4 ? 32 : 128;
      if (!/^\d+$/.test(prefix) || bits <= 0 || bits > maximum) {
        throw new Error(`AUTH_TRUST_PROXY contains an invalid CIDR: ${entry}`);
      }
    }
  }

  return entries;
}

function validateSecret(secret: string): void {
  const bytes = Buffer.byteLength(secret, "utf8");
  const uniqueCharacters = new Set(secret).size;
  if (bytes < 32 || uniqueCharacters < 12) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 UTF-8 bytes and 12 distinct characters.",
    );
  }
}

function parseOrigins(
  raw: string | undefined,
  appOrigin: string | undefined,
  production: boolean,
): Set<string> {
  const configured = [raw, appOrigin].filter(
    (value): value is string => Boolean(value?.trim()),
  );
  const candidates = configured.length > 0
    ? configured
        .join(",")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : production
      ? []
      : DEVELOPMENT_ORIGINS;

  if (production && candidates.length === 0) {
    throw new Error(
      "AUTH_ALLOWED_ORIGINS must list at least one HTTPS application origin in production.",
    );
  }

  const origins = new Set<string>();
  for (const candidate of candidates) {
    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      throw new Error("AUTH_ALLOWED_ORIGINS contains an invalid origin.");
    }
    if (url.origin !== candidate || url.username || url.password) {
      throw new Error("AUTH_ALLOWED_ORIGINS contains an invalid origin.");
    }
    if (production && url.protocol !== "https:") {
      throw new Error(`Production auth origins must use HTTPS: ${candidate}`);
    }
    if (
      !production &&
      url.protocol === "http:" &&
      !isLoopbackHostname(url.hostname)
    ) {
      throw new Error(`Development HTTP auth origins must be loopback hosts: ${candidate}`);
    }
    origins.add(url.origin);
  }
  return origins;
}

function parseBindHost(raw: string | undefined, production: boolean): string {
  const host = raw?.trim() || (production ? "0.0.0.0" : "127.0.0.1");
  if (isIP(host)) return host;
  const normalized = host.toLowerCase();
  if (
    normalized === "localhost" ||
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      normalized,
    )
  ) {
    return normalized;
  }
  throw new Error("AUTH_BIND_HOST must be an IP address or valid hostname.");
}

function boundedSeconds(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  name: string,
): number {
  const seconds = value ?? fallback;
  if (!Number.isSafeInteger(seconds) || seconds < minimum || seconds > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return seconds;
}

export function loadAuthEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): AuthEnvironment {
  const raw = rawEnvironmentSchema.parse(source);
  const production = raw.NODE_ENV === "production";
  if (production && raw.AUTH_ENABLED === undefined) {
    throw new Error("AUTH_ENABLED must be explicitly set in production.");
  }
  const storeMode = raw.AUTH_STORE ?? (production ? "database" : "memory");
  const cookieSecure = raw.AUTH_COOKIE_SECURE ?? production;
  const allowedOrigins = parseOrigins(
    raw.AUTH_ALLOWED_ORIGINS,
    raw.APP_ORIGIN,
    production,
  );
  const bindHost = parseBindHost(raw.AUTH_BIND_HOST, production);

  if (production && storeMode !== "database") {
    throw new Error("AUTH_STORE=memory is forbidden in production.");
  }
  if (storeMode === "database" && !raw.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required when AUTH_STORE=database.");
  }
  if (production && !cookieSecure) {
    throw new Error("Secure authentication cookies are required in production.");
  }
  if (
    !production &&
    !cookieSecure &&
    [...allowedOrigins].some((origin) => {
      const url = new URL(origin);
      return url.protocol !== "http:" || !isLoopbackHostname(url.hostname);
    })
  ) {
    throw new Error(
      "AUTH_COOKIE_SECURE=true is required unless every authentication origin is loopback HTTP.",
    );
  }
  if (production && raw.AUTH_EXPOSE_DEV_TOKENS) {
    throw new Error("Development token exposure is forbidden in production.");
  }
  if (raw.AUTH_EXPOSE_DEV_TOKENS) {
    if (bindHost !== "127.0.0.1" && bindHost !== "::1") {
      throw new Error(
        "AUTH_EXPOSE_DEV_TOKENS requires AUTH_BIND_HOST to be an exact loopback IP.",
      );
    }
    if (
      [...allowedOrigins].some(
        (origin) => !isLoopbackHostname(new URL(origin).hostname),
      )
    ) {
      throw new Error(
        "AUTH_EXPOSE_DEV_TOKENS requires loopback-only application origins.",
      );
    }
  }
  if (raw.AUTH_USER_DATA_MIGRATION_READY) {
    throw new Error(
      "AUTH_USER_DATA_MIGRATION_READY cannot be enabled in this phase because legacy handlers are not ownership-scoped.",
    );
  }

  let sessionSecret = raw.SESSION_SECRET;
  let generatedDevelopmentSecret = false;
  if (!sessionSecret) {
    if (production) {
      throw new Error("SESSION_SECRET is required in production.");
    }
    sessionSecret = randomBytes(48).toString("base64url");
    generatedDevelopmentSecret = true;
  }
  validateSecret(sessionSecret);

  return {
    nodeEnv: raw.NODE_ENV,
    enabled: raw.AUTH_ENABLED ?? true,
    features: {
      registration: raw.AUTH_REGISTRATION_ENABLED ?? !production,
      passwordReset:
        raw.AUTH_PASSWORD_RESET_ENABLED ??
        (!production && raw.AUTH_EXPOSE_DEV_TOKENS),
      emailVerification:
        raw.AUTH_EMAIL_VERIFICATION_ENABLED ??
        (!production && raw.AUTH_EXPOSE_DEV_TOKENS),
    },
    sessionSecret,
    generatedDevelopmentSecret,
    storeMode,
    bindHost,
    storeOperationTimeoutMs: boundedSeconds(
      raw.AUTH_STORE_OPERATION_TIMEOUT_MS,
      8_000,
      250,
      30_000,
      "AUTH_STORE_OPERATION_TIMEOUT_MS",
    ),
    cookie: {
      name: cookieSecure ? "__Host-ytt_session" : "ytt_session",
      secure: cookieSecure,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
    allowedOrigins,
    trustProxy: parseTrustProxy(raw.AUTH_TRUST_PROXY),
    exposeDevelopmentTokens: raw.AUTH_EXPOSE_DEV_TOKENS,
    userDataMigrationReady: false,
    userDataStatus: "migration_required",
    session: {
      guestTtlMs:
        boundedSeconds(
          raw.AUTH_GUEST_SESSION_TTL_SECONDS,
          30 * 60,
          5 * 60,
          24 * 60 * 60,
          "AUTH_GUEST_SESSION_TTL_SECONDS",
        ) * 1000,
      idleTtlMs: 24 * 60 * 60 * 1000,
      absoluteTtlMs:
        boundedSeconds(
          raw.AUTH_SESSION_TTL_SECONDS,
          30 * 24 * 60 * 60,
          60 * 60,
          365 * 24 * 60 * 60,
          "AUTH_SESSION_TTL_SECONDS",
        ) * 1000,
    },
    password: {
      memoryKiB: production ? 65_536 : 32_768,
      passes: 3,
      parallelism: 4,
      tagLength: 32,
    },
    tokenTtl: {
      passwordResetMs:
        boundedSeconds(
          raw.AUTH_RESET_TOKEN_TTL_SECONDS,
          30 * 60,
          5 * 60,
          24 * 60 * 60,
          "AUTH_RESET_TOKEN_TTL_SECONDS",
        ) * 1000,
      emailVerificationMs:
        boundedSeconds(
          raw.AUTH_VERIFICATION_TOKEN_TTL_SECONDS,
          24 * 60 * 60,
          60 * 60,
          7 * 24 * 60 * 60,
          "AUTH_VERIFICATION_TOKEN_TTL_SECONDS",
        ) * 1000,
    },
  };
}
