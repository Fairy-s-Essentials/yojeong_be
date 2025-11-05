
/**
 * 카카오 토큰 발급 응답
 * @access_token - 액세스 토큰
 * @token_type - 토큰 타입
 * @refresh_token - 리프레시 토큰
 * @expires_in - 액세스 토큰 유효시간
 * @scope - 권한 범위
 * @refresh_token_expires_in - 리프레시 토큰 유효시간
 */
export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  refresh_token_expires_in: number;
}

/**
 * 카카오 사용자 정보 응답
 * @id - 카카오 고유 사용자 ID
 * @connected_at - 서비스 연결 시각
 * @properties - 기본 프로필 정보
 * @kakao_account - 상세 계정 정보
 */
export interface KakaoUserResponse {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
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
    email?: string;
  };
}

/**
 * 서비스 사용자 타입
 * @id - 서비스 사용자 ID
 * @kakao_id - 카카오 고유 사용자 ID
 * @email - 이메일
 * @nickname - 닉네임
 * @profile_image - 프로필 이미지 URL
 * @created_at - 생성 시간
 * @updated_at - 수정 시간
 */
export interface User {
  id?: number;
  kakao_id: number;
  email?: string;
  nickname?: string;
  profile_image?: string;
  created_at?: Date;
  updated_at?: Date;
}
