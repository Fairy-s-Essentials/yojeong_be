import { pool } from '../config/db';

import { AiSummaryResponse, SummaryInput } from '../types/summary';


/**
 * 사용자 입력값을 DB에 저장
 */
export async function insertUserInput(input: SummaryInput): Promise<number> {
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

    return result.insertId; // summaries 테이블의 id 컬럼 값
  } catch (error) {
    console.error('Summary 저장 실패:', error);
    throw error;
  }
}

/**
 * ID로 Summary 조회
 */
export async function findSummaryById(id: number) {
  try {
    const rows = await pool.query(
      'SELECT * FROM summaries WHERE id = ?',
      [id]
    );
    return rows[0] || null; // 데이터가 없으면 null 반환
  } catch (error) {
    console.error('Summary 조회 실패:', error);
    throw error;
  }
}

/**
 * Summary의 AI 분석 결과 업데이트
 */
export async function updateAIAnalysis(id: number, aiData: AiSummaryResponse) {
  try {
    await pool.query(
      `UPDATE summaries
       SET ai_summary = ?,
           similarity_score = ?,
           ai_well_understood = ?,
           ai_missed_points = ?,
           ai_improvements = ?
       WHERE id = ?`,
      [
        aiData.aiSummary,
        aiData.similarityScore,
        JSON.stringify(aiData.aiWellUnderstood),
        JSON.stringify(aiData.aiMissedPoints),
        JSON.stringify(aiData.aiImprovements),
        id
      ]
    );
  } catch (error) {

    console.error('AI 분석 결과 업데이트 실패:', error);

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
