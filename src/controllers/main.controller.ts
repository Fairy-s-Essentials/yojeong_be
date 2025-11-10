import { Request, Response, NextFunction } from 'express';
import {
  getWeeklySummaryCountByUserId,
  getScoreAverageByUserId,
  getContinuousLearningDaysByUserId,
  getRecentSummary
} from '../models/summary.model';
import { sendAuthError } from '../utils/auth.util';

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

    type RecentSummaryRow = {
      id: number;
      similarity_score: number;
      user_summary: string;
      created_at: Date | string;
    };

    const returnData = (summary as RecentSummaryRow[]).map((item) => ({
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
