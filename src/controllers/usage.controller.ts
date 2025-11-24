import { Request, Response, NextFunction } from 'express';
import { getUsageByUserId } from '../models/usage.model';
import { sendAuthError } from '../utils/auth.util';

export const getUsageController = async (
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
    const usage = await getUsageByUserId(userId);

    return res.status(200).json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
};
