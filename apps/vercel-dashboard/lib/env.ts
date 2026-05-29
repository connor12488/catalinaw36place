export function getContactEmail(): string {
  return process.env.PROPERTY_CONTACT_EMAIL || "Catalina.w36thPlace@gmail.com";
}

export function getContactPhone(): string {
  return process.env.PROPERTY_CONTACT_PHONE || "(213)-222-8057";
}

export function getAiModel(): string {
  return process.env.AI_MODEL || "openai/gpt-5-mini";
}

export function getQaSource(): "yaml" | "db" {
  return process.env.QA_SOURCE?.toLowerCase() === "yaml" ? "yaml" : "db";
}

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
