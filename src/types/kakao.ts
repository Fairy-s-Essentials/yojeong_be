// 카카오 API 응답 타입 정의
// TypeScript에게 "이런 형태의 데이터가 올 거야"라고 알려주는 것

// 1. 카카오 토큰 응답 (2단계에서 받는 데이터)
export interface KakaoTokenResponse {
  access_token: string; // 액세스 토큰 (이걸로 사용자 정보 요청)
  token_type: string; // 토큰 타입 (보통 "bearer")
  refresh_token: string; // 리프레시 토큰 (토큰 갱신용)
  expires_in: number; // 액세스 토큰 유효시간 (초 단위)
  scope?: string; // 권한 범위
  refresh_token_expires_in: number; // 리프레시 토큰 유효시간
}

// 2. 카카오 사용자 정보 응답 (3단계에서 받는 데이터)
export interface KakaoUserResponse {
  id: number; // 카카오 고유 사용자 ID
  connected_at: string; // 서비스 연결 시각
  properties?: {
    // 기본 프로필 정보
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    // 상세 계정 정보
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string; // 이메일 (사용자가 동의한 경우만)
  };
}

// 3. 우리 서비스의 사용자 타입 (DB에 저장할 형태)
export interface User {
  id?: number; // DB에서 자동 생성되는 ID
  kakao_id: number; // 카카오 고유 ID
  email?: string; // 이메일
  nickname?: string; // 닉네임
  profile_image?: string; // 프로필 이미지 URL
  created_at?: Date; // 생성 시간
  updated_at?: Date; // 수정 시간
}
