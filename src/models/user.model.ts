// 사용자 모델 - 데이터베이스와 통신하는 함수들
import { pool } from '../config/db';
import { User } from '../types/kakao';
import { DbUser, DbInsertResult } from '../types/database';

export class UserModel {
  /**
   * DB 타입을 서비스 타입으로 변환
   * @todo BigInt -> int로 제거 후 id 부분 수정
   * @param dbUser - DB에서 조회한 사용자 데이터
   * @returns 서비스에서 사용할 사용자 타입
   */
  private static dbToUser(dbUser: DbUser): User {
    return {
      id: Number(dbUser.id), // BigInt -> number 변환 (세션 직렬화를 위해)
      kakao_id: Number(dbUser.kakao_id), // VARCHAR -> number 변환
      email: dbUser.email || undefined,
      nickname: dbUser.nickname,
      profile_image: dbUser.profile_image || undefined,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };
  }

  /**
   * 카카오 ID로 사용자 찾기
   * @param kakaoId - 카카오 고유 ID
   * @returns 사용자 정보 또는 null
   */
  static async findByKakaoId(kakaoId: number): Promise<User | null> {
    const conn = await pool.getConnection();
    try {
      const query = 'SELECT * FROM users WHERE kakao_id = ? AND is_deleted = 0';
      const rows = (await conn.query(query, [String(kakaoId)])) as DbUser[];

      if (!rows || rows.length === 0) {
        return null;
      }

      return this.dbToUser(rows[0]);
    } finally {
      conn.release(); // 연결 해제 (중요!)
    }
  }

  /**
   * 새 사용자 생성 (회원가입)
   * @param userData - 생성할 사용자 정보
   * @returns 생성된 사용자 정보
   */
  static async create(userData: {
    kakao_id: number;
    email?: string;
    nickname: string;
    profile_image?: string;
  }): Promise<User> {
    const conn = await pool.getConnection();
    try {
      const query = `
        INSERT INTO users (kakao_id, email, nickname, profile_image)
        VALUES (?, ?, ?, ?)
      `;

      const result = (await conn.query(query, [
        String(userData.kakao_id),
        userData.email || null,
        userData.nickname,
        userData.profile_image || null
      ])) as DbInsertResult;

      // 생성된 사용자 정보 반환
      return {
        id: Number(result.insertId),
        kakao_id: userData.kakao_id,
        email: userData.email,
        nickname: userData.nickname,
        profile_image: userData.profile_image
      };
    } finally {
      conn.release();
    }
  }

  /**
   * 사용자 정보 업데이트
   * @param kakaoId - 카카오 고유 ID
   * @param userData - 업데이트할 사용자 정보
   */
  static async update(
    kakaoId: number,
    userData: {
      email?: string;
      nickname?: string;
      profile_image?: string;
    }
  ): Promise<void> {
    const conn = await pool.getConnection();
    try {
      const query = `
        UPDATE users
        SET email = ?, nickname = ?, profile_image = ?
        WHERE kakao_id = ? AND is_deleted = 0
      `;

      await conn.query(query, [
        userData.email || null,
        userData.nickname || null,
        userData.profile_image || null,
        String(kakaoId)
      ]);
    } finally {
      conn.release();
    }
  }

  /**
   * ID로 사용자 찾기 (선택적 기능)
   * @param id - 사용자 DB ID
   * @returns 사용자 정보 또는 null
   */
  static async findById(id: number): Promise<User | null> {
    const conn = await pool.getConnection();
    try {
      const query = 'SELECT * FROM users WHERE id = ? AND is_deleted = 0';
      const rows = (await conn.query(query, [id])) as DbUser[];

      if (!rows || rows.length === 0) {
        return null;
      }

      return this.dbToUser(rows[0]);
    } finally {
      conn.release();
    }
  }

  /**
   * 사용자 소프트 삭제 (회원 탈퇴)
   * - 사용자 테이블: is_deleted = 1로 소프트 삭제
   * - 관련 데이터: 그대로 유지 (summaries, vocs, usages)
   * - updated_at은 자동으로 현재 시간으로 업데이트됨 (재가입 제한 체크용)
   * @param kakaoId - 카카오 고유 ID
   */
  static async softDelete(kakaoId: number): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // user_id 조회
      const userQuery =
        'SELECT id FROM users WHERE kakao_id = ? AND is_deleted = 0';
      const userRows = (await conn.query(userQuery, [
        String(kakaoId)
      ])) as DbUser[];

      if (!userRows || userRows.length === 0) {
        throw new Error('탈퇴할 사용자를 찾을 수 없습니다.');
      }

      // 사용자 소프트 삭제 (updated_at은 자동으로 갱신됨)
      await conn.query(
        'UPDATE users SET is_deleted = 1 WHERE kakao_id = ? AND is_deleted = 0',
        [String(kakaoId)]
      );

      await conn.commit();
    } catch (error) {
      // 에러 발생 시 롤백
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 재가입 가능 여부 확인
   * - 같은 kakao_id로 탈퇴한 기록이 있는지 확인
   * - 가장 최근 탈퇴 시간으로부터 24시간이 지났는지 확인
   * @param kakaoId - 카카오 고유 ID
   * @returns 재가입 가능 여부
   */
  static async checkReJoinEligibility(
    kakaoId: number
  ): Promise<{ canReJoin: boolean }> {
    const conn = await pool.getConnection();
    try {
      const query = `
        SELECT updated_at
        FROM users
        WHERE kakao_id = ? AND is_deleted = 1
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      const rows = (await conn.query(query, [String(kakaoId)])) as DbUser[];

      if (!rows || rows.length === 0) {
        // 탈퇴 기록 없음 - 가입 가능
        return { canReJoin: true };
      }

      const lastWithdrawTime = new Date(rows[0].updated_at);
      const now = new Date();
      
      const timeDiffInMs = now.getTime() - lastWithdrawTime.getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

      return { canReJoin: timeDiffInMs >= oneDayInMs };
    } finally {
      conn.release();
    }
  }

}

export default UserModel;
