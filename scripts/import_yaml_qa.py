#!/usr/bin/env python3
"""
Import the existing Render YAML Q&A into the Vercel Postgres qa_entries table.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

try:
    import psycopg
except ImportError:
    print(
        "Missing dependency: psycopg. Install with:\n"
        "  python3 -m pip install -r scripts/requirements.txt",
        file=sys.stderr,
    )
    raise SystemExit(1)

try:
    import yaml
except ImportError:
    print(
        "Missing dependency: PyYAML. Install with:\n"
        "  python3 -m pip install -r scripts/requirements.txt",
        file=sys.stderr,
    )
    raise SystemExit(1)

from db_url import get_connection_url, load_env_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import qa/rental-qa.yaml into the Vercel qa_entries table."
    )
    parser.add_argument(
        "yaml_file",
        nargs="?",
        default="qa/rental-qa.yaml",
        help="Path to the rental Q&A YAML file. Defaults to qa/rental-qa.yaml.",
    )
    parser.add_argument(
        "--env-file",
        default=".env.local",
        help="Path to the env file with DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Update existing rows that have the same source_key. By default, existing rows are left unchanged.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate the YAML file and print how many rows would be imported without connecting to Postgres.",
    )
    return parser.parse_args()


def as_text(value: Any) -> str:
    return str(value or "").strip()


def normalize_tags(entry: dict[str, Any]) -> list[str]:
    tags = [
        as_text(entry.get("id")),
        as_text(entry.get("category")),
    ]
    tags.extend(as_text(question) for question in entry.get("questions") or [])
    tags.extend(as_text(rule) for rule in entry.get("escalateWhen") or [])

    normalized = []
    seen = set()

    for tag in tags:
        if not tag:
            continue
        key = tag.lower()
        if key in seen:
            continue
        normalized.append(tag)
        seen.add(key)

    return normalized


def load_entries(path: Path) -> list[dict[str, Any]]:
    payload = yaml.safe_load(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict) or not isinstance(payload.get("qa"), list):
        raise ValueError("YAML file must contain a top-level qa list.")

    imported_entries = []

    for index, entry in enumerate(payload["qa"], start=1):
        if not isinstance(entry, dict):
            continue

        questions = entry.get("questions") or []
        first_question = as_text(questions[0] if questions else entry.get("id"))
        answer = as_text(entry.get("approvedAnswer"))
        source_key = as_text(entry.get("id"))

        if not source_key or not first_question or not answer:
            raise ValueError(f"Q&A item #{index} is missing id, question, or approvedAnswer.")

        imported_entries.append(
            {
                "source_key": source_key,
                "question": first_question,
                "answer": answer,
                "tags": normalize_tags(entry),
                "active": True,
                "sort_order": index * 10,
            }
        )

    return imported_entries


def upsert_entry(cur: psycopg.Cursor, entry: dict[str, Any], overwrite: bool) -> bool:
    if overwrite:
        cur.execute(
            """
            INSERT INTO qa_entries (source_key, question, answer, tags, active, sort_order)
            VALUES (%s, %s, %s, %s::text[], %s, %s)
            ON CONFLICT (source_key) DO UPDATE SET
              question = EXCLUDED.question,
              answer = EXCLUDED.answer,
              tags = EXCLUDED.tags,
              active = EXCLUDED.active,
              sort_order = EXCLUDED.sort_order
            RETURNING id
            """,
            (
                entry["source_key"],
                entry["question"],
                entry["answer"],
                entry["tags"],
                entry["active"],
                entry["sort_order"],
            ),
        )
    else:
        cur.execute(
            """
            INSERT INTO qa_entries (source_key, question, answer, tags, active, sort_order)
            VALUES (%s, %s, %s, %s::text[], %s, %s)
            ON CONFLICT (source_key) DO NOTHING
            RETURNING id
            """,
            (
                entry["source_key"],
                entry["question"],
                entry["answer"],
                entry["tags"],
                entry["active"],
                entry["sort_order"],
            ),
        )

    return cur.fetchone() is not None


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    yaml_path = (repo_root / args.yaml_file).resolve()
    env_path = (repo_root / args.env_file).resolve()

    if not yaml_path.exists():
        print(f"YAML file not found: {yaml_path}", file=sys.stderr)
        return 2

    load_env_file(env_path)
    entries = load_entries(yaml_path)

    if args.dry_run:
        print(f"Validated {len(entries)} YAML Q&A entries from {yaml_path.relative_to(repo_root)}.")
        return 0

    changed = 0

    with psycopg.connect(get_connection_url()) as conn:
        with conn.cursor() as cur:
            for entry in entries:
                if upsert_entry(cur, entry, args.overwrite):
                    changed += 1
        conn.commit()

    action = "upserted" if args.overwrite else "inserted"
    print(f"Loaded {len(entries)} YAML Q&A entries; {action} {changed} row(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
