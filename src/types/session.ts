import 'express-session';
import { SessionData } from 'express-session';

/**
 * 세션에 저장되는 사용자 정보 (최소한의 정보만 포함)
 */
export interface SessionUser {
  id: number;
  kakao_id: number;
  nickname: string;
  email?: string;
  profile_image?: string;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    accessToken?: string;
  }
}

/**
 * 세션에 user가 존재하는지 확인
 */
export function hasSessionUser(
  session: SessionData
): session is SessionData & { user: SessionUser };
export function hasSessionUser(
  session: SessionData
): session is SessionData & { user: SessionUser } {
  return session.user !== undefined;
}

/**
 * 세션에 accessToken이 존재하는지 확인
 */
export function hasAccessToken(
  session: SessionData
): session is SessionData & { accessToken: string } {
  return session.accessToken !== undefined;
}

/**
 * 세션에 user와 accessToken이 모두 존재하는지 확인
 */
export function isAuthenticated(
  session: SessionData
): session is SessionData & { user: SessionUser; accessToken: string } {
  return hasSessionUser(session) && hasAccessToken(session);
}