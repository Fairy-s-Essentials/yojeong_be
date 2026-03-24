import { Request, Response, NextFunction } from 'express';
import { sendAuthError } from '../utils/auth.util';
import extractService from '../services/extract.service';

export const extractController = async (
  req: Request<{}, {}, { url: string }>,
  res: Response,
  next: NextFunction
) => {
    try {
      const { user } = req.session;
      if (!user) {
        sendAuthError(res);
        return;
      }

      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'URL은 필수 입력값입니다.' }
        });
      }

      const result = await extractService.extractContentFromUrl(url);

      return res.status(200).json({
        success: true,
        data: {
          status: result.status,
          content: result.content
        }
      });
    } catch (error) {
      next(error);
    }
};
