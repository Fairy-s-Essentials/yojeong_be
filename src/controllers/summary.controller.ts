import { Request, Response, NextFunction } from 'express';

import { getRecentSummary } from '../models/summary.model';
import { validateSummaryInput } from '../utils/validation.util';
import { getTestSummary, createSummary } from '../services/summary.service';


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

export const createSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 사용자 입력값 검증
    const { isValid, errors } = validateSummaryInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력값이 올바르지 않습니다.',
          details: errors
        }
      });
    }

    // userId 임시 고정
    const userId = 1;

    // AI 분석 포함 Summary 생성
    const summaryData = await createSummary({
      userId,
      originalText: req.body.originalText,
      originalUrl: req.body.originalUrl,
      difficultyLevel: req.body.difficultyLevel,
      userSummary: req.body.userSummary,
      criticalWeakness: req.body.criticalWeakness,
      criticalOpposite: req.body.criticalOpposite,
      criticalApplication: req.body.criticalApplication
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      data: summaryData
    });
  } catch (error: any) {
    // AI 서비스 에러 처리
    if (error.message === 'AI_SERVICE_ERROR') {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
      });
    }

    next(error);
  }
};
