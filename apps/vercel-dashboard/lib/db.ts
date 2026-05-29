import postgres, { type Sql } from "postgres";

declare global {
  var __tenantQaSql: Sql | undefined;
}

const CONNECTION_ENV_NAMES = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"] as const;

export function getSql(): Sql {
  const connectionUrl = getConnectionUrl();

  if (!connectionUrl) {
    throw new Error(`Missing Postgres connection string. Set one of: ${CONNECTION_ENV_NAMES.join(", ")}.`);
  }

  if (!globalThis.__tenantQaSql) {
    globalThis.__tenantQaSql = postgres(connectionUrl, {
      max: 5,
      prepare: false
    });
  }

  return globalThis.__tenantQaSql;
}

function getConnectionUrl(): string | undefined {
  for (const envName of CONNECTION_ENV_NAMES) {
    const value = process.env[envName];

    if (value) {
      return value;
    }
  }

  return undefined;
}
