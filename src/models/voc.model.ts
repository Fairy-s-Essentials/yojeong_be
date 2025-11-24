import { pool } from '../config/db';

/**
 * VOC 메시지를 DB에 저장하는 함수
 * @param userId - 사용자 ID
 * @param message - 사용자 VOC 메시지
 */
export const insertVoc = async (userId: number, message: string) => {
  try {
    const query = `
      INSERT INTO vocs (user_id, message)
      VALUES (?, ?)
    `;

    await pool.query(query, [userId, message]);
  } catch (error) {
    console.error('VOC 저장 실패:', error);
    throw new Error(
      `VOC 저장 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : '알 수 없는 오류'
      }`
    );
  }
};
