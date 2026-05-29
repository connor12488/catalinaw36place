export function getAllowedOrigins(): string[] {
  return String(process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsHeaders(request: Request): { allowed: boolean; headers: HeadersInit } {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = getAllowedOrigins();
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  if (!origin) {
    return { allowed: true, headers };
  }

  if (allowedOrigins.includes("*")) {
    return {
      allowed: true,
      headers: {
        ...headers,
        "Access-Control-Allow-Origin": "*"
      }
    };
  }

  if (origin === requestOrigin || allowedOrigins.includes(origin)) {
    return {
      allowed: true,
      headers: {
        ...headers,
        "Access-Control-Allow-Origin": origin
      }
    };
  }

  return { allowed: false, headers };
}
