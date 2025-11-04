// 카카오 API 서비스 - 카카오 서버와 통신하는 함수들
import axios from 'axios';
import qs from 'qs';
import { kakaoConfig } from '../config/kakao.config';
import { KakaoTokenResponse, KakaoUserResponse } from '../types/kakao';

export class KakaoService {
  /**
   * 1단계: 카카오 로그인 페이지 URL 생성
   * 사용자를 이 URL로 리다이렉트하면 카카오 로그인 페이지로 이동
   * @returns 카카오 인증 URL
   */
  static getAuthUrl(): string {
    const params = {
      client_id: kakaoConfig.restApiKey, // REST API 키
      redirect_uri: kakaoConfig.redirectUri, // 로그인 후 돌아올 주소
      response_type: 'code', // 응답 타입 (고정값)
    };

    // URL 생성: https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...
    return `${kakaoConfig.authUrl}/oauth/authorize?${qs.stringify(params)}`;
  }

  /**
   * 2단계: 인가 코드로 액세스 토큰 받기
   * 카카오 로그인 후 받은 인가 코드를 카카오 서버에 보내서 액세스 토큰 요청
   * @param code - 카카오에서 받은 인가 코드
   * @returns 카카오 토큰 정보 (액세스 토큰, 리프레시 토큰 등)
   */
  static async getToken(code: string): Promise<KakaoTokenResponse> {
    try {
      const params = {
        grant_type: 'authorization_code', // 권한 부여 타입 (고정값)
        client_id: kakaoConfig.restApiKey, // REST API 키
        redirect_uri: kakaoConfig.redirectUri, // 리다이렉트 URI (등록한 것과 동일해야 함)
        code, // 인가 코드
        client_secret: kakaoConfig.clientSecret, // 클라이언트 시크릿 (선택)
      };

      // POST 요청으로 토큰 받기
      const response = await axios.post<KakaoTokenResponse>(
        `${kakaoConfig.authUrl}/oauth/token`,
        qs.stringify(params), // URL 인코딩 형식으로 전송
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded', // 필수 헤더
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('카카오 토큰 발급 오류:', error);
      throw new Error('카카오 토큰 발급에 실패했습니다.');
    }
  }

  /**
   * 3단계: 액세스 토큰으로 사용자 정보 가져오기
   * 액세스 토큰을 사용해서 카카오 서버에서 사용자 정보 요청
   * @param accessToken - 카카오 액세스 토큰
   * @returns 카카오 사용자 정보
   */
  static async getUserInfo(accessToken: string): Promise<KakaoUserResponse> {
    try {
      const response = await axios.get<KakaoUserResponse>(
        `${kakaoConfig.apiUrl}/v2/user/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // 액세스 토큰을 헤더에 포함
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('카카오 사용자 정보 조회 오류:', error);
      throw new Error('카카오 사용자 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 로그아웃: 카카오 서버에 로그아웃 요청
   * 액세스 토큰을 무효화함
   * @param accessToken - 카카오 액세스 토큰
   */
  static async logout(accessToken: string): Promise<void> {
    try {
      await axios.post(
        `${kakaoConfig.apiUrl}/v1/user/logout`,
        {}, // body는 빈 객체
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('카카오 로그아웃 오류:', error);
      throw new Error('카카오 로그아웃에 실패했습니다.');
    }
  }

  /**
   * 연결 해제: 카카오 서비스와의 연결 완전히 끊기
   * 사용자가 "회원 탈퇴"할 때 사용
   * @param accessToken - 카카오 액세스 토큰
   */
  static async unlink(accessToken: string): Promise<void> {
    try {
      await axios.post(
        `${kakaoConfig.apiUrl}/v1/user/unlink`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('카카오 연결 해제 오류:', error);
      throw new Error('카카오 연결 해제에 실패했습니다.');
    }
  }
}

export default KakaoService;
