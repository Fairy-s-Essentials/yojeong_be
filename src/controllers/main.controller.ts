import { Request, Response, NextFunction } from 'express';
import {
  getWeeklySummaryCountByUserId,
  getScoreAverageByUserId,
  getContinuousLearningDaysByUserId,
  getRecentSummary,
  getSummaryCountByPeriod,
  getScoreAverageByPeriod,
  getAccuracyTrendByPeriod,
  getCalendarYears,
  getCalendarByYear
} from '../models/summary.model';
import { HistoryPeriod } from '../types/history';
import { sendAuthError } from '../utils/auth.util';
import {
  HISTORY_PERIOD,
  DEFAULT_PERIOD,
  YEAR_VALIDATION
} from '../constant/history.const';

export const getMainAnalysisController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;
    const weeklyCount = await getWeeklySummaryCountByUserId(userId);
    const averageScore = await getScoreAverageByUserId(userId);
    const consecutiveDays = await getContinuousLearningDaysByUserId(userId);
    return res.status(200).json({
      success: true,
      data: {
        weeklyCount,
        averageScore,
        consecutiveDays
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMainRecentSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('getMainRecentSummaryController');
  try {
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;
    const summary = await getRecentSummary(userId);

    const returnData = summary.map((item: any) => ({
      id: item.id,
      similarityScore: item.similarity_score,
      userSummary: item.user_summary,
      createdAt: item.created_at
    }));

    return res.status(200).json({
      success: true,
      message: '최근 요약 조회 성공',
      data: returnData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * period 파라미터를 검증하고 HistoryPeriod 타입으로 변환
 */
const validatePeriod = (value?: string): HistoryPeriod => {
  if (value === String(HISTORY_PERIOD.WEEK)) return HISTORY_PERIOD.WEEK;
  if (value === String(HISTORY_PERIOD.MONTH)) return HISTORY_PERIOD.MONTH;
  if (value === 'all') return 'all';

  return DEFAULT_PERIOD;
};

/**
 * 기간별 히스토리 분석 데이터를 조회하는 컨트롤러
 */
export const getHistoryAnalysisController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Query Parameter 추출 및 검증
    const periodParam =
      typeof req.query.period === 'string'
        ? req.query.period
        : String(DEFAULT_PERIOD);
    const period = validatePeriod(periodParam);

    // TODO: userId는 반드시 토큰에서 추출하는것으로 변경한다.
    const userId = 1;

    // Model 함수 호출
    const summaryCount = await getSummaryCountByPeriod(userId, period);
    const averageScore = await getScoreAverageByPeriod(userId, period);
    const consecutiveDays = await getContinuousLearningDaysByUserId(userId);

    // 응답 반환
    return res.status(200).json({
      success: true,
      data: {
        summaryCount,
        averageScore,
        consecutiveDays
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 기간별 정확도 추이 데이터를 조회하는 컨트롤러
 */
export const getAccuracyTrendController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Query Parameter 추출 및 검증
    const periodParam =
      typeof req.query.period === 'string'
        ? req.query.period
        : String(DEFAULT_PERIOD);
    const period = validatePeriod(periodParam);

    // TODO: userId는 반드시 토큰에서 추출하는것으로 변경한다.
    const userId = 1;

    // Model 함수 호출
    const dataPoints = await getAccuracyTrendByPeriod(userId, period);

    // 응답 반환
    return res.status(200).json({
      success: true,
      data: {
        period,
        dataPoints
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * year 파라미터를 검증하고 숫자로 변환
 * @param value - Query parameter 값
 * @returns 유효한 연도 또는 현재 연도
 */
const validateYear = (value: unknown): number => {
  // 숫자 문자열을 숫자로 변환
  const yearNum = typeof value === 'string' ? parseInt(value, 10) : undefined;

  // 유효한 연도인지 확인 (2025년 ~ 현재 연도 + 10년)
  const currentYear = new Date().getFullYear();
  const minYear = YEAR_VALIDATION.MIN_YEAR;
  const maxYear = currentYear + YEAR_VALIDATION.MAX_YEAR_OFFSET;

  if (yearNum && !isNaN(yearNum) && yearNum >= minYear && yearNum <= maxYear) {
    return yearNum;
  }

  // 기본값: 현재 연도
  return currentYear;
};

/**
 * 학습 기록이 존재하는 연도 목록을 조회하는 컨트롤러
 */
export const getCalendarYearsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: userId는 반드시 토큰에서 추출하는것으로 변경한다.
    const userId = 1;

    // Model 함수 호출
    const years = await getCalendarYears(userId);

    // 응답 반환
    return res.status(200).json({
      success: true,
      data: {
        years
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 연도의 학습 캘린더를 조회하는 컨트롤러
 */
export const getCalendarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Query Parameter 추출 및 검증
    const yearParam = req.query.year;
    const year = validateYear(yearParam);

    // TODO: userId는 반드시 토큰에서 추출하는것으로 변경한다.
    const userId = 1;

    // Model 함수 호출
    const learningDays = await getCalendarByYear(userId, year);

    // 응답 반환
    return res.status(200).json({
      success: true,
      data: {
        year,
        learningDays
      }
    });
  } catch (error) {
    next(error);
  }
};
