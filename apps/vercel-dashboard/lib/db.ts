import postgres, { type Sql } from "postgres";

declare global {
  var __tenantQaSql: Sql | undefined;
}

export function getSql(): Sql {
  const connectionUrl = process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error("Missing DATABASE_URL. Add Neon Postgres from Vercel Marketplace or set DATABASE_URL locally.");
  }

  if (!globalThis.__tenantQaSql) {
    globalThis.__tenantQaSql = postgres(connectionUrl, {
      max: 5,
      prepare: false
    });
  }

  return globalThis.__tenantQaSql;
}
