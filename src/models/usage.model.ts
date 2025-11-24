import { pool } from '../config/db';

/**
 * 사용자의 분석 사용량을 조회하는 함수
 * @param userId - 사용자 ID
 * @returns - 사용량, 하루 제한량
 */
export const getUsageByUserId = async (userId: number) => {
  try {
    const [rows] = await pool.query(
      `SELECT usage, \`limit\` 
       FROM usages 
       WHERE user_id = ? AND usage_date = CURDATE()`,
      [userId]
    );

    // 결과가 없으면 오늘 기록이 없으므로 0을 반환
    if ((rows as any[]).length === 0) {
      return { usage: 0, limit: 10 };
    }

    return rows[0] as { usage: number; limit: number };
  } catch (error) {
    console.error('사용량 조회 실패: ', error);

    throw new Error(
      `사용량 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
};

/**
 * 사용자가 분석 기능을 사용할 때 사용량을 1 증가시키는 함수
 * - 오늘 기록이 없으면 새로 생성하고 usage = 1 로 설정
 * - 이미 기록이 있으면 usage = usage + 1 로 업데이트
 * @param userId - 사용자 ID
 * @returns - 사용량, 하루 제한량
 */
export const updateUsage = async (userId: number) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, usage, \`limit\` 
       FROM usages 
       WHERE user_id = ? AND usage_date = CURDATE()`,
      [userId]
    );

    // 오늘 기록이 없으면 새로 생성
    if ((rows as any[]).length === 0) {
      await pool.query(
        `INSERT INTO usages (user_id, usage, \`limit\`, usage_date)
         VALUES (?, 1, 10, CURDATE())`,
        [userId]
      );
      return { usage: 1, limit: 10 };
    }

    // 이미 기록이 있는 경우 usage + 1 업데이트
    const record = rows[0] as { id: number; usage: number; limit: number };
    const newUsage = record.usage + 1;

    await pool.query(
      `UPDATE usages
       SET usage = ?
       WHERE id = ?`,
      [newUsage, record.id]
    );

    return { usage: newUsage, limit: record.limit };
  } catch (error) {
    console.error('사용량 증가 실패: ', error);

    throw new Error(
      `사용량 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
};
