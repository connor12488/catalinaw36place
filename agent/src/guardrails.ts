import type { RentalProperty } from "./types.js";

const legalTerms = [
  "legal advice",
  "sue",
  "lawsuit",
  "evict",
  "eviction",
  "tenant rights",
  "lawyer",
  "attorney",
  "withhold rent",
  "break my lease"
];

const negotiationTerms = [
  "negotiate",
  "lower the rent",
  "discount",
  "waive",
  "exception",
  "deal on rent"
];

const sensitiveInfoPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b\d{9}\b/,
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
];

const protectedClassTerms = [
  "children allowed",
  "kids allowed",
  "families allowed",
  "race",
  "religion",
  "nationality",
  "disability",
  "disabled",
  "service animal",
  "assistance animal",
  "emotional support animal"
];

export function findEscalationReason(message: string): string | undefined {
  const normalized = message.toLowerCase();

  if (legalTerms.some((term) => normalized.includes(term))) {
    return "legal-advice";
  }

  if (negotiationTerms.some((term) => normalized.includes(term))) {
    return "negotiation";
  }

  if (protectedClassTerms.some((term) => normalized.includes(term))) {
    return "fair-housing-sensitive";
  }

  if (sensitiveInfoPatterns.some((pattern) => pattern.test(message))) {
    return "sensitive-personal-information";
  }

  if (normalized.includes("emergency") || normalized.includes("urgent")) {
    return "emergency";
  }

  return undefined;
}

export function isPlaceholderAnswer(answer: string): boolean {
  const normalized = answer.trim().toLowerCase();
  return (
    normalized.startsWith("[") ||
    normalized.includes("fill in") ||
    normalized.includes("placeholder") ||
    normalized.includes("tbd") ||
    normalized.includes("replace-with")
  );
}

export function contactFallbackText(property: RentalProperty): string {
  const fallback = property.contactFallback;
  const message = fallback.message || "Please contact property management for the most accurate current information.";
  const contactParts = [
    fallback.email && !isPlaceholderAnswer(fallback.email) ? `email ${fallback.email}` : undefined,
    fallback.phone && !isPlaceholderAnswer(fallback.phone) ? `call ${fallback.phone}` : undefined
  ].filter(Boolean);

  if (contactParts.length === 0) {
    return message;
  }

  return `${message} You can ${contactParts.join(" or ")}.`;
}

export function escalationAnswer(property: RentalProperty): string {
  return `I do not have an approved answer for that in the property Q&A. ${contactFallbackText(property)}`;
}

