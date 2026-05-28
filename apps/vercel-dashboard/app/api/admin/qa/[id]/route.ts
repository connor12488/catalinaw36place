import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getQaSource } from "@/lib/env";
import { deleteQaEntry, getQaEntry, patchQaEntry, updateQaEntry } from "@/lib/qa";
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

function qaCrudDisabledResponse() {
  return NextResponse.json({ error: "Admin CRUD is disabled while QA_SOURCE=yaml." }, { status: 409 });
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

async function requireEntryId(context: RouteContext): Promise<number | null> {
  const { id: idText } = await context.params;
  return parseId(idText);
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (getQaSource() === "yaml") {
    return qaCrudDisabledResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const id = await requireEntryId(context);

  if (!id) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }

  const entry = await getQaEntry(id);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (getQaSource() === "yaml") {
    return qaCrudDisabledResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const id = await requireEntryId(context);

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (getQaSource() === "yaml") {
    return qaCrudDisabledResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const id = await requireEntryId(context);

  if (!id) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }

  try {
    const entry = await patchQaEntry(id, (await request.json()) as Partial<QaEntryInput>);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to patch entry." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (getQaSource() === "yaml") {
    return qaCrudDisabledResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const id = await requireEntryId(context);

  if (!id) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }

  const deleted = await deleteQaEntry(id);

  return NextResponse.json({ deleted });
}
