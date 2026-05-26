export interface ContactFallback {
  email?: string;
  phone?: string;
  message: string;
}

export interface RentalProperty {
  id: string;
  name: string;
  contactFallback: ContactFallback;
}

export interface QaEntry {
  id: string;
  category: string;
  questions: string[];
  approvedAnswer: string;
  escalateWhen?: string[];
}

export interface RentalQa {
  property: RentalProperty;
  qa: QaEntry[];
}

export interface MatchResult {
  entry?: QaEntry;
  score: number;
}

export interface ChatAnswer {
  answer: string;
  matchedQuestionId?: string;
  escalationRecommended: boolean;
  escalationReason?: string;
}

