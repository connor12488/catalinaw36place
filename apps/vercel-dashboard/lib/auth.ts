import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "tenant_qa_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function base64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing SESSION_SECRET.");
  }

  return base64Url(crypto.createHmac("sha256", secret).update(value).digest());
}

function safeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    Buffer.from(
      JSON.stringify({
        iat: now,
        exp: now + SESSION_MAX_AGE_SECONDS
      })
    )
  );

  return `${payload}.${sign(payload)}`;
}

export function isSessionValid(token: string | undefined): boolean {
  if (!token || !process.env.SESSION_SECRET) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !safeEqualText(signature, sign(payload))) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as { exp?: number };
    const now = Math.floor(Date.now() / 1000);

    return typeof decoded.exp === "number" && decoded.exp > now;
  } catch {
    return false;
  }
}

export function setSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function verifyPassword(password: string): boolean {
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;

  if (!configuredHash) {
    return false;
  }

  const [scheme, iterationsText, saltText, hashText] = configuredHash.split("$");

  if (scheme !== "pbkdf2_sha256" || !iterationsText || !saltText || !hashText) {
    return false;
  }

  const iterations = Number(iterationsText);

  if (!Number.isInteger(iterations) || iterations < 100000) {
    return false;
  }

  const expected = Buffer.from(hashText, "base64");
  const salt = Buffer.from(saltText, "base64");
  const actual = crypto.pbkdf2Sync(password, salt, iterations, expected.length, "sha256");

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function isAdminRequest(request: NextRequest): boolean {
  return isSessionValid(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}
