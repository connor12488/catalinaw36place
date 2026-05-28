#!/usr/bin/env python3
"""
Export Postgres qa_entries back to rental-qa.yaml format.
"""

from __future__ import annotations

import argparse
import re
import shutil
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


DEFAULT_PROPERTY = {
    "id": "catalina-west-36-place",
    "name": "Catalina West 36 Place",
    "contactFallback": {
        "email": "Catalina.w36thPlace@gmail.com",
        "phone": "(213)-222-8057",
        "message": "Please contact property management for the most accurate current information.",
    },
}

QUESTION_STARTERS = (
    "are",
    "can",
    "could",
    "do",
    "does",
    "how",
    "is",
    "what",
    "what's",
    "when",
    "where",
    "which",
    "who",
    "why",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export active qa_entries rows from Postgres into rental-qa.yaml format."
    )
    parser.add_argument(
        "--output",
        default="qa/rental-qa.from-db.yaml",
        help="Output YAML path. Defaults to qa/rental-qa.from-db.yaml.",
    )
    parser.add_argument(
        "--template",
        default="qa/rental-qa.yaml",
        help="Existing YAML file used to preserve property metadata, categories, questions, and escalation notes.",
    )
    parser.add_argument(
        "--env-file",
        default=".env.local",
        help="Path to the env file with DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING.",
    )
    parser.add_argument(
        "--include-inactive",
        action="store_true",
        help="Export inactive rows too. Default exports only active rows, matching YAML runtime behavior.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow replacing an existing output file.",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create a .bak file when overwriting an existing output file.",
    )
    return parser.parse_args()


def as_text(value: Any) -> str:
    return str(value or "").strip()


def load_template(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"property": DEFAULT_PROPERTY, "qa": []}

    payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}

    if not isinstance(payload, dict):
        return {"property": DEFAULT_PROPERTY, "qa": []}

    if not isinstance(payload.get("qa"), list):
        payload["qa"] = []

    if not isinstance(payload.get("property"), dict):
        payload["property"] = DEFAULT_PROPERTY

    return payload


def template_entries_by_id(template: dict[str, Any]) -> dict[str, dict[str, Any]]:
    entries = {}

    for entry in template.get("qa") or []:
        if not isinstance(entry, dict):
            continue

        source_key = as_text(entry.get("id"))
        if source_key:
            entries[source_key] = entry

    return entries


