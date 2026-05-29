#!/usr/bin/env python3
"""
Apply a SQL file using the Postgres connection string in .env.local.
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import psycopg
except ImportError:
    print(
        "Missing dependency: psycopg. Install with:\n"
        "  python3 -m pip install -r scripts/requirements.txt",
        file=sys.stderr,
    )
    raise SystemExit(1)

from db_url import get_connection_url, load_env_file


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/apply_sql.py path/to/file.sql", file=sys.stderr)
        return 2

    repo_root = Path(__file__).resolve().parents[1]
    sql_path = (repo_root / sys.argv[1]).resolve()

    if not sql_path.exists():
        print(f"SQL file not found: {sql_path}", file=sys.stderr)
        return 2

    load_env_file(repo_root / ".env.local")

    sql_text = sql_path.read_text(encoding="utf-8")

    with psycopg.connect(get_connection_url()) as conn:
        with conn.cursor() as cur:
            cur.execute(sql_text)
        conn.commit()

    print(f"Applied SQL file: {sql_path.relative_to(repo_root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
