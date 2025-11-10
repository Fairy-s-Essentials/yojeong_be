// 인증 컨트롤러 - HTTP 요청/응답 처리
import { Request, Response } from 'express';
import { KakaoService } from '../services/kakao.service';
import { AuthService } from '../services/auth.service';
import { SessionUser } from '../types/session';

export class AuthController {
  /**
   * GET /api/auth/kakao
   * 카카오 로그인 시작 - 카카오 로그인 페이지로 리다이렉트
   */
  static async kakaoLogin(req: Request, res: Response): Promise<void> {
    try {
      // 카카오 로그인 페이지 URL 생성
      const kakaoAuthUrl = KakaoService.getAuthUrl();

      // 사용자를 카카오 로그인 페이지로 리다이렉트
      res.redirect(kakaoAuthUrl);
    } catch (error) {
      console.error('[인증 컨트롤러] 카카오 로그인 오류:', error);
      res.status(500).json({
        success: false,
        message: '카카오 로그인 처리 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * GET /api/auth/kakao/callback
   * 카카오 로그인 콜백 - 카카오에서 인가 코드를 받아서 로그인 처리
   */
  static async kakaoCallback(req: Request, res: Response): Promise<void> {
    try {
      // URL 쿼리에서 인가 코드 추출
      const { code } = req.query;

      // 인가 코드 검증
      if (!code || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          message: '인가 코드가 없습니다.'
        });
        return;
      }

      // 카카오 로그인 처리 (회원가입 + 로그인)
      const { user, accessToken } = await AuthService.kakaoLogin(code);

      // 세션에 사용자 정보 저장 (SessionUser 타입으로 변환)
      const sessionUser: SessionUser = {
        id: user.id!,
        kakao_id: user.kakao_id,
        nickname: user.nickname!,
        email: user.email,
        profile_image: user.profile_image
      };

      // 세션 재생성으로 새로운 세션 ID 생성 (Set-Cookie 발송)
      req.session.regenerate((err) => {
        if (err) {
          console.error('[인증 컨트롤러] 세션 재생성 오류:', err);
          return res.redirect(
            `${process.env.FRONTEND_URL}/auth/callback?success=false&error=session_failed`
          );
        }

        // 새 세션에 데이터 저장
        req.session.user = sessionUser;
        req.session.accessToken = accessToken;

        // 명시적으로 저장
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('[인증 컨트롤러] 세션 저장 오류:', saveErr);
            return res.redirect(
              `${process.env.FRONTEND_URL}/auth/callback?success=false&error=session_save_failed`
            );
          }

          // 프론트엔드 콜백 페이지로 리다이렉트
          res.redirect(
            `${process.env.FRONTEND_URL}/auth/callback?success=true`
          );
        });
      });
    } catch (error) {
      console.error('[인증 컨트롤러] 카카오 콜백 오류:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?success=false&error=login_failed`
      );
    }
  }

  /**
   * POST /api/auth/logout
   * 로그아웃 - 카카오 로그아웃 + 세션 삭제
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken } = req.session;

      // 카카오 서버에 로그아웃 요청 (accessToken이 있는 경우만)
      if (accessToken && typeof accessToken === 'string') {
        await AuthService.logout(accessToken);
      }

      // 세션 삭제
      req.session.destroy((err) => {
        if (err) {
          console.error('[인증 컨트롤러] 세션 삭제 오류:', err);
          res.status(500).json({
            success: false,
            message: '로그아웃 처리 중 오류가 발생했습니다.'
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: '로그아웃 성공'
        });
      });
    } catch (error) {
      console.error('[인증 컨트롤러] 로그아웃 오류:', error);
      res.status(500).json({
        success: false,
        message: '로그아웃 처리 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * GET /api/auth/me
   * 현재 로그인한 사용자 정보 조회
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const { user } = req.session;

      // 로그인 상태 확인
      if (!user) {
        res.status(401).json({
          success: false,
          message: '로그인이 필요합니다.'
        });
        return;
      }

      // 사용자 정보 반환
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            kakao_id: user.kakao_id,
            nickname: user.nickname,
            email: user.email,
            profile_image: user.profile_image
          }
        }
      });
    } catch (error) {
      console.error('[인증 컨트롤러] 사용자 정보 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '사용자 정보 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * DELETE /api/auth/unlink (선택적 기능)
   * 회원 탈퇴 - 카카오 연결 해제 + DB에서 삭제
   */
  static async unlink(req: Request, res: Response): Promise<void> {
    try {
      const { user, accessToken } = req.session;

      // 로그인 상태 확인
      if (!user || !accessToken) {
        res.status(401).json({
          success: false,
          message: '로그인이 필요합니다.'
        });
        return;
      }

      // 회원 탈퇴 처리
      await AuthService.unlink(accessToken, user.kakao_id);

      req.session.destroy((err) => {
        if (err) {
          console.error('[인증 컨트롤러] 세션 삭제 오류:', err);
          return res.status(500).json({
            success: false,
            message: '회원 탈퇴 처리 중 세션 삭제에 실패했습니다.'
          });
        }
        res.status(200).json({
          success: true,
          message: '회원 탈퇴가 완료되었습니다.'
        });
      });
    } catch (error) {
      console.error('[인증 컨트롤러] 회원 탈퇴 오류:', error);
      res.status(500).json({
        success: false,
        message: '회원 탈퇴 처리 중 오류가 발생했습니다.'
      });
    }
  }
}

export default AuthController;
