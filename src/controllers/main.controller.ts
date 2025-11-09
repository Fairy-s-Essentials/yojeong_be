import { Request, Response, NextFunction } from 'express';
import {
  getWeeklySummaryCountByUserId,
  getScoreAverageByUserId,
  getContinuousLearningDaysByUserId,
  getRecentSummary,
  getSummaryCountByPeriod,
  getScoreAverageByPeriod
} from '../models/summary.model';
import { HistoryPeriod } from '../types/history';

export const getMainAnalysisController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = 1;
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
    //TODO: userId는 반드시 토큰에서 추출하는것으로 변경한다.
    const userId = 1;
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
const validatePeriod = (value?: string ): HistoryPeriod => {
  if (value === '7') return 7;
  if (value === '30') return 30;
  if (value === 'all') return 'all';

  return 7;
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
    const periodParam = typeof req.query.period === 'string' ? req.query.period : '7';
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
