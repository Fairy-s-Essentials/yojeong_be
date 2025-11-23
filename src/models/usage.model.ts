import { pool } from '../config/db';

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
