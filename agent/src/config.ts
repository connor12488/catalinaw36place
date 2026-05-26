import "dotenv/config";

export interface AgentConfig {
  port: number;
  allowedOrigin: string;
  aiProvider: string;
  openaiApiKey?: string;
  openaiModel: string;
  propertyId: string;
  qaFilePath?: string;
  contactEmail?: string;
  contactPhone?: string;
  logLevel: string;
  matchThreshold: number;
}

export function getConfig(env: NodeJS.ProcessEnv = process.env): AgentConfig {
  return {
    port: Number(env.PORT ?? 10000),
    allowedOrigin: env.ALLOWED_ORIGIN ?? "*",
    aiProvider: env.AI_PROVIDER ?? "openai",
    openaiApiKey: env.OPENAI_API_KEY ?? env.AI_API_KEY,
    openaiModel: env.OPENAI_MODEL ?? env.AI_MODEL ?? "gpt-5.4-mini",
    propertyId: env.PROPERTY_ID ?? "catalina-west-36-place",
    qaFilePath: env.QA_FILE_PATH,
    contactEmail: env.CONTACT_EMAIL,
    contactPhone: env.CONTACT_PHONE,
    logLevel: env.LOG_LEVEL ?? "info",
    matchThreshold: Number(env.MATCH_THRESHOLD ?? 0.22)
  };
}
