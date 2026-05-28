import type { QaEntry } from "@/lib/types";

type MatchResult = {
  entry: QaEntry;
  score: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "how",
  "i",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "when",
  "where",
  "with"
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  );
}

function jaccard(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]);

  if (union.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  return intersection / union.size;
}

export function isPlaceholderAnswer(answer: string): boolean {
  const trimmed = answer.trim();

  return trimmed.startsWith("[") || /\[fill in/i.test(trimmed) || /\btbd\b/i.test(trimmed);
}

export function findBestMatch(message: string, entries: QaEntry[]): MatchResult | null {
  const normalizedMessage = normalize(message);
  const messageTokens = tokenize(message);
  let best: MatchResult | null = null;

  for (const entry of entries) {
    const searchable = `${entry.question} ${entry.tags.join(" ")}`;
    const normalizedSearchable = normalize(searchable);
    const searchableTokens = tokenize(searchable);
    let score = jaccard(messageTokens, searchableTokens);

    if (normalizedMessage === normalize(entry.question)) {
      score += 0.65;
    } else if (normalizedSearchable.includes(normalizedMessage) || normalizedMessage.includes(normalize(entry.question))) {
      score += 0.35;
    }

    if (entry.tags.some((tag) => normalizedMessage.includes(normalize(tag)))) {
      score += 0.12;
    }

    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  return best && best.score >= 0.2 ? best : null;
}
