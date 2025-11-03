import { pool } from '../config/db';

import { InsertSummaryModel } from '../types/summary';

/**
 * 요약 데이터를 삽입하는 함수
 * @param inputData - 삽입할 요약 데이터
 * @returns - 삽입된 요약 ID
 */
export const insertSummary = async (inputData: InsertSummaryModel) => {
  try {
    const query = `
    INSERT INTO summaries
    (user_id, original_text, original_url, difficulty_level, user_summary, critical_weakness, critical_opposite, ai_summary, similarity_score, ai_well_understood, ai_missed_points, ai_improvements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      inputData.userId,
      inputData.originalText,
      inputData.originalUrl,
      inputData.difficultyLevel,
      inputData.userSummary,
      inputData.criticalWeakness,
      inputData.criticalOpposite,
      inputData.aiSummary,
      inputData.similarityScore,
      JSON.stringify(inputData.aiWellUnderstood),
      JSON.stringify(inputData.aiMissedPoints),
      JSON.stringify(inputData.aiImprovements)
    ];

    const result = await pool.query(query, params);
    return result.insertId;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Summary 저장 실패:', error.message);
    } else {
      console.error('Summary 저장 실패:', error);
    }
    throw new Error('Summary 저장 실패');
  }
};

/**
 * 사용자의 최근 요약 데이터를 조회하는 함수
 * @param userId - 사용자 ID
 * @returns - 최근 요약 데이터
 */
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
