export interface FaqEntry {
  id: string;
  question: string;
  questionEn: string | null;
  questionSq: string | null;
  answer: string;
  answerEn: string | null;
  answerSq: string | null;
  sortOrder: number;
}

export interface UpsertFaqEntryRequest {
  question: string;
  questionEn: string | null;
  questionSq: string | null;
  answer: string;
  answerEn: string | null;
  answerSq: string | null;
  sortOrder: number;
}

export interface ContactInfo {
  instagramHandle: string;
  email: string;
  location: string;
  phoneNumbers: string[];
}

export interface UpdateContactInfoRequest {
  instagramHandle: string;
  email: string;
  location: string;
  phoneNumbers: string[];
}
