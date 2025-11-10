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

// 요약 목록 조회 관련 타입

/**
 * 요약 목록 조회 응답 타입
 * @param id - 요약 목록 ID
 * @param userSummary - 사용자 요약
 * @param similarityScore - AI 평가 정확도 점수
 * @param createdAt - 요약 생성 일시
 */
export interface SummaryListItem {
  id: number;
  userSummary: string;
  similarityScore: number;
  createdAt: string;
}

/**
 * 페이지네이션 정보 타입
 * @param currentPage - 현재 페이지
 * @param totalPages - 전체 페이지 수
 * @param totalItems - 전체 항목 수
 * @param itemsPerPage - 페이지당 항목 수
 * @param hasNext - 다음 페이지 존재 여부
 * @param hasPrev - 이전 페이지 존재 여부
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 요약 목록 조회 응답 타입
 * @param items - 요약 목록 배열
 * @param pagination - 페이지네이션 정보
 */
export interface SummaryListResponse {
  items: SummaryListItem[];
  pagination: PaginationInfo;
}

/**
 * 요약 목록 조회 쿼리 파라미터 타입
 * @param page - 페이지 번호
 * @param limit - 페이지당 항목 수
 * @param isLatest - 최신순 여부
 * @param search - 검색어
 */
export interface GetSummariesQueryParams {
  page?: string;
  limit?: string;
  isLatest?: string;
  search?: string;
}
