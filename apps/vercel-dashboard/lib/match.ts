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
  "there",
  "the",
  "to",
  "what",
  "when",
  "where",
  "who",
  "with"
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/['\u2019]s\b/g, " is")
    .replace(/['\u2019]re\b/g, " are")
    .replace(/['\u2019]m\b/g, " am")
    .replace(/n['\u2019]t\b/g, " not")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(" ")
      .map((token) => stemToken(token))
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  );
}

function stemToken(token: string): string {
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

function scoreCandidate(message: string, candidate: string): number {
  const normalizedMessage = normalize(message);
  const normalizedCandidate = normalize(candidate);

  if (!normalizedCandidate) {
    return 0;
  }

  if (normalizedMessage === normalizedCandidate) {
    return 1;
  }

  if (normalizedMessage.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedMessage)) {
    return 0.95;
  }

  return jaccard(tokenize(normalizedMessage), tokenize(normalizedCandidate));
}

export function isPlaceholderAnswer(answer: string): boolean {
  const trimmed = answer.trim();

  return trimmed.startsWith("[") || /\[fill in/i.test(trimmed) || /\btbd\b/i.test(trimmed);
}

export function findBestMatch(message: string, entries: QaEntry[]): MatchResult | null {
  let best: MatchResult | null = null;

  for (const entry of entries) {
    const candidates = [
      entry.question,
      entry.sourceKey?.replace(/-/g, " "),
      ...entry.tags
    ].filter(Boolean) as string[];
    const score = Math.max(...candidates.map((candidate) => scoreCandidate(message, candidate)));

    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  return best && best.score >= 0.22 ? best : null;
}
