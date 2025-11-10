import { DEFAULT_PERIOD, HISTORY_PERIOD, YEAR_VALIDATION } from "../constant/history.const";
import { HistoryPeriod } from "../types/history";

/**
 * year 파라미터를 검증하고 숫자로 변환
 * @param value - Query parameter 값
 * @returns 유효한 연도 또는 현재 연도
 */
export const validateYear = (value: unknown): number => {
    const yearNum = typeof value === 'string' ? parseInt(value, 10) : undefined;
  
    const currentYear = new Date().getFullYear();
    const minYear = YEAR_VALIDATION.MIN_YEAR;
    const maxYear = currentYear + YEAR_VALIDATION.MAX_YEAR_OFFSET;
  
    if (yearNum && !isNaN(yearNum) && yearNum >= minYear && yearNum <= maxYear) {
      return yearNum;
    }
  
    return currentYear;
  };

  /**
 * period 파라미터를 검증하고 HistoryPeriod 타입으로 변환
 */
export const validatePeriod = (value?: string): HistoryPeriod => {
    if (value === String(HISTORY_PERIOD.WEEK)) return HISTORY_PERIOD.WEEK;
    if (value === String(HISTORY_PERIOD.MONTH)) return HISTORY_PERIOD.MONTH;
    if (value === 'all') return 'all';
  
    return DEFAULT_PERIOD;
  };