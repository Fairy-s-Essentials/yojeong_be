import { Request, Response, NextFunction } from 'express';

import { getRecentSummary, insertSummary } from '../models/summary.model';
import { validateSummaryInput } from '../utils/validation.util';
import { getTestSummary } from '../services/summary.service';
import { CreateSummaryReqBody } from '../types/summary';
import geminiService from '../services/gemini.service';

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

export const createSummaryController = async (
  req: Request<{}, {}, CreateSummaryReqBody>,
  res: Response,
  next: NextFunction
) => {
  console.log('createSummaryController');
  try {
    const userInput = req.body;

    // 사용자 입력값 검증
    const { isValid, message } = validateSummaryInput(userInput);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력값이 올바르지 않습니다.',
          details: message
        }
      });
    }

    // userId 임시 고정
    const userId = 1;
    const {
      originalText,
      originalUrl,
      difficultyLevel,
      userSummary,
      criticalWeakness,
      criticalOpposite
    } = userInput;

    // AI 분석 포함 Summary 생성
    // const summaryData = await createSummary({
    //   userId,
    //   originalText,
    //   originalUrl,
    //   difficultyLevel,
    //   userSummary,
    //   criticalWeakness,
    //   criticalOpposite
    // });

    const aiSummaryResponse = await geminiService.generateContent({
      originalText,
      userSummary,
      criticalWeakness,
      criticalOpposite
    });

    await insertSummary({
      userId,
      originalText,
      originalUrl,
      difficultyLevel,
      userSummary,
      criticalWeakness,
      criticalOpposite,
      ...aiSummaryResponse
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      message: 'Summary 생성 성공',
      data: aiSummaryResponse
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
