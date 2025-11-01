// 원문, 사용자 요약 외 선택 사항
export interface SummaryInput {
  userId: number;
  originalText: string;
  originalUrl?: string | null;
  difficultyLevel?: 1 | 2 | 3;
  userSummary: string;
  criticalWeakness?: string;
  criticalOpposite?: string;
  criticalApplication?: string;
}

export interface AiSummaryResponse {
  aiSummary: string;
  similarityScore: number;
  aiWellUnderstood: string[];
  aiMissedPoints: string[];
  aiImprovements: string[];
}

export interface SummaryResponse extends SummaryInput, AiSummaryResponse {
  id: number;
  learningNote: string | null;
  createdAt: string;
}