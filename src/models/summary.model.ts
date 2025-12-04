import { pool } from '../config/db';

import { InsertSummaryModel } from '../types/summary';
import {
  HistoryPeriod,
  AccuracyDataPoint,
  LearningDay
} from '../types/history';
import { HISTORY_PERIOD, SQL_INTERVAL_UNIT } from '../constant/history.const';

/**
 * DB 조회 결과의 숫자 타입을 정규화하는 헬퍼 함수
 * - BigInt → Number 변환
 * - 숫자 형태의 문자열 → Number 변환 (MariaDB DECIMAL/AVG 결과)
 * @param obj - 변환할 객체
 * @returns 정규화된 객체
 */
const normalizeNumericValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeNumericValues(item));
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
      } else if (
        typeof value === 'string' &&
        value.trim() !== '' &&
        isFinite(Number(value))
      ) {
        converted[key] = Number(value);
      } else if (typeof value === 'object') {
        converted[key] = normalizeNumericValues(value);
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
    return normalizeNumericValues(result || []);
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
    const converted = normalizeNumericValues(result);
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
    const converted = normalizeNumericValues(result);
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
    const rows = normalizeNumericValues(result);

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
  return normalizeNumericValues(result[0]);
};

/**
 * 기간별 요약 개수를 조회하는 함수
 * @param userId - 사용자 ID
 * @param period - 조회 기간 (7, 30, "all")
 * @returns 해당 기간의 요약 개수
 */
export const getSummaryCountByPeriod = async (
  userId: number,
  period: HistoryPeriod
): Promise<number> => {
  try {
    let dateCondition = '';
    if (period === HISTORY_PERIOD.WEEK) {
      dateCondition = `AND created_at >= DATE_SUB(NOW(), INTERVAL ${HISTORY_PERIOD.WEEK} ${SQL_INTERVAL_UNIT.DAY})`;
    } else if (period === HISTORY_PERIOD.MONTH) {
      dateCondition = `AND created_at >= DATE_SUB(NOW(), INTERVAL ${HISTORY_PERIOD.MONTH} ${SQL_INTERVAL_UNIT.DAY})`;
    }

    const query = `
      SELECT COUNT(*) as count 
      FROM summaries 
      WHERE user_id = ? AND is_deleted = 0 ${dateCondition}
    `;

    const params = [userId];
    const result: unknown = await pool.query(query, params);
    const converted = normalizeNumericValues(result);
    return converted[0]?.count || 0;
  } catch (error) {
    console.error('기간별 요약 개수 조회 실패:', error);
    throw new Error('기간별 요약 개수 조회 실패');
  }
};

/**
 * 기간별 평균 정확도를 조회하는 함수
 * @param userId - 사용자 ID
 * @param period - 조회 기간 (7, 30, "all")
 * @returns 해당 기간의 평균 점수 (0~100)
 */
export const getScoreAverageByPeriod = async (
  userId: number,
  period: HistoryPeriod
): Promise<number> => {
  try {
    let dateCondition = '';
    if (period === HISTORY_PERIOD.WEEK) {
      dateCondition = `AND created_at >= DATE_SUB(NOW(), INTERVAL ${HISTORY_PERIOD.WEEK} ${SQL_INTERVAL_UNIT.DAY})`;
    } else if (period === HISTORY_PERIOD.MONTH) {
      dateCondition = `AND created_at >= DATE_SUB(NOW(), INTERVAL ${HISTORY_PERIOD.MONTH} ${SQL_INTERVAL_UNIT.DAY})`;
    }

    const query = `
      SELECT AVG(similarity_score) as avg 
      FROM summaries 
      WHERE user_id = ? AND is_deleted = 0 ${dateCondition}
    `;

    const params = [userId];
    const result: unknown = await pool.query(query, params);
    const converted = normalizeNumericValues(result);
    return Math.round(converted[0]?.avg || 0);
  } catch (error) {
    console.error('기간별 평균 정확도 조회 실패:', error);
    throw new Error('기간별 평균 정확도 조회 실패');
  }
};

