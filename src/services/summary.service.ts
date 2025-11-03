import { pool } from '../config/db';

export async function getTestSummary() {
  try {
    const result = await pool.query('SELECT * FROM summaries LIMIT 1');
    return result[0] || [{ id: 0, summary: '테스트지롱' }];
  } catch (error) {
    console.error('Summary 조회 실패:', error);
    throw error;
  }
}
