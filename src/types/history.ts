import { ApiResponse } from "./api";

/**
 * 히스토리 분석 기간 타입
 * 7: 최근 7일, 30: 최근 30일, "all": 전체 기간
 */
export type HistoryPeriod = 7 | 30 | 'all';

/**
 * 히스토리 분석 데이터
 * @param summaryCount - 해당 기간 동안 읽은 글 개수
 * @param averageScore - 해당 기간 동안 평균 정확도 (0~100)
 * @param consecutiveDays - 연속 학습일 (기간과 무관)
 */
export interface HistoryAnalysisData {
  summaryCount: number;
  averageScore: number;
  consecutiveDays: number;
}

/**
 * 정확도 추이 데이터 포인트
 * @param date - 날짜 (7일/30일: "YYYY-MM-DD", all: "YYYY-MM")
 * @param averageScore - 해당 기간 평균 점수
 * @param count - 해당 기간 학습 횟수
 */
export interface AccuracyDataPoint {
  date: string;
  averageScore: number;
  count: number;
}

/**
 * 정확도 추이 데이터
 * @param period - 조회 기간 (7, 30, "all")
 * @param dataPoints - 정확도 추이 데이터 포인트 배열
 */
export interface AccuracyTrendData {
  period: HistoryPeriod;
  dataPoints: AccuracyDataPoint[];
}

/**
 * 히스토리 분석 응답 타입
 */
export type HistoryAnalysisResponse = ApiResponse<HistoryAnalysisData>;

/**
 * 정확도 추이 응답 타입
 */
export type AccuracyTrendResponse = ApiResponse<AccuracyTrendData>;