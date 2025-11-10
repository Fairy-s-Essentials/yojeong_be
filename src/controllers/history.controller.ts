import { Request, Response, NextFunction } from 'express';
import {
  getSummaryCountByPeriod,
  getScoreAverageByPeriod,
  getContinuousLearningDaysByUserId,
  getAccuracyTrendByPeriod,
  getCalendarYears,
  getCalendarByYear
} from '../models/summary.model';
import { sendAuthError } from '../utils/auth.util';
import {
  DEFAULT_PERIOD,
} from '../constant/history.const';
import { validatePeriod, validateYear } from '../utils/history.util';



/**
 * 기간별 히스토리 분석 데이터를 조회하는 컨트롤러
 */
export const getHistoryAnalysisController = async (
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

    const periodParam =
      typeof req.query.period === 'string'
        ? req.query.period
        : String(DEFAULT_PERIOD);
    const period = validatePeriod(periodParam);

    const summaryCount = await getSummaryCountByPeriod(userId, period);
    const averageScore = await getScoreAverageByPeriod(userId, period);
    const consecutiveDays = await getContinuousLearningDaysByUserId(userId);

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
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;

    const periodParam =
      typeof req.query.period === 'string'
        ? req.query.period
        : String(DEFAULT_PERIOD);
    const period = validatePeriod(periodParam);

    const dataPoints = await getAccuracyTrendByPeriod(userId, period);

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
 * 학습 기록이 존재하는 연도 목록을 조회하는 컨트롤러
 */
export const getCalendarYearsController = async (
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

    const years = await getCalendarYears(userId);

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
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;

    const yearParam = req.query.year;
    const year = validateYear(yearParam);

    const learningDays = await getCalendarByYear(userId, year);

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


