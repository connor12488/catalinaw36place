#!/usr/bin/env python3
"""
Create/populate qa_entries from qa/rental-qa.yaml.
"""

from __future__ import annotations

import argparse
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
from import_yaml_qa import load_entries, upsert_entry


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply qa_entries schema and populate it from qa/rental-qa.yaml."
    )
    parser.add_argument(
        "--yaml-file",
        default="qa/rental-qa.yaml",
        help="Path to the rental Q&A YAML file. Defaults to qa/rental-qa.yaml.",
    )
    parser.add_argument(
        "--schema-file",
        default="apps/vercel-dashboard/db/001_qa_entries.sql",
        help="Path to the qa_entries schema SQL file.",
    )
    parser.add_argument(
        "--env-file",
        default=".env.local",
        help="Path to the env file with DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING.",
    )
    parser.add_argument(
        "--skip-schema",
        action="store_true",
        help="Skip applying the qa_entries schema before import.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Update existing rows with the same source_key.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate YAML and print what would happen without connecting to Postgres.",
    )
    return parser.parse_args()


def resolve_existing_path(repo_root: Path, relative_path: str, label: str) -> Path:
    path = (repo_root / relative_path).resolve()

    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}")

    return path


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]

    try:
        yaml_path = resolve_existing_path(repo_root, args.yaml_file, "YAML file")
        schema_path = resolve_existing_path(repo_root, args.schema_file, "Schema file")
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        return 2

    entries = load_entries(yaml_path)

    if args.dry_run:
        schema_action = "skip schema" if args.skip_schema else f"apply {schema_path.relative_to(repo_root)}"
        print(
            f"Validated {len(entries)} YAML Q&A entries from {yaml_path.relative_to(repo_root)}; "
            f"would {schema_action}."
        )
        return 0

    load_env_file((repo_root / args.env_file).resolve())
    changed = 0

    with psycopg.connect(get_connection_url()) as conn:
        with conn.cursor() as cur:
            if not args.skip_schema:
                cur.execute(schema_path.read_text(encoding="utf-8"))

            for entry in entries:
                if upsert_entry(cur, entry, args.overwrite):
                    changed += 1

        conn.commit()

    action = "upserted" if args.overwrite else "inserted"
    schema_action = "Skipped schema" if args.skip_schema else f"Applied schema {schema_path.relative_to(repo_root)}"
    print(f"{schema_action}. Loaded {len(entries)} YAML Q&A entries; {action} {changed} row(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
