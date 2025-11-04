import { Request, Response, NextFunction } from 'express';
import {
  getWeeklySummaryCountByUserId,
  getScoreAverageByUserId,
  getContinuousLearningDaysByUserId,
  getRecentSummary
} from '../models/summary.model';

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