/**
 * 기간별 정확도 추이를 조회하는 함수
 * @param userId - 사용자 ID
 * @param period - 조회 기간 (7, 30, "all")
 * @returns 날짜/월별 평균 점수와 학습 횟수 배열 (오래된 순 정렬)
 */
export const getAccuracyTrendByPeriod = async (
  userId: number,
  period: HistoryPeriod
): Promise<AccuracyDataPoint[]> => {
  try {
    let dateGroupBy: string;
    let dateSelect: string;
    let dateCondition = '';

    // period에 따라 GROUP BY와 SELECT 절 결정
    if (period === 'all') {
      // 전체 기간: 월별 집계 (YYYY-MM)
      dateSelect = "DATE_FORMAT(created_at, '%Y-%m')";
      dateGroupBy = "DATE_FORMAT(created_at, '%Y-%m')";
    } else {
      // 7일/30일: 일별 집계 (YYYY-MM-DD)
      dateSelect = 'DATE(created_at)';
      dateGroupBy = 'DATE(created_at)';

      // 날짜 조건 추가
      if (period === HISTORY_PERIOD.WEEK) {
        dateCondition = `AND created_at >= DATE_SUB(NOW(), INTERVAL ${HISTORY_PERIOD.WEEK} ${SQL_INTERVAL_UNIT.DAY})`;
      } else if (period === HISTORY_PERIOD.MONTH) {
        dateCondition = `AND created_at >= DATE_SUB(NOW(), INTERVAL ${HISTORY_PERIOD.MONTH} ${SQL_INTERVAL_UNIT.DAY})`;
      }
    }

    const query = `
      SELECT 
        ${dateSelect} as date,
        ROUND(AVG(similarity_score)) as averageScore,
        COUNT(*) as count
      FROM summaries
      WHERE user_id = ? AND is_deleted = 0 ${dateCondition}
      GROUP BY ${dateGroupBy}
      ORDER BY date ASC
    `;

    const params = [userId];
    const result: unknown = await pool.query(query, params);
    const converted = normalizeNumericValues(result);

    return converted || [];
  } catch (error) {
    console.error('정확도 추이 조회 실패:', error);
    throw new Error('정확도 추이 조회 실패');
  }
};

/**
 * 사용자의 학습 기록이 존재하는 연도 목록을 조회하는 함수
 * @param userId - 사용자 ID
 * @returns 학습 기록이 있는 연도 배열 (오름차순 정렬)
 */
export const getCalendarYears = async (userId: number): Promise<number[]> => {
  try {
    const query = `
      SELECT DISTINCT YEAR(created_at) as year
      FROM summaries
      WHERE user_id = ? AND is_deleted = 0
      ORDER BY year ASC
    `;

    const params = [userId];
    const result: unknown = await pool.query(query, params);
    const converted = normalizeNumericValues(result);

    // 연도만 추출하여 배열로 반환
    return (converted as Array<{ year: number }>).map((row) => row.year);
  } catch (error) {
    console.error('학습 연도 목록 조회 실패:', error);
    throw new Error('학습 연도 목록 조회 실패');
  }
};

/**
 * 특정 연도의 학습 캘린더 데이터를 조회하는 함수
 * @param userId - 사용자 ID
 * @param year - 조회할 연도
 * @returns 날짜별 학습 횟수와 평균 점수 배열 (날짜 오름차순)
 */
