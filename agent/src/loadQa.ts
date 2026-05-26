import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";
import type { RentalQa } from "./types.js";

const rentalQaSchema = z.object({
  property: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    contactFallback: z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
      message: z.string().min(1)
    })
  }),
  qa: z.array(
    z.object({
      id: z.string().min(1),
      category: z.string().min(1),
      questions: z.array(z.string().min(1)).min(1),
      approvedAnswer: z.string().min(1),
      escalateWhen: z.array(z.string()).optional()
    })
  ).min(1)
});

export function resolveQaPath(configuredPath?: string): string {
  const candidates = [
    configuredPath,
    path.resolve(process.cwd(), "qa/rental-qa.yaml"),
    path.resolve(process.cwd(), "../qa/rental-qa.yaml")
  ].filter(Boolean) as string[];

  const match = candidates.find((candidate) => fs.existsSync(candidate));

  if (!match) {
    throw new Error(`Unable to find rental Q&A file. Checked: ${candidates.join(", ")}`);
  }

  return match;
}

export function loadRentalQa(configuredPath?: string): RentalQa {
  const qaPath = resolveQaPath(configuredPath);
  const content = fs.readFileSync(qaPath, "utf8");
  const parsed = yaml.load(content);
  return rentalQaSchema.parse(parsed);
}

