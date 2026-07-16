import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();
export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5_000,
      query_timeout: 8_000,
      statement_timeout: 8_000,
      lock_timeout: 5_000,
    })
  : null;

const configuredDb = pool ? drizzle(pool, { schema }) : null;
type ConfiguredDb = NonNullable<typeof configuredDb>;

export const db = new Proxy({} as ConfiguredDb, {
  get(_target, property) {
    if (!configuredDb) {
      throw new Error(
        "DATABASE_URL must be set before a database-backed operation is used.",
      );
    }
    const value = Reflect.get(configuredDb, property, configuredDb);
    return typeof value === "function" ? value.bind(configuredDb) : value;
  },
});

export * from "./schema";
