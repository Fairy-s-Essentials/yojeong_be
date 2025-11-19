import { GeminiResponse } from './gemini';


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

// 평가 관련 타입

/**
 * 논리 품질 평가 등급
 */
export type LogicQuality =
  | 'EXCELLENT'
  | 'VERY_GOOD'
  | 'GOOD'
  | 'MODERATE'
  | 'WEAK'
  | 'POOR';

/**
 * 표현 정확성 평가 등급
 */
export type ExpressionAccuracy =
  | 'PERFECT'
  | 'EXCELLENT'
  | 'GOOD'
  | 'MODERATE'
  | 'WEAK'
  | 'POOR';

/**
 * 비판적 사고 반영도 평가 등급
 */
export type CriticalThinking = 'EXCELLENT' | 'GOOD' | 'WEAK' | 'NONE';

/**
 * LLM이 반환하는 평가 분석 결과 (CoT)
 * @param keyPoints - AI가 도출한 핵심 포인트 목록
 * @param userCoverage - 각 포인트의 사용자 요약 포함 여부
 * @param logicAnalysis - 논리 흐름 분석 텍스트
 * @param expressionAnalysis - 표현 정확성 분석 텍스트
 * @param criticalAnalysis - 비판적 사고 반영 분석 (선택적)
 */
export interface EvaluationAnalysis {
  keyPoints: string[]; 
  userCoverage: boolean[]; 
  logicAnalysis: string; 
  expressionAnalysis: string; 
  criticalAnalysis?: string; 
}

/**
 * LLM이 반환하는 구조화된 평가 결과
 * @param analysis - 평가 분석 결과
 * @param logicQuality - 논리 품질 평가 등급
 * @param expressionAccuracy - 표현 정확성 평가 등급
 * @param criticalThinking - 비판적 사고 반영도 평가 등급(optional)
 * @param aiWellUnderstood - AI가 이해한 핵심 포인트 목록
 * @param aiMissedPoints - AI가 놓친 핵심 포인트 목록
 * @param aiImprovements - AI가 개선할 점 목록
 */
export interface StructuredEvaluation {
  analysis: EvaluationAnalysis;
  logicQuality: LogicQuality;
  expressionAccuracy: ExpressionAccuracy;
  criticalThinking?: CriticalThinking; 
  aiWellUnderstood: string[];
  aiMissedPoints: string[];
  aiImprovements: string[];
}
