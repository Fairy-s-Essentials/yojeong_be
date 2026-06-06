import { pool } from '../config/db';

export type SummaryFeedbackReaction = 'LIKE' | 'DISLIKE';

export const getSummaryFeedbackReaction = async (
  summaryId: number,
  userId: number
): Promise<SummaryFeedbackReaction | null> => {
  const query = `
    SELECT reaction
    FROM summary_feedbacks
    WHERE summary_id = ?
      AND user_id = ?
    LIMIT 1
  `;

  const result = (await pool.query(query, [
    summaryId,
    userId
  ])) as Array<{ reaction: SummaryFeedbackReaction }>;

  return result[0]?.reaction ?? null;
};

export const upsertSummaryFeedback = async (
  summaryId: number,
  userId: number,
  reaction: SummaryFeedbackReaction
) => {
  const query = `
    INSERT INTO summary_feedbacks (summary_id, user_id, reaction)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      reaction = VALUES(reaction),
      updated_at = current_timestamp()
  `;

  const result = await pool.query(query, [summaryId, userId, reaction]);
  return result;
};

export const deleteSummaryFeedback = async (
  summaryId: number,
  userId: number
) => {
  const query = `
    DELETE FROM summary_feedbacks
    WHERE summary_id = ?
      AND user_id = ?
  `;

  const result = await pool.query(query, [summaryId, userId]);
  return result;
};
