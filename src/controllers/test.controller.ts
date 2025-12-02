import { Request, Response, NextFunction } from 'express';
import geminiService from '../services/gemini.service';

export const testGeminiController = async (
  req: Request<undefined, undefined>,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body;
    const geminiResponse = await geminiService.aiSummary(input.originalText);

    return res.status(200).json({
      message: 'Gemini API 호출 성공',
      data: geminiResponse
    });
  } catch (error) {
    next(error);
  }
};
