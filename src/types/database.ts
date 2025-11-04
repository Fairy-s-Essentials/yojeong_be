// 데이터베이스 타입 정의
// DB 테이블 스키마와 일치하는 타입들

/**
 * users 테이블 타입 (DB에서 조회한 원본 데이터)
 */
export interface DbUser {
  id: number;
  kakao_id: string; // DB는 VARCHAR로 저장
  nickname: string;
  profile_image: string | null;
  email: string | null;
  refresh_token: string | null;
  token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: number; // tinyint(1) -> 0 또는 1
}

/**
 * INSERT/UPDATE 쿼리 실행 결과
 */
export interface DbInsertResult {
  affectedRows: number;
  insertId: number | bigint;
  warningStatus: number;
}

/**
 * UPDATE/DELETE 쿼리 실행 결과
 */
export interface DbUpdateResult {
  affectedRows: number;
  insertId: number;
  warningStatus: number;
}
