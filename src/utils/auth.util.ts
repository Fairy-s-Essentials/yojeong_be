import { Response } from 'express';

/**
 * 인증 실패(회원이 아님) 응답을 반환하는 유틸 함수
 */
export function sendAuthError(res: Response) {
  res.status(401).json({
    success: false,
    error: {
      code: 'NOT_AUTHENTICATED',
      message: '로그인이 필요한 서비스입니다. 회원만 이용 가능합니다.'
    }
  });
}
