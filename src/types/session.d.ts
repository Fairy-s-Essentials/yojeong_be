// 세션 타입 확장
// express-session에 우리가 저장할 데이터 타입을 추가로 알려줌

import 'express-session';
import { User } from './kakao';

// TypeScript의 "모듈 확장" 기능
// express-session의 SessionData에 우리 필드를 추가
declare module 'express-session' {
  interface SessionData {
    user?: User; // 로그인한 사용자 정보
    accessToken?: string; // 카카오 액세스 토큰
  }
}
