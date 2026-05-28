import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getQaSource } from "@/lib/env";
import { createQaEntry, listQaEntries } from "@/lib/qa";
import type { QaEntryInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (getQaSource() === "yaml") {
    return NextResponse.json({ error: "Admin CRUD is disabled while QA_SOURCE=yaml." }, { status: 409 });
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(await listQaEntries());
}

export async function POST(request: NextRequest) {
  if (getQaSource() === "yaml") {
    return NextResponse.json({ error: "Admin CRUD is disabled while QA_SOURCE=yaml." }, { status: 409 });
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const entry = await createQaEntry((await request.json()) as QaEntryInput);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create entry." }, { status: 400 });
  }
}
