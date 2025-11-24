import { Request, Response, NextFunction } from 'express';
import { sendAuthError } from '../utils/auth.util';
import { insertVoc } from '../models/voc.model';
import { validateVocInput } from '../utils/validation.util';

export const createVocController = async (
  req: Request<{}, {}, { message: string }>,
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
    const userInput = req.body.message;

    // 사용자 입력값 검증
    const { isValid, message } = validateVocInput(userInput);

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

    await insertVoc(userId, userInput);

    // 성공 응답
    return res.status(200).json({
      success: true,
      message: '불만 접수가 성공적으로 완료되었습니다.'
    });
  } catch (error: any) {
    next(error);
  }
};
