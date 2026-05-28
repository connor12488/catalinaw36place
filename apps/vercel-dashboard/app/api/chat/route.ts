import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/cors";
import { getAiModel } from "@/lib/env";
import { checkMessageGuardrails, contactFallback } from "@/lib/guardrails";
import { findBestMatch, isPlaceholderAnswer } from "@/lib/match";
import { listRuntimeQaEntries } from "@/lib/qaSource";
import type { ChatResponse, QaEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonResponse(request: Request, payload: ChatResponse, status = 200) {
  const cors = getCorsHeaders(request);
  return NextResponse.json(payload, { status, headers: cors.headers });
}

async function rewriteApprovedAnswer(message: string, entry: QaEntry): Promise<string> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return entry.answer;
  }

  try {
    const result = await generateText({
      model: getAiModel(),
      system:
        "You answer rental property questions using only the approved answer provided by the property manager. Do not add new facts, lease terms, prices, availability, legal advice, or policy exceptions. Keep the response concise and tenant-friendly.",
      prompt: `Tenant question:\n${message}\n\nApproved Q&A question:\n${entry.question}\n\nApproved answer:\n${entry.answer}\n\nWrite the final answer using only the approved answer.`
    });

    return result.text.trim() || entry.answer;
  } catch {
    return entry.answer;
  }
}

export async function OPTIONS(request: NextRequest) {
  const cors = getCorsHeaders(request);

  if (!cors.allowed) {
    return new NextResponse(null, { status: 403, headers: cors.headers });
  }

  return new NextResponse(null, { status: 204, headers: cors.headers });
}

export async function POST(request: NextRequest) {
  const cors = getCorsHeaders(request);

  if (!cors.allowed) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403, headers: cors.headers });
  }

  let message = "";

  try {
    const body = (await request.json()) as { message?: string };
    message = String(body.message || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: cors.headers });
  }

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400, headers: cors.headers });
  }

  const guardrail = checkMessageGuardrails(message);

  if (guardrail) {
    return jsonResponse(request, {
      answer: guardrail.answer,
      matchedQuestionId: null,
      escalationRecommended: true,
      escalationReason: guardrail.escalationReason
    });
  }

  let entries: QaEntry[];

  try {
    entries = await listRuntimeQaEntries();
  } catch (error) {
    return jsonResponse(
      request,
      {
        answer: contactFallback(),
        matchedQuestionId: null,
        escalationRecommended: true,
        escalationReason: error instanceof Error ? `qa-source-unavailable: ${error.message}` : "qa-source-unavailable"
      },
      503
    );
  }

  const match = findBestMatch(message, entries);

  if (!match) {
    return jsonResponse(request, {
      answer: contactFallback(),
      matchedQuestionId: null,
      escalationRecommended: true,
      escalationReason: "no-approved-match"
    });
  }

  if (isPlaceholderAnswer(match.entry.answer)) {
    return jsonResponse(request, {
      answer: contactFallback(),
      matchedQuestionId: match.entry.sourceKey || String(match.entry.id),
      escalationRecommended: true,
      escalationReason: "placeholder-answer"
    });
  }

  const answer = await rewriteApprovedAnswer(message, match.entry);

  return jsonResponse(request, {
    answer,
    matchedQuestionId: match.entry.sourceKey || String(match.entry.id),
    escalationRecommended: false
  });
}
