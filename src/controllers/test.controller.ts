import { Request, Response, NextFunction } from 'express';
import geminiService from '../services/gemini.service';

export const testGeminiController = async (
  req: Request<undefined, undefined>,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body;
    console.log(input);
    const geminiResponse = await geminiService.generateContent(input);
    console.log(geminiResponse);

    return res.status(200).json({
      message: 'Gemini API 호출 성공',
      data: geminiResponse
    });
  } catch (error) {
    next(error);
  }
};
