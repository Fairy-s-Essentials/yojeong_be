import { pool } from '../config/db';

interface SummaryInput {
  userId: number;
  originalText: string;
  originalUrl?: string;
  difficultyLevel: 1 | 2 | 3;
  userSummary: string;
  criticalWeakness: string;
  criticalOpposite: string;
  criticalApplication: string;
}

export async function saveSummary(input: SummaryInput) {
  try {
    const result = await pool.query(
      `INSERT INTO summaries (
           user_id,
           original_text,
           original_url,
           difficulty_level,
           user_summary,
           critical_weakness,
           critical_opposite,
           critical_application
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.userId,
        input.originalText,
        input.originalUrl || null,
        input.difficultyLevel,
        input.userSummary,
        input.criticalWeakness,
        input.criticalOpposite,
        input.criticalApplication
      ]
    );

    return { id: result.insertId }; // 새로 생성된 summary의 ID 반환
  } catch (error) {
    console.error('Summary 저장 실패:', error);
    throw error;
  }
}

export const getRecentSummary = async (userId: number) => {
  try {
    const query = `
    SELECT * FROM summaries WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT 3
    `;

    const params = [userId];

    const result = await pool.query(query, params);
    return result[0] || [];
  } catch (error) {
    console.error('최근 요약 조회 실패:', error);
    // 커스텀 에러 메시지로 throw
    throw new Error(
      `최근 요약 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
};
