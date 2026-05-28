#!/usr/bin/env python3
"""
Create a simple Postgres table using Vercel-provided env vars.

Expected local env file:
  .env.local

Required connection variable, first one found wins:
  POSTGRES_URL
  DATABASE_URL
  POSTGRES_URL_NON_POOLING
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

try:
    import psycopg
    from psycopg import sql
except ImportError:
    print(
        "Missing dependency: psycopg. Install with:\n"
        "  python3 -m pip install -r scripts/requirements.txt",
        file=sys.stderr,
    )
    raise SystemExit(1)

from db_url import get_connection_url, load_env_file


DEFAULT_TABLE_NAME = "tenant_qa_smoke_test"
VALID_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def get_table_name() -> str:
    table_name = os.getenv("SAMPLE_TABLE_NAME", DEFAULT_TABLE_NAME)

    if not VALID_IDENTIFIER.match(table_name):
        raise RuntimeError(
            "SAMPLE_TABLE_NAME must be a simple SQL identifier "
            "(letters, numbers, and underscores; cannot start with a number)."
        )

    return table_name


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    load_env_file(repo_root / ".env.local")

    connection_url = get_connection_url()
    table_name = get_table_name()

    create_table_statement = sql.SQL(
        """
        CREATE TABLE IF NOT EXISTS {table_name} (
          id BIGSERIAL PRIMARY KEY,
          label TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    ).format(table_name=sql.Identifier(table_name))

    insert_statement = sql.SQL(
        """
        INSERT INTO {table_name} (label)
        VALUES (%s)
        RETURNING id, label, created_at
        """
    ).format(table_name=sql.Identifier(table_name))

    with psycopg.connect(connection_url) as conn:
        with conn.cursor() as cur:
            cur.execute(create_table_statement)
            cur.execute(insert_statement, ("Vercel Postgres smoke test",))
            row = cur.fetchone()
        conn.commit()

    if row is None:
        raise RuntimeError("Insert did not return a row.")

    print(f"Created or verified table: {table_name}")
    print(f"Inserted row: id={row[0]}, label={row[1]!r}, created_at={row[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
