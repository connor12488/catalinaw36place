import cors from "cors";
import express from "express";
import { z } from "zod";
import { answerQuestion } from "./answerQuestion.js";
import { getAssistantPage } from "./assistantPage.js";
import { getConfig } from "./config.js";
import { loadRentalQa } from "./loadQa.js";
import type { RentalQa } from "./types.js";

const chatRequestSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(2000)
});

const config = getConfig();
const rentalQa = applyContactOverrides(loadRentalQa(config.qaFilePath));
const app = express();

app.use(express.json({ limit: "32kb" }));
app.use(cors({
  origin: config.allowedOrigin === "*" ? true : config.allowedOrigin
}));

app.get("/", (_req, res) => {
  res.json({
    service: "Catalina West 36 Place Tenant Q&A Agent",
    status: "ok"
  });
});

app.get("/assistant", (_req, res) => {
  res.type("html").send(getAssistantPage());
});

app.get("/api/health", async (_req, res) => {
  res.json({
    status: "ok",
    qaSource: "yaml"
  });
});

app.post("/api/chat", async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request. Provide a message string up to 2000 characters."
    });
    return;
  }

  try {
    const result = await answerQuestion(rentalQa, parsed.data.message, { config });
    res.json(result);
  } catch (error) {
    console.error("Chat request failed", error);
    res.status(500).json({
      answer: "Please contact property management for the most accurate current information.",
      escalationRecommended: true,
      escalationReason: "agent-error"
    });
  }
});

app.listen(config.port, () => {
  console.log(`Tenant Q&A agent listening on port ${config.port}`);
});

function applyContactOverrides(rentalQa: RentalQa): RentalQa {
  return {
    ...rentalQa,
    property: {
      ...rentalQa.property,
      contactFallback: {
        ...rentalQa.property.contactFallback,
        email: config.contactEmail ?? rentalQa.property.contactFallback.email,
        phone: config.contactPhone ?? rentalQa.property.contactFallback.phone
      }
    }
  };
}
