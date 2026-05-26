import { describe, expect, it } from "vitest";
import { answerQuestion } from "../src/answerQuestion.js";
import type { AgentConfig } from "../src/config.js";
import type { RentalQa } from "../src/types.js";

const config: AgentConfig = {
  port: 10000,
  allowedOrigin: "*",
  aiProvider: "openai",
  openaiModel: "test-model",
  propertyId: "catalina-west-36-place",
  logLevel: "silent",
  matchThreshold: 0.22
};

const rentalQa: RentalQa = {
  property: {
    id: "catalina-west-36-place",
    name: "Catalina West 36 Place",
    contactFallback: {
      message: "Please contact property management."
    }
  },
  qa: [
    {
      id: "parking",
      category: "parking",
      questions: ["Is parking available?"],
      approvedAnswer: "One assigned parking space is included."
    },
    {
      id: "rent-monthly",
      category: "rent",
      questions: ["What is the monthly rent?"],
      approvedAnswer: "[Fill in approved rent amount.]"
    }
  ]
};

describe("answerQuestion", () => {
  it("returns the approved answer when no API key is configured", async () => {
    const result = await answerQuestion(rentalQa, "Is parking available?", { config });
    expect(result).toMatchObject({
      answer: "One assigned parking space is included.",
      matchedQuestionId: "parking",
      escalationRecommended: false
    });
  });

  it("escalates placeholder answers", async () => {
    const result = await answerQuestion(rentalQa, "What is the monthly rent?", { config });
    expect(result.escalationRecommended).toBe(true);
    expect(result.escalationReason).toBe("placeholder-answer");
  });

  it("escalates unknown questions", async () => {
    const result = await answerQuestion(rentalQa, "Do you have a swimming pool?", { config });
    expect(result.escalationRecommended).toBe(true);
    expect(result.escalationReason).toBe("no-approved-match");
  });
});
