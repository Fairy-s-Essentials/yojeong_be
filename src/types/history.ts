/**
 * 히스토리 분석 기간 타입
 * 7: 최근 7일, 30: 최근 30일, "all": 전체 기간
 */
export type HistoryPeriod = 7 | 30 | 'all';

/**
 * 히스토리 분석 응답 타입
 */
export interface HistoryAnalysisResponse {
  success: true;
  data: {
    summaryCount: number; // 해당 기간 동안 읽은 글 개수
    averageScore: number; // 해당 기간 동안 평균 정확도 (0~100)
    consecutiveDays: number; // 연속 학습일 (기간과 무관)
  };
}