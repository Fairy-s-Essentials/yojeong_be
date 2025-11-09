/**
 * 히스토리 기간 관련 상수
 */
export const HISTORY_PERIOD = {
  WEEK: 7,
  MONTH: 30
} as const;

/**
 * 기본 기간 설정
 */
export const DEFAULT_PERIOD = HISTORY_PERIOD.WEEK;

/**
 * 연도 검증 관련 상수
 */
export const YEAR_VALIDATION = {
  MIN_YEAR: 2025,
  MAX_YEAR_OFFSET: 10 // 현재 연도 + 10년
} as const;

/**
 * SQL INTERVAL 단위
 */
export const SQL_INTERVAL_UNIT = {
  DAY: 'DAY',
  MONTH: 'MONTH',
  YEAR: 'YEAR'
} as const;

