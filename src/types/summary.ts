// 원문, 사용자 요약 외 선택 사항
// export interface SummaryInput {
//   userId: number;
//   originalText: string;
//   originalUrl?: string | null;
//   difficultyLevel?: 1 | 2 | 3 | 4 | 5;
//   userSummary: string;
//   criticalWeakness?: string;
//   criticalOpposite?: string;
//   criticalApplication?: string;
// }

import { GeminiResponse } from './gemini';

// export interface SummaryResponse extends SummaryInput, AiSummaryResponse {
//   id: number;
//   learningNote: string | null;
//   createdAt: string;
// }

export interface CreateSummaryReqBody {
  originalText: string; // 원문 텍스트
  originalUrl?: string; // 원문 링크
  difficultyLevel?: number; // 사용자 체감 난이도
  userSummary: string; // 사용자 요약
  criticalWeakness?: string; // 비판적 읽기 : 약점
  criticalOpposite?: string; // 비판적 읽기 : 반대 의견
}

export interface InsertSummaryModel
  extends CreateSummaryReqBody,
    GeminiResponse {
  userId: number;
}
