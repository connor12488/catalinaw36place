import { describe, expect, it } from "vitest";
import { findEscalationReason, isPlaceholderAnswer } from "../src/guardrails.js";

describe("guardrails", () => {
  it("escalates legal questions", () => {
    expect(findEscalationReason("Can I break my lease legally?")).toBe("legal-advice");
  });

  it("escalates negotiation questions", () => {
    expect(findEscalationReason("Can you lower the rent?")).toBe("negotiation");
  });

  it("detects placeholder answers", () => {
    expect(isPlaceholderAnswer("[Fill in approved rent amount.]")).toBe(true);
    expect(isPlaceholderAnswer("Rent is due on the first day of each month.")).toBe(false);
  });
});

