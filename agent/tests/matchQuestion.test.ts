import { describe, expect, it } from "vitest";
import { matchQuestion } from "../src/matchQuestion.js";
import type { QaEntry } from "../src/types.js";

const entries: QaEntry[] = [
  {
    id: "pets",
    category: "pets",
    questions: ["Are pets allowed?", "What is the pet policy?"],
    approvedAnswer: "Cats are allowed with written approval."
  },
  {
    id: "parking",
    category: "parking",
    questions: ["Is parking available?", "Where can I park?"],
    approvedAnswer: "One assigned parking space is included."
  }
];

describe("matchQuestion", () => {
  it("matches a tenant question to the best Q&A entry", () => {
    const result = matchQuestion("Can I have a pet?", entries);
    expect(result.entry?.id).toBe("pets");
  });

  it("returns no entry below threshold", () => {
    const result = matchQuestion("What color is the roof?", entries, 0.9);
    expect(result.entry).toBeUndefined();
  });
});

