import { getSql } from "@/lib/db";
import type { QaEntry, QaEntryInput } from "@/lib/types";

type QaRow = {
  id: number | string;
  source_key: string | null;
  question: string;
  answer: string;
  tags: string[] | null;
  active: boolean;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: QaRow): QaEntry {
  return {
    id: Number(row.id),
    sourceKey: row.source_key,
    question: row.question,
    answer: row.answer,
    tags: row.tags || [],
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

export function normalizeTags(tags: QaEntryInput["tags"]): string[] {
  const rawTags = Array.isArray(tags) ? tags : String(tags || "").split(",");
  const normalized = rawTags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

function cleanText(value: unknown): string {
  return String(value || "").trim();
}

type NormalizedQaEntryInput = {
  sourceKey: string | null;
  question: string;
  answer: string;
  tags: string[];
  active: boolean;
  sortOrder: number;
};

function normalizeInput(input: QaEntryInput): NormalizedQaEntryInput {
  const question = cleanText(input.question);
  const answer = cleanText(input.answer);
  const sourceKey = input.sourceKey ? cleanText(input.sourceKey) : null;

  if (!question) {
    throw new Error("Question is required.");
  }

  if (!answer) {
    throw new Error("Answer is required.");
  }

  return {
    sourceKey,
    question,
    answer,
    tags: normalizeTags(input.tags),
    active: input.active !== false,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0
  };
}

export async function listQaEntries(): Promise<QaEntry[]> {
  const sql = getSql();
  const rows = await sql<QaRow[]>`
    SELECT id, source_key, question, answer, tags, active, sort_order, created_at, updated_at
    FROM qa_entries
    ORDER BY sort_order ASC, id ASC
  `;

  return rows.map(mapRow);
}

export async function listActiveQaEntries(): Promise<QaEntry[]> {
  const sql = getSql();
  const rows = await sql<QaRow[]>`
    SELECT id, source_key, question, answer, tags, active, sort_order, created_at, updated_at
    FROM qa_entries
    WHERE active = true
    ORDER BY sort_order ASC, id ASC
  `;

  return rows.map(mapRow);
}

export async function createQaEntry(input: QaEntryInput): Promise<QaEntry> {
  const data = normalizeInput(input);
  const sql = getSql();
  const rows = await sql<QaRow[]>`
    INSERT INTO qa_entries (source_key, question, answer, tags, active, sort_order)
    VALUES (${data.sourceKey}, ${data.question}, ${data.answer}, ${sql.array(data.tags, "text")}, ${data.active}, ${data.sortOrder})
    RETURNING id, source_key, question, answer, tags, active, sort_order, created_at, updated_at
  `;

  return mapRow(rows[0]);
}

export async function updateQaEntry(id: number, input: QaEntryInput): Promise<QaEntry | null> {
  const data = normalizeInput(input);
  const sql = getSql();
  const rows = await sql<QaRow[]>`
    UPDATE qa_entries
    SET
      question = ${data.question},
      answer = ${data.answer},
      tags = ${sql.array(data.tags, "text")},
      active = ${data.active},
      sort_order = ${data.sortOrder}
    WHERE id = ${id}
    RETURNING id, source_key, question, answer, tags, active, sort_order, created_at, updated_at
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteQaEntry(id: number): Promise<boolean> {
  const sql = getSql();
  const rows = await sql<{ id: number | string }[]>`
    DELETE FROM qa_entries
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}
