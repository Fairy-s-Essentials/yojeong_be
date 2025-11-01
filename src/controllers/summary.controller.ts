import { Request, Response, NextFunction } from "express";
import { getTestSummary, createSummary } from "../services/summary.service";

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
      message: "Summary 조회 성공",
      data: summary,
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
      criticalApplication: req.body.criticalApplication,
    });

    // 성공 응답
    return res.status(200).json({
      success: true,
      data: summaryData,
    });
  } catch (error: any) {
    // AI 서비스 에러 처리
    if (error.message === "AI_SERVICE_ERROR") {
      return res.status(500).json({
        success: false,
        error: {
          code: "AI_SERVICE_ERROR",
          message: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
      });
    }

    next(error);
  }
};