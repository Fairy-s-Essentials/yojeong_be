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
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
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
        input.criticalApplication,
      ]
    );

    return { id: result.insertId }; // 새로 생성된 summary의 ID 반환
  } finally {
    conn.release();
  }
}
