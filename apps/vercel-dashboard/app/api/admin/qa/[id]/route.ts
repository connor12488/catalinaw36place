import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getQaSource } from "@/lib/env";
import { deleteQaEntry, updateQaEntry } from "@/lib/qa";
import type { QaEntryInput } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseId(value: string): number | null {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (getQaSource() === "yaml") {
    return NextResponse.json({ error: "Admin CRUD is disabled while QA_SOURCE=yaml." }, { status: 409 });
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: idText } = await context.params;
  const id = parseId(idText);

  if (!id) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }

  try {
    const entry = await updateQaEntry(id, (await request.json()) as QaEntryInput);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update entry." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (getQaSource() === "yaml") {
    return NextResponse.json({ error: "Admin CRUD is disabled while QA_SOURCE=yaml." }, { status: 409 });
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: idText } = await context.params;
  const id = parseId(idText);

  if (!id) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }

  const deleted = await deleteQaEntry(id);

  return NextResponse.json({ deleted });
}
