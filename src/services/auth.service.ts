// 인증 서비스 - 카카오 로그인 핵심 로직
import { KakaoService } from './kakao.service';
import { UserModel } from '../models/user.model';
import { User } from '../types/kakao';

export class AuthService {
  /**
   * 카카오 로그인 처리 (회원가입 + 로그인)
   *
   * 전체 흐름:
   * 1. 인가 코드로 카카오에서 토큰 받기
   * 2. 토큰으로 카카오에서 사용자 정보 받기
   * 3. DB에서 사용자 찾기
   * 4. 없으면 회원가입, 있으면 정보 업데이트
   * 5. 사용자 정보와 토큰 반환
   *
   * @param code - 카카오에서 받은 인가 코드
   * @returns 사용자 정보와 액세스 토큰
   */
  static async kakaoLogin(
    code: string
  ): Promise<{ user: User; accessToken: string }> {
    try {
      // 1. 인가 코드로 액세스 토큰 받기
      const tokenData = await KakaoService.getToken(code);
      const { access_token } = tokenData;

      // 2. 액세스 토큰으로 사용자 정보 받기
      const kakaoUser = await KakaoService.getUserInfo(access_token);

      // 3. DB에서 사용자 찾기 (활성 사용자만)
      let user = await UserModel.findByKakaoId(kakaoUser.id);

      // 4. 사용자 정보 준비
      const userData = {
        kakao_id: kakaoUser.id,
        email: kakaoUser.kakao_account?.email,
        nickname:
          kakaoUser.kakao_account?.profile?.nickname ||
          kakaoUser.properties?.nickname ||
          '카카오 사용자',
        profile_image:
          kakaoUser.kakao_account?.profile?.profile_image_url ||
          kakaoUser.properties?.profile_image
      };

      // 5. 사용자 상태에 따라 처리
      if (!user) {
        // 활성 사용자가 없음 - 재가입 가능 여부 확인
        const { canReJoin } =
          await UserModel.checkReJoinEligibility(kakaoUser.id);

        if (!canReJoin) {
          // 24시간이 지나지 않아 재가입 불가
          const error = new Error('탈퇴 후 24시간 동안은 재가입할 수 없습니다.');
          (error as any).code = 'REJOIN_RESTRICTED';
          throw error;
        }

        // 신규 가입 또는 재가입 (재가입 시에도 새로운 user_id로 생성)
        user = await UserModel.create(userData);
      } else {
        // 기존 활성 사용자 - 정보 업데이트 (프로필 변경 반영)
        await UserModel.update(kakaoUser.id, userData);

        // 업데이트된 정보로 user 객체 갱신
        user = {
          ...user,
          ...userData
        };
      }

      // 6. 사용자 정보와 액세스 토큰 반환
      return { user, accessToken: access_token };
    } catch (error) {
      console.error('[인증 서비스] 카카오 로그인 처리 오류:', error);
      // 원래 에러를 그대로 throw (에러 코드 유지)
      throw error;
    }
  }

  /**
   * 로그아웃 처리
   * 1. 카카오 서버에 로그아웃 요청 (토큰 무효화)
   * 2. 세션은 컨트롤러에서 삭제
   *
   * @param accessToken - 카카오 액세스 토큰
   */
  static async logout(accessToken: string): Promise<void> {
    try {
      await KakaoService.logout(accessToken);
    } catch (error) {
      console.error('[인증 서비스] 로그아웃 처리 오류:', error);
      // 로그아웃은 실패해도 세션은 삭제되므로 에러를 던지지 않음
      // 카카오 토큰 무효화 실패해도 우리 서비스에서는 로그아웃 처리
    }
  }

  /**
   * 회원 탈퇴 처리 (선택적 기능)
   * 1. 카카오 서버에 연결 해제 요청
   * 2. DB에서 사용자 소프트 삭제 (is_deleted = 1)
   *
   * @param accessToken - 카카오 액세스 토큰
   * @param kakaoId - 카카오 사용자 ID
   */
  static async unlink(accessToken: string, kakaoId: number): Promise<void> {
    try {
      // 카카오 연결 해제
      await KakaoService.unlink(accessToken);

      // DB에서 소프트 삭제
      await UserModel.softDelete(kakaoId);
    } catch (error) {
      console.error('[인증 서비스] 회원 탈퇴 처리 오류:', error);
      throw new Error('회원 탈퇴 처리 중 오류가 발생했습니다.');
    }
  }
}

export default AuthService;
