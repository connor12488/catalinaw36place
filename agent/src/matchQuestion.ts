import type { MatchResult, QaEntry } from "./types.js";

const stopWords = new Set([
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
  "or",
  "the",
  "there",
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
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(" ")
      .map((token) => stemToken(token))
      .filter((token) => token.length > 1 && !stopWords.has(token))
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

function jaccardScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

function scoreCandidate(message: string, candidate: string): number {
  const normalizedMessage = normalize(message);
  const normalizedCandidate = normalize(candidate);

  if (normalizedMessage === normalizedCandidate) {
    return 1;
  }

  if (normalizedMessage.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedMessage)) {
    return 0.95;
  }

  return jaccardScore(tokens(normalizedMessage), tokens(normalizedCandidate));
}

export function matchQuestion(message: string, entries: QaEntry[], threshold = 0.22): MatchResult {
  let best: MatchResult = { score: 0 };

  for (const entry of entries) {
    const candidates = [
      ...entry.questions,
      entry.id.replace(/-/g, " "),
      entry.category
    ];

    const entryScore = Math.max(...candidates.map((candidate) => scoreCandidate(message, candidate)));

    if (entryScore > best.score) {
      best = { entry, score: entryScore };
    }
  }

  return best.score >= threshold ? best : { score: best.score };
}
