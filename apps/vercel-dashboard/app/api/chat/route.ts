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

const LOCAL_MATCH_CONFIDENT_SCORE = 0.45;

function jsonResponse(request: Request, payload: ChatResponse, status = 200) {
  const cors = getCorsHeaders(request);
  return NextResponse.json(payload, { status, headers: cors.headers });
}

function entryKey(entry: QaEntry): string {
  return entry.sourceKey || String(entry.id);
}

function parseAiMatchId(text: string): string | null {
  const trimmed = text.trim();

  try {
    const parsed = JSON.parse(trimmed) as { id?: string | null };
    return parsed.id ? String(parsed.id) : null;
  } catch {
    const match = trimmed.match(/"id"\s*:\s*"([^"]+)"/);
    return match?.[1] || null;
  }
}

async function findAiAssistedMatch(message: string, entries: QaEntry[]): Promise<QaEntry | null> {
  if (!process.env.AI_GATEWAY_API_KEY || entries.length === 0) {
    return null;
  }

  const candidates = entries.map((entry) => ({
    id: entryKey(entry),
    question: entry.question,
    tags: entry.tags.slice(0, 12)
  }));

  try {
    const result = await generateText({
      model: getAiModel(),
      system:
        "You classify tenant rental questions. Choose only one approved Q&A id from the provided candidates. If none fit, return null. Do not answer the tenant question.",
      prompt: [
        `Tenant question: ${message}`,
        `Approved Q&A candidates: ${JSON.stringify(candidates)}`,
        'Return JSON only in this exact shape: {"id":"candidate-id"} or {"id":null}.'
      ].join("\n")
    });
    const selectedId = parseAiMatchId(result.text);

    if (!selectedId) {
      return null;
    }

    return entries.find((entry) => entryKey(entry) === selectedId) || null;
  } catch {
    return null;
  }
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

  const localMatch = findBestMatch(message, entries);
  const aiEntry =
    !localMatch || localMatch.score < LOCAL_MATCH_CONFIDENT_SCORE
      ? await findAiAssistedMatch(message, entries)
      : null;
  const match = aiEntry ? { entry: aiEntry, score: 1 } : localMatch;
  const matchMethod = aiEntry ? "ai" : match ? "local" : undefined;

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
      matchedQuestionId: entryKey(match.entry),
      matchMethod,
      escalationRecommended: true,
      escalationReason: "placeholder-answer"
    });
  }

  const answer = await rewriteApprovedAnswer(message, match.entry);

  return jsonResponse(request, {
    answer,
    matchedQuestionId: entryKey(match.entry),
    matchMethod,
    escalationRecommended: false
  });
}
