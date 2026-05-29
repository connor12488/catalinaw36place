import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

function wantsJson(request: NextRequest): boolean {
  return request.headers.get("content-type")?.includes("application/json") || request.headers.get("accept")?.includes("application/json") || false;
}

export async function POST(request: NextRequest) {
  const jsonRequest = wantsJson(request);
  const password = jsonRequest ? String(((await request.json()) as { password?: string }).password || "") : String((await request.formData()).get("password") || "");

  if (!verifyPassword(password)) {
    if (jsonRequest) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  const response = jsonRequest ? NextResponse.json({ ok: true }) : NextResponse.redirect(new URL("/dashboard", request.url), 303);

  try {
    setSessionCookie(response);
  } catch (error) {
    if (jsonRequest) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.redirect(new URL("/login?error=config", request.url), 303);
  }

  return response;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create admin session.";
}
