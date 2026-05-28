import { getContactEmail, getContactPhone } from "@/lib/env";

export type Escalation = {
  answer: string;
  escalationRecommended: true;
  escalationReason: string;
};

export function contactFallback(): string {
  return `I do not have an approved answer for that in the property Q&A. Please contact property management for the most accurate current information. You can email ${getContactEmail()} or call ${getContactPhone()}.`;
}

function emergencyFallback(): string {
  return `If this is an emergency, call 911 or the appropriate local emergency service first. For urgent property maintenance, contact property management directly at ${getContactEmail()} or ${getContactPhone()}.`;
}

export function checkMessageGuardrails(message: string): Escalation | null {
  const normalized = message.toLowerCase();

  if (/\b(911|fire|smoke|gas leak|break in|break-in|police|ambulance|emergency|flood|sparking|electrical shock)\b/.test(normalized)) {
    return {
      answer: emergencyFallback(),
      escalationRecommended: true,
      escalationReason: "emergency"
    };
  }

  if (/\b(lawyer|legal|lawsuit|sue|evict|eviction|discrimination|fair housing|protected class)\b/.test(normalized)) {
    return {
      answer: contactFallback(),
      escalationRecommended: true,
      escalationReason: "legal-or-sensitive-topic"
    };
  }

  if (/\b(negotiate|lower the rent|discount|waive|exception|approval odds|will i be approved)\b/.test(normalized)) {
    return {
      answer: contactFallback(),
      escalationRecommended: true,
      escalationReason: "lease-or-approval-exception"
    };
  }

  if (/\b(social security|ssn|bank account|routing number|credit card|driver'?s license)\b/.test(normalized)) {
    return {
      answer: contactFallback(),
      escalationRecommended: true,
      escalationReason: "sensitive-personal-information"
    };
  }

  return null;
}
