import { Request, Response, NextFunction } from "express";
import { getTestSummary } from "../services/summary.service";

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
