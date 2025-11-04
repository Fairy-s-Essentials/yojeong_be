// 카카오 API 설정
// 환경변수에서 카카오 관련 설정을 가져와서 한 곳에 모아둠

export const kakaoConfig = {
  // REST API 키
  restApiKey: process.env.KAKAO_REST_API_KEY || '',

  // 리다이렉트 URI (카카오 로그인 후 돌아올 주소)
  redirectUri: process.env.KAKAO_REDIRECT_URI || '',

  // 클라이언트 시크릿 (선택사항)
  clientSecret: process.env.KAKAO_CLIENT_SECRET || '',

  // 카카오 인증 서버 주소 (토큰 받는 곳)
  authUrl: 'https://kauth.kakao.com',

  // 카카오 API 서버 주소 (사용자 정보 받는 곳)
  apiUrl: 'https://kapi.kakao.com',
};
