import { Request, Response, NextFunction } from 'express';

import {
  getRecentSummary,
  getScoreAverageByUserId,
  getSummaryDetailById,
  insertSummary
} from '../models/summary.model';
import { validateSummaryInput } from '../utils/validation.util';
import { getTestSummary, saveLearningNote } from '../services/summary.service';
import { CreateSummaryReqBody } from '../types/summary';
import geminiService from '../services/gemini.service';
import { sendAuthError } from '../utils/auth.util';

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
    const { user } = req.session;
    console.log('user in createSummaryController', user);
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;
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

    // const aiSummaryResponse = await geminiService.generateContent({
    //   originalText,
    //   userSummary,
    //   criticalWeakness,
    //   criticalOpposite
    // });
    console.log('--------------------------------');
    const aiSummaryResponse = await geminiService.aiSummary(originalText);
    console.log('aiSummaryResponse', aiSummaryResponse);
    const summaryEvaluationResponse = await geminiService.summaryEvaluation(
      originalText,
      userSummary,
      aiSummaryResponse.aiSummary
    );
    console.log('--------------------------------');
    console.log('--------------------------------');
    console.log('summaryEvaluationResponse', summaryEvaluationResponse);
    console.log('--------------------------------');
    // const resultId = await insertSummary({
    //   userId,
    //   originalText,
    //   originalUrl,
    //   difficultyLevel,
    //   userSummary,
    //   criticalWeakness,
    //   criticalOpposite,
    //   ...aiSummaryResponse
    // });
    const resultId = await insertSummary({
      userId,
      originalText,
      originalUrl,
      difficultyLevel,
      userSummary,
      criticalWeakness,
      criticalOpposite,
      aiSummary: aiSummaryResponse.aiSummary,
      ...summaryEvaluationResponse
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      message: 'Summary 생성 성공',
      data: { resultId: Number(resultId) }
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

export const getSummaryDetailByIdController = async (
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
    const { id } = req.params;

    const averageScore = await getScoreAverageByUserId(userId);

    const summary = await getSummaryDetailById(Number(id));
    const returnData = {
      id: summary.id,
      originalText: summary.original_text,
      originalUrl: summary.original_url,
      userSummary: summary.user_summary,
      criticalWeakness: summary.critical_weakness,
      criticalOpposite: summary.critical_opposite,
      aiSummary: summary.ai_summary,
      similarityScore: summary.similarity_score,
      averageScore,
      aiWellUnderstood: JSON.parse(summary.ai_well_understood),
      aiMissedPoints: JSON.parse(summary.ai_missed_points),
      aiImprovements: JSON.parse(summary.ai_improvements),
      learningNote: summary.learning_note,
      createdAt: summary.created_at
    };

    if (returnData.id === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUMMARY_NOT_FOUND',
          message: 'Summary를 찾을 수 없습니다.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Summary 상세 조회 성공',
      data: returnData
    });
  } catch (error) {
    next(error);
  }
};

export const saveLearningNoteController = async (
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
    // const { id } = req.params;
    const { id, learningNote } = req.body;
    const result = await saveLearningNote(Number(id), learningNote);
    return res.status(200).json({
      success: true,
      message: 'Learning Note 저장 성공',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
