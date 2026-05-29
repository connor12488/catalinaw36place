import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { QaEntry } from "@/lib/types";

type YamlContactFallback = {
  email?: string;
  phone?: string;
  message?: string;
};

type YamlQaEntry = {
  id?: string;
  category?: string;
  questions?: string[];
  approvedAnswer?: string;
  escalateWhen?: string[];
};

type RentalQaYaml = {
  property?: {
    id?: string;
    name?: string;
    contactFallback?: YamlContactFallback;
  };
  qa?: YamlQaEntry[];
};

let cachedEntries: QaEntry[] | null = null;

function resolveQaPath(): string {
  const configuredPath = process.env.QA_FILE_PATH;
  const candidates = [
    configuredPath,
    path.resolve(process.cwd(), "qa/rental-qa.yaml"),
    path.resolve(process.cwd(), "../../qa/rental-qa.yaml"),
    path.resolve(process.cwd(), "../qa/rental-qa.yaml")
  ].filter(Boolean) as string[];

  const match = candidates.find((candidate) => fs.existsSync(candidate));

  if (!match) {
    throw new Error(`Unable to find rental Q&A file. Checked: ${candidates.join(", ")}`);
  }

  return match;
}

function cleanText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeYamlEntry(entry: YamlQaEntry, index: number): QaEntry {
  const sourceKey = cleanText(entry.id);
  const category = cleanText(entry.category);
  const questions = Array.isArray(entry.questions) ? entry.questions.map(cleanText).filter(Boolean) : [];
  const answer = cleanText(entry.approvedAnswer);

  if (!sourceKey || !category || questions.length === 0 || !answer) {
    throw new Error(`Invalid Q&A entry at index ${index}. Expected id, category, questions, and approvedAnswer.`);
  }

  const tags = Array.from(
    new Set([sourceKey, category, ...questions, ...(entry.escalateWhen || []).map(cleanText)].filter(Boolean))
  );

  return {
    id: index,
    sourceKey,
    question: questions[0],
    answer,
    tags,
    active: true,
    sortOrder: index * 10,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString()
  };
}

export function listYamlQaEntries(): QaEntry[] {
  if (cachedEntries) {
    return cachedEntries;
  }

  const qaPath = resolveQaPath();
  const parsed = parse(fs.readFileSync(qaPath, "utf-8")) as RentalQaYaml;
  const entries = parsed.qa;

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`No Q&A entries found in ${qaPath}.`);
  }

  cachedEntries = entries.map(normalizeYamlEntry);
  return cachedEntries;
}
