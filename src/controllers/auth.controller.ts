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
      console.log('[인증 컨트롤러] GET /api/auth/kakao - 카카오 로그인 시작');
      // 카카오 로그인 페이지 URL 생성
      const kakaoAuthUrl = KakaoService.getAuthUrl();

      // 사용자를 카카오 로그인 페이지로 리다이렉트
      console.log(
        '[인증 컨트롤러] 카카오 로그인 페이지로 리다이렉트:',
        kakaoAuthUrl
      );
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
      console.log(
        '[인증 컨트롤러] GET /api/auth/kakao/callback - 카카오 콜백 시작'
      );
      // URL 쿼리에서 인가 코드 추출
      const { code } = req.query;
      console.log('[인증 컨트롤러] 받은 쿼리 파라미터:', req.query);

      // 인가 코드 검증
      if (!code || typeof code !== 'string') {
        console.error('[인증 컨트롤러] 인가 코드 없음:', code);
        res.status(400).json({
          success: false,
          message: '인가 코드가 없습니다.'
        });
        return;
      }

      console.log('[인증 컨트롤러] 인가 코드 확인됨, 로그인 처리 시작');
      // 카카오 로그인 처리 (회원가입 + 로그인)
      const { user, accessToken } = await AuthService.kakaoLogin(code);
      console.log(
        '[인증 컨트롤러] 로그인 처리 완료 - user_id:',
        user.id,
        'kakao_id:',
        user.kakao_id
      );

      // 세션에 사용자 정보 저장 (SessionUser 타입으로 변환)
      const sessionUser: SessionUser = {
        id: user.id!,
        kakao_id: user.kakao_id,
        nickname: user.nickname!,
        email: user.email,
        profile_image: user.profile_image
      };

      req.session.user = sessionUser;
      req.session.accessToken = accessToken;
      console.log('[인증 컨트롤러] 세션에 사용자 정보 저장 완료');

      // 프론트엔드 콜백 페이지로 리다이렉트
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?success=true`;
      console.log('[인증 컨트롤러] 프론트엔드로 리다이렉트:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[인증 컨트롤러] 카카오 콜백 오류:', error);
      // 로그인 실패 시 프론트엔드로 리다이렉트
      const errorUrl = `${process.env.FRONTEND_URL}/auth/callback?success=false&error=login_failed`;
      console.log(
        '[인증 컨트롤러] 에러 발생, 프론트엔드로 리다이렉트:',
        errorUrl
      );
      res.redirect(errorUrl);
    }
  }

  /**
   * POST /api/auth/logout
   * 로그아웃 - 카카오 로그아웃 + 세션 삭제
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      console.log('[인증 컨트롤러] POST /api/auth/logout - 로그아웃 시작');
      const { accessToken } = req.session;

      // 카카오 서버에 로그아웃 요청 (accessToken이 있는 경우만)
      if (accessToken && typeof accessToken === 'string') {
        console.log('[인증 컨트롤러] 카카오 로그아웃 요청');
        await AuthService.logout(accessToken);
      } else {
        console.log('[인증 컨트롤러] accessToken 없음, 세션만 삭제');
      }

      // 세션 삭제
      console.log('[인증 컨트롤러] 세션 삭제 시작');
      req.session.destroy((err) => {
        if (err) {
          console.error('[인증 컨트롤러] 세션 삭제 오류:', err);
          res.status(500).json({
            success: false,
            message: '로그아웃 처리 중 오류가 발생했습니다.'
          });
          return;
        }

        console.log('[인증 컨트롤러] 로그아웃 완료');
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
      console.log('[인증 컨트롤러] GET /api/auth/me - 사용자 정보 조회');
      const { user } = req.session;

      // 로그인 상태 확인
      if (!user) {
        console.log('[인증 컨트롤러] 로그인되지 않은 상태');
        res.status(401).json({
          success: false,
          message: '로그인이 필요합니다.'
        });
        return;
      }

      console.log('[인증 컨트롤러] 사용자 정보 반환 - user_id:', user.id);
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
      console.log('[인증 컨트롤러] DELETE /api/auth/unlink - 회원 탈퇴 시작');
      const { user, accessToken } = req.session;

      // 로그인 상태 확인
      if (!user || !accessToken) {
        console.log('[인증 컨트롤러] 로그인되지 않은 상태');
        res.status(401).json({
          success: false,
          message: '로그인이 필요합니다.'
        });
        return;
      }

      console.log(
        '[인증 컨트롤러] 회원 탈퇴 처리 시작 - kakao_id:',
        user.kakao_id
      );
      // 회원 탈퇴 처리
      await AuthService.unlink(accessToken, user.kakao_id);

      console.log('[인증 컨트롤러] 세션 삭제 시작');
      req.session.destroy((err) => {
        if (err) {
          console.error('[인증 컨트롤러] 세션 삭제 오류:', err);
          return res.status(500).json({
            success: false,
            message: '회원 탈퇴 처리 중 세션 삭제에 실패했습니다.'
          });
        }
        console.log('[인증 컨트롤러] 회원 탈퇴 완료');
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
