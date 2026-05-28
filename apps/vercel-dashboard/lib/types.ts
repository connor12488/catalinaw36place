export type QaEntry = {
  id: number;
  sourceKey: string | null;
  question: string;
  answer: string;
  tags: string[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type QaEntryInput = {
  sourceKey?: string | null;
  question: string;
  answer: string;
  tags?: string[] | string;
  active?: boolean;
  sortOrder?: number;
};

export type ChatResponse = {
  answer: string;
  matchedQuestionId: string | null;
  escalationRecommended: boolean;
  escalationReason?: string;
};