export const getCalendarByYear = async (
  userId: number,
  year: number
): Promise<LearningDay[]> => {
  try {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        ROUND(AVG(similarity_score)) as averageScore
      FROM summaries
      WHERE user_id = ? 
        AND is_deleted = 0
        AND YEAR(created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const params = [userId, year];
    const result: unknown = await pool.query(query, params);
    const converted = normalizeNumericValues(result);

    return converted || [];
  } catch (error) {
    console.error('학습 캘린더 조회 실패:', error);
    throw new Error('학습 캘린더 조회 실패');
  }
};

/**
 * 요약 목록을 페이지네이션과 함께 조회하는 함수
 * @param userId - 사용자 ID
 * @param page - 페이지 번호 (1부터 시작)
 * @param limit - 페이지당 항목 수
 * @param isLatest - true: 최신순, false: 오래된 순
 * @param search - 검색어 (선택)
 * @returns 요약 목록 배열
 */
export const getSummariesWithPagination = async (
  userId: number,
  page: number,
  limit: number,
  isLatest: boolean,
  search?: string
) => {
  try {
    let searchCondition = '';
    const params: (number | string)[] = [userId];

    if (search && search.trim()) {
      const searchTerm = search.trim();

      // 검색어 길이에 따라 Full-Text Search 또는 LIKE 사용
      // Full-Text의 ft_min_word_len이 4인 경우를 고려
      if (searchTerm.length >= 4) {
        // 4글자 이상: Full-Text Search 시도
        searchCondition = `
          AND (
            MATCH(original_text, user_summary) AGAINST(? IN BOOLEAN MODE)
            OR original_text LIKE ?
            OR user_summary LIKE ?
          )
        `;
        const likePattern = `%${searchTerm}%`;
        params.push(searchTerm, likePattern, likePattern);
      } else {
        // 4글자 미만: LIKE 검색만 사용
        searchCondition = `
          AND (original_text LIKE ? OR user_summary LIKE ?)
        `;
        const likePattern = `%${searchTerm}%`;
        params.push(likePattern, likePattern);
      }
    }

    const orderBy = isLatest ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        id,
        user_summary,
        similarity_score,
        created_at
      FROM summaries
      WHERE user_id = ? 
        AND is_deleted = 0
        ${searchCondition}
      ORDER BY created_at ${orderBy}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const result: unknown = await pool.query(query, params);
    const converted = normalizeNumericValues(result);

    return converted || [];
  } catch (error) {
    console.error('요약 목록 조회 실패:', error);
    throw new Error('요약 목록 조회 실패');
  }
};

/**
 * 전체 요약 개수를 조회하는 함수 (검색 조건 포함)
 * @param userId - 사용자 ID
 * @param search - 검색어 (선택)
 * @returns 전체 요약 개수
 */
export const getTotalSummariesCount = async (
  userId: number,
  search?: string
): Promise<number> => {
  try {
    let searchCondition = '';
    const params: (number | string)[] = [userId];

    if (search && search.trim()) {
      const searchTerm = search.trim();

      // 검색어 길이에 따라 Full-Text Search 또는 LIKE 사용
      if (searchTerm.length >= 4) {
        // 4글자 이상: Full-Text Search 시도
        searchCondition = `
          AND (
            MATCH(original_text, user_summary) AGAINST(? IN BOOLEAN MODE)
            OR original_text LIKE ?
            OR user_summary LIKE ?
          )
        `;
        const likePattern = `%${searchTerm}%`;
        params.push(searchTerm, likePattern, likePattern);
      } else {
        // 4글자 미만: LIKE 검색만 사용
        searchCondition = `
          AND (original_text LIKE ? OR user_summary LIKE ?)
        `;
        const likePattern = `%${searchTerm}%`;
        params.push(likePattern, likePattern);
      }
    }

    const query = `
      SELECT COUNT(*) as count
      FROM summaries
      WHERE user_id = ? 
        AND is_deleted = 0
        ${searchCondition}
    `;

    const result: unknown = await pool.query(query, params);
    const converted = normalizeNumericValues(result);

    return converted[0]?.count || 0;
  } catch (error) {
    console.error('전체 요약 개수 조회 실패:', error);
    throw new Error('전체 요약 개수 조회 실패');
  }
};