def fetch_rows(connection_url: str, include_inactive: bool) -> list[dict[str, Any]]:
    where_clause = "" if include_inactive else "WHERE active = true"

    with psycopg.connect(connection_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT source_key, question, answer, tags, active, sort_order
                FROM qa_entries
                {where_clause}
                ORDER BY sort_order, id
                """
            )
            rows = cur.fetchall()

    return [
        {
            "source_key": row[0],
            "question": row[1],
            "answer": row[2],
            "tags": row[3] or [],
            "active": row[4],
            "sort_order": row[5],
        }
        for row in rows
    ]


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "qa-entry"


def unique_id(base_id: str, used_ids: set[str]) -> str:
    candidate = slugify(base_id)

    if candidate not in used_ids:
        used_ids.add(candidate)
        return candidate

    suffix = 2
    while f"{candidate}-{suffix}" in used_ids:
        suffix += 1

    final = f"{candidate}-{suffix}"
    used_ids.add(final)
    return final


def unique_texts(values: list[str]) -> list[str]:
    normalized = []
    seen = set()

    for value in values:
        text = as_text(value)
        key = text.lower()

        if not text or key in seen:
            continue

        normalized.append(text)
        seen.add(key)

    return normalized


def is_simple_tag(value: str) -> bool:
    return bool(re.fullmatch(r"[a-z][a-z0-9_-]{1,40}", value.strip().lower()))


def is_question(value: str) -> bool:
    text = value.strip()

    if text.endswith("?"):
        return True

    first_word = text.lower().split(" ", 1)[0] if text else ""
    return first_word in QUESTION_STARTERS


def infer_category(row: dict[str, Any], template_entry: dict[str, Any] | None) -> str:
    if template_entry:
        category = as_text(template_entry.get("category"))
        if category:
            return category

    source_key = as_text(row.get("source_key"))
    question = as_text(row.get("question"))

    for tag in row.get("tags") or []:
        text = as_text(tag)

        if not text or text == source_key or text == question or is_question(text):
            continue

        if is_simple_tag(text):
            return text

    return "general"


def build_questions(row: dict[str, Any], template_entry: dict[str, Any] | None) -> list[str]:
    questions = [as_text(row.get("question"))]

    if template_entry and isinstance(template_entry.get("questions"), list):
        questions.extend(as_text(question) for question in template_entry["questions"])

    for tag in row.get("tags") or []:
        text = as_text(tag)
        if is_question(text):
            questions.append(text)

    return unique_texts(questions)


def build_escalate_when(
    row: dict[str, Any],
    template_entry: dict[str, Any] | None,
    category: str,
    questions: list[str],
) -> list[str]:
    if template_entry and isinstance(template_entry.get("escalateWhen"), list):
        return unique_texts([as_text(rule) for rule in template_entry["escalateWhen"]])

    excluded = {as_text(row.get("source_key")).lower(), category.lower()}
    excluded.update(question.lower() for question in questions)

    inferred = []
    for tag in row.get("tags") or []:
        text = as_text(tag)

        if not text or text.lower() in excluded or is_question(text) or is_simple_tag(text):
            continue

        inferred.append(text)

    return unique_texts(inferred)


def build_yaml_entry(
    row: dict[str, Any],
    template_entry: dict[str, Any] | None,
    used_ids: set[str],
) -> dict[str, Any]:
    source_key = as_text(row.get("source_key")) or as_text(row.get("question"))
    entry_id = unique_id(source_key, used_ids)
    category = infer_category(row, template_entry)
    questions = build_questions(row, template_entry)
    escalate_when = build_escalate_when(row, template_entry, category, questions)

    entry: dict[str, Any] = {
        "id": entry_id,
        "category": category,
        "questions": questions,
        "approvedAnswer": as_text(row.get("answer")),
    }

    if escalate_when:
        entry["escalateWhen"] = escalate_when

    return entry


def write_yaml(path: Path, payload: dict[str, Any], overwrite: bool, no_backup: bool) -> None:
    if path.exists() and not overwrite:
        raise FileExistsError(f"Output file already exists: {path}. Pass --overwrite to replace it.")

    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists() and overwrite and not no_backup:
        backup_path = path.with_suffix(path.suffix + ".bak")
        shutil.copy2(path, backup_path)
        print(f"Created backup: {backup_path}")

    yaml_text = yaml.safe_dump(
        payload,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=120,
    )
    path.write_text(yaml_text, encoding="utf-8")


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    output_path = (repo_root / args.output).resolve()
    template_path = (repo_root / args.template).resolve()

    load_env_file((repo_root / args.env_file).resolve())

    template = load_template(template_path)
    existing_entries = template_entries_by_id(template)
    rows = fetch_rows(get_connection_url(), args.include_inactive)

    if not rows:
        print("No qa_entries rows found to export.", file=sys.stderr)
        return 2

    used_ids: set[str] = set()
    qa_entries = []

    for row in rows:
        source_key = as_text(row.get("source_key"))
        qa_entries.append(build_yaml_entry(row, existing_entries.get(source_key), used_ids))

    payload = {
        "property": template.get("property") or DEFAULT_PROPERTY,
        "qa": qa_entries,
    }

    try:
        write_yaml(output_path, payload, args.overwrite, args.no_backup)
    except FileExistsError as error:
        print(error, file=sys.stderr)
        return 2

    relative_output = output_path.relative_to(repo_root)
    active_note = "including inactive rows" if args.include_inactive else "active rows only"
    print(f"Exported {len(qa_entries)} Q&A entries to {relative_output} ({active_note}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
