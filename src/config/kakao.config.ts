if (!process.env.KAKAO_REST_API_KEY || !process.env.KAKAO_REDIRECT_URI) {
  throw new Error('FATAL ERROR: KAKAO environment variables are not set.');
}

/**
 * 카카오 API 설정
 * @restApiKey - 카카오 REST API 키
 * @redirectUri - 카카오 리다이렉트 URI
 * @clientSecret - 카카오 클라이언트 시크릿
 * @authUrl - 카카오 인증 서버 주소
 * @apiUrl - 카카오 API 서버 주소
 */
export const kakaoConfig = {
  restApiKey: process.env.KAKAO_REST_API_KEY,
  redirectUri: process.env.KAKAO_REDIRECT_URI,
  clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
  authUrl: 'https://kauth.kakao.com',
  apiUrl: 'https://kapi.kakao.com'
};

console.log('[카카오 설정] 카카오 설정 로드됨:', {
  restApiKey: kakaoConfig.restApiKey ? '설정됨' : '없음',
  redirectUri: kakaoConfig.redirectUri,
  clientSecret: kakaoConfig.clientSecret ? '설정됨' : '없음',
  authUrl: kakaoConfig.authUrl,
  apiUrl: kakaoConfig.apiUrl
});
