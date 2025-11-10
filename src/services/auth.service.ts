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
      console.log('[인증 서비스] kakaoLogin 시작 - code:', code);

      // 1. 인가 코드로 액세스 토큰 받기
      console.log('[인증 서비스] 1단계: 토큰 발급 요청');
      const tokenData = await KakaoService.getToken(code);
      const { access_token } = tokenData;
      console.log(
        '[인증 서비스] 토큰 발급 완료 - access_token:',
        access_token ? '있음' : '없음'
      );

      // 2. 액세스 토큰으로 사용자 정보 받기
      console.log('[인증 서비스] 2단계: 사용자 정보 조회 요청');
      const kakaoUser = await KakaoService.getUserInfo(access_token);
      console.log(
        '[인증 서비스] 사용자 정보 조회 완료 - kakao_id:',
        kakaoUser.id
      );

      // 3. DB에서 사용자 찾기
      console.log(
        '[인증 서비스] 3단계: DB에서 사용자 조회 - kakao_id:',
        kakaoUser.id
      );
      let user = await UserModel.findByKakaoId(kakaoUser.id);
      console.log(
        '[인증 서비스] DB 조회 결과:',
        user ? '기존 사용자' : '신규 사용자'
      );

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
      console.log('[인증 서비스] 4단계: 사용자 데이터 준비 완료:', userData);

      // 5. 신규 사용자면 회원가입, 기존 사용자면 정보 업데이트
      if (!user) {
        // 신규 사용자 - 회원가입
        console.log('[인증 서비스] 5단계: 신규 사용자 회원가입 시작');
        user = await UserModel.create(userData);
        console.log('[인증 서비스] 회원가입 완료 - user_id:', user.id);
      } else {
        // 기존 사용자 - 정보 업데이트 (프로필 변경 반영)
        console.log('[인증 서비스] 5단계: 기존 사용자 정보 업데이트 시작');
        await UserModel.update(kakaoUser.id, userData);

        // 업데이트된 정보로 user 객체 갱신
        user = {
          ...user,
          ...userData
        };
        console.log('[인증 서비스] 정보 업데이트 완료');
      }

      // 6. 사용자 정보와 액세스 토큰 반환
      console.log('[인증 서비스] kakaoLogin 완료 - 사용자 정보 반환');
      return { user, accessToken: access_token };
    } catch (error) {
      console.error('[인증 서비스] 카카오 로그인 처리 오류:', error);
      throw new Error('카카오 로그인 처리 중 오류가 발생했습니다.');
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
      console.log(
        '[인증 서비스] logout 시작 - accessToken:',
        accessToken ? '있음' : '없음'
      );
      await KakaoService.logout(accessToken);
      console.log('[인증 서비스] logout 완료');
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
      console.log('[인증 서비스] unlink 시작 - kakaoId:', kakaoId);
      // 카카오 연결 해제
      await KakaoService.unlink(accessToken);

      // TODO: DB에서 소프트 삭제 구현 필요
      // UserModel.softDelete(kakaoId) 같은 함수 추가
      console.log('[인증 서비스] 회원 탈퇴 처리 필요:', kakaoId);
    } catch (error) {
      console.error('[인증 서비스] 회원 탈퇴 처리 오류:', error);
      throw new Error('회원 탈퇴 처리 중 오류가 발생했습니다.');
    }
  }
}

export default AuthService;
