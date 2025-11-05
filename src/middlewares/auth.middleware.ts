import { Request, Response, NextFunction } from 'express';

/**
 * requireAuth 미들웨어 통과 후 user와 accessToken이 반드시 존재함을 보장
 */
export type AuthenticatedRequest = Request & {
  user: NonNullable<Request['user']>;
  accessToken: NonNullable<Request['accessToken']>;
};

/**
 * 로그인 필수 미들웨어
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { user, accessToken } = req.session;

  if (!user || !accessToken) {
    res.status(401).json({
      success: false,
      message: '로그인이 필요합니다.',
    });
    return;
  }

  req.user = user;
  req.accessToken = accessToken;

  next();
}

/**
 * 선택적 인증 미들웨어
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { user, accessToken } = req.session;

  if (user && accessToken) {
    req.user = user;
    req.accessToken = accessToken;
  }

  next();
}

