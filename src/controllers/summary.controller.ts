import { Request, Response, NextFunction } from 'express';
import { getTestSummary } from '../services/summary.service';
import { getRecentSummary } from '../models/summary.model';

export const getSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await getTestSummary();
    console.log(summary);
    return res.status(200).json({
      success: true,
      message: 'Summary 조회 성공',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('getRecentSummaryController');
  try {
    //TODO: userId는 반드시 토큰에서 추출하는것으로 변경한다.
    const userId = 1;
    const summary = await getRecentSummary(userId);
    return res.status(200).json({
      success: true,
      message: '최근 요약 조회 성공',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
