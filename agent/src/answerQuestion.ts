import OpenAI from "openai";
import { getConfig, type AgentConfig } from "./config.js";
import { buildSystemPrompt } from "./systemPrompt.js";
import {
  escalationAnswer,
  findEscalationReason,
  isPlaceholderAnswer
} from "./guardrails.js";
import { matchQuestion } from "./matchQuestion.js";
import type { ChatAnswer, RentalQa } from "./types.js";

interface ResponsesClient {
  responses: {
    create(input: {
      model: string;
      instructions: string;
      input: string;
    }): Promise<{ output_text?: string | null }>;
  };
}

export interface AnswerQuestionOptions {
  config?: AgentConfig;
  openaiClient?: ResponsesClient;
}

export async function answerQuestion(
  rentalQa: RentalQa,
  message: string,
  options: AnswerQuestionOptions = {}
): Promise<ChatAnswer> {
  const config = options.config ?? getConfig();
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return {
      answer: escalationAnswer(rentalQa.property),
      escalationRecommended: true,
      escalationReason: "empty-message"
    };
  }

  const escalationReason = findEscalationReason(cleanMessage);
  if (escalationReason) {
    return {
      answer: escalationAnswer(rentalQa.property),
      escalationRecommended: true,
      escalationReason
    };
  }

  const match = matchQuestion(cleanMessage, rentalQa.qa, config.matchThreshold);

  if (!match.entry) {
    return {
      answer: escalationAnswer(rentalQa.property),
      escalationRecommended: true,
      escalationReason: "no-approved-match"
    };
  }

  if (isPlaceholderAnswer(match.entry.approvedAnswer)) {
    return {
      answer: escalationAnswer(rentalQa.property),
      matchedQuestionId: match.entry.id,
      escalationRecommended: true,
      escalationReason: "placeholder-answer"
    };
  }

  if (config.aiProvider !== "openai" || !config.openaiApiKey) {
    return {
      answer: match.entry.approvedAnswer,
      matchedQuestionId: match.entry.id,
      escalationRecommended: false
    };
  }

  const client = (options.openaiClient ?? new OpenAI({ apiKey: config.openaiApiKey })) as ResponsesClient;
  const response = await client.responses.create({
    model: config.openaiModel,
    instructions: buildSystemPrompt(rentalQa.property),
    input: [
      `Tenant question: ${cleanMessage}`,
      `Matched Q&A ID: ${match.entry.id}`,
      `Approved answer: ${match.entry.approvedAnswer}`,
      "Rewrite the approved answer into a concise tenant-facing response. Do not add facts."
    ].join("\n")
  });

  return {
    answer: response.output_text?.trim() || match.entry.approvedAnswer,
    matchedQuestionId: match.entry.id,
    escalationRecommended: false
  };
}
