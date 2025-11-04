// 인증 라우터 - URL과 컨트롤러를 연결
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authRouter = Router();

/**
 * GET /api/auth/kakao
 * 카카오 로그인 시작
 * 사용자를 카카오 로그인 페이지로 리다이렉트
 */
authRouter.get('/kakao', AuthController.kakaoLogin);

/**
 * GET /api/auth/kakao/callback
 * 카카오 로그인 콜백
 * 카카오 로그인 후 자동으로 호출되는 엔드포인트
 */
authRouter.get('/kakao/callback', AuthController.kakaoCallback);

/**
 * POST /api/auth/logout
 * 로그아웃
 * 카카오 로그아웃 + 세션 삭제
 */
authRouter.post('/logout', AuthController.logout);

/**
 * GET /api/auth/me
 * 현재 로그인한 사용자 정보 조회
 */
authRouter.get('/me', AuthController.getCurrentUser);

/**
 * DELETE /api/auth/unlink
 * 회원 탈퇴 (선택적 기능)
 * 카카오 연결 해제 + DB에서 삭제
 */
authRouter.delete('/unlink', AuthController.unlink);

export default authRouter;
