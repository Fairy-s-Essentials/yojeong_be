import { pool } from '../config/db';

import { InsertSummaryModel } from '../types/summary';

/**
 * 객체의 모든 BigInt 값을 Number로 변환하는 헬퍼 함수
 */
const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertBigIntToNumber(item));
  }

  if (typeof obj === 'object') {
    // Date 객체는 그대로 반환
    if (obj instanceof Date) {
      return obj;
    }

    const converted: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'bigint') {
        converted[key] = Number(value);
      } else if (typeof value === 'object') {
        converted[key] = convertBigIntToNumber(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  return obj;
};

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
    SELECT id, user_summary, similarity_score, created_at FROM summaries WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT 3
    `;

    const params = [userId];

    const result: any = await pool.query(query, params);

    // 모든 BigInt 필드를 Number로 변환
    return convertBigIntToNumber(result || []);
  } catch (error) {
    console.error('최근 요약 조회 실패:', error);
    // 커스텀 에러 메시지로 throw
    throw new Error(
      `최근 요약 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
};

/**
 * 사용자의 주간 요약 개수를 조회하는 함수
 * @param userId - 사용자 ID
 * @returns - 주간 요약 개수
 */
export const getWeeklySummaryCountByUserId = async (userId: number) => {
  try {
    const query = `
    SELECT COUNT(*) as count FROM summaries WHERE user_id = ? AND is_deleted = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
    `;

    const params = [userId];

    const result: any = await pool.query(query, params);
    const converted = convertBigIntToNumber(result);
    return converted[0]?.count || 0;
  } catch (error) {
    console.error('주간 요약 조회 실패:', error);
    throw new Error('주간 요약 조회 실패');
  }
};

/**
 * 사용자의 평균정확도를 조회하는 함수
 * @param userId - 사용자 ID
 * @returns - 평균정확도
 */
export const getScoreAverageByUserId = async (userId: number) => {
  try {
    const query = `
    SELECT AVG(similarity_score) as avg FROM summaries WHERE user_id = ? AND is_deleted = 0
    `;

    const params = [userId];

    const result: any = await pool.query(query, params);
    const converted = convertBigIntToNumber(result);
    return Math.round(converted[0]?.avg || 0);
  } catch (error) {
    console.error('평균정확도 조회 실패:', error);
    throw new Error('평균정확도 조회 실패');
  }
};

/**
 * 사용자가 연속 학습한 일수를 조회하는 함수
 * @param userId - 사용자 ID
 * @returns - 연속 학습일 수
 */
export const getContinuousLearningDaysByUserId = async (userId: number) => {
  try {
    // summaries 테이블에서 해당 유저의 created_at(날짜)만 뽑아서 "날짜만" 기준으로 DESC 정렬하여 배열로 조회
    const query = `
      SELECT DATE(created_at) as summary_date
      FROM summaries
      WHERE user_id = ? AND is_deleted = 0
      GROUP BY DATE(created_at)
      ORDER BY summary_date DESC
    `;
    const params = [userId];
    const result: any = await pool.query(query, params);
    const rows = convertBigIntToNumber(result);

    if (!rows || rows.length === 0) {
      return 0;
    }

    // summary_date: string 배열 (최신순)
    let count = 1;
    let prevDate = new Date(rows[0].summary_date);

    for (let i = 1; i < rows.length; i++) {
      const currDate = new Date(rows[i].summary_date);

      // prevDate - currDate 의 차이를 하루(1일)로 계속 이어질 때만 count 증가
      const diffDays = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 3600 * 24)
      );

      if (diffDays === 1) {
        count += 1;
        prevDate = currDate;
      } else {
        // 하루씩 줄어드는 연속이 끊기면 break
        break;
      }
    }
    return count;
  } catch (error) {
    console.error('연속 학습일 조회 실패:', error);
    throw new Error('연속 학습일 조회 실패');
  }
};

export const getSummaryDetailById = async (id: number) => {
  const query = `
  SELECT * FROM summaries WHERE id = ? AND is_deleted = 0
  `;
  const params = [id];
  const result: any = await pool.query(query, params);
  console.log(result);
  return convertBigIntToNumber(result[0]);
};
