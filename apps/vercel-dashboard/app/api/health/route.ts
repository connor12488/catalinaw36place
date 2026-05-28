import { NextResponse } from "next/server";
import { getQaSource } from "@/lib/env";
import { listRuntimeQaEntries } from "@/lib/qaSource";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const qaSource = getQaSource();

  try {
    const entries = await listRuntimeQaEntries();

    return NextResponse.json({
      status: "ok",
      runtime: "vercel",
      qaSource,
      qaCount: entries.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        runtime: "vercel",
        qaSource,
        error: error instanceof Error ? error.message : "Unable to load Q&A source."
      },
      { status: 500 }
    );
  }
}
