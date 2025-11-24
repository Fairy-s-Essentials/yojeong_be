import { pool } from '../config/db';
import { Usage } from '../types/usage';

/**
 * 사용자의 분석 사용량을 조회하는 함수
 * @param userId - 사용자 ID
 * @returns - 사용량, 하루 제한량
 */
export const getUsageByUserId = async (userId: number): Promise<Usage> => {
  try {
    const result = await pool.query(
      `SELECT \`usage\`, \`limit\` 
       FROM usages 
       WHERE user_id = ? AND usage_date = CURDATE()`,
      [userId]
    );

    // result가 배열인 경우 첫 번째 요소가 rows
    const rows = Array.isArray(result) ? result : [];

    // 결과가 없으면 오늘 기록이 없으므로 0을 반환
    if (!rows || rows.length === 0) {
      return { usage: 0, limit: 10 };
    }

    return rows[0] as Usage;
  } catch (error) {
    console.error('사용량 조회 실패: ', error);

    throw new Error(
      `사용량 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
};

/**
 * 사용자가 분석 기능을 사용할 때 사용량을 1 증가시키는 함수
 * - 오늘 기록이 없으면 새로 생성
 * - 이미 기록이 있으면 usage + 1 업데이트
 * @param userId - 사용자 ID
 * @returns - 사용량, 하루 제한량
 */
export const updateUsage = async (userId: number): Promise<Usage> => {
  try {
    // INSERT + UPDATE를 원자적으로 처리
    await pool.query(
      `
      INSERT INTO usages (user_id, \`usage\`, \`limit\`, usage_date)
      VALUES (?, 1, 10, CURDATE())
      ON DUPLICATE KEY UPDATE
        \`usage\` = \`usage\` + 1
      `,
      [userId]
    );

    // 최신 사용량 조회
    const result = await pool.query(
      `SELECT \`usage\`, \`limit\` FROM usages WHERE user_id = ? AND usage_date = CURDATE()`,
      [userId]
    );

    const rows = Array.isArray(result) ? result : [];
    
    if (!rows || rows.length === 0) {
      throw new Error('사용량 업데이트 후 조회 실패');
    }

    return rows[0] as Usage;
  } catch (error) {
    console.error('사용량 증가 실패:', error);
    throw new Error(
      `사용량 업데이트 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : '알 수 없는 오류'
      }`
    );
  }
};
