# API 명세 - 통계 (Statistics)

## 1. 메인 페이지 통계

### Endpoint
```
GET /statistics/main
```

### 설명
메인 페이지에 표시할 통계 데이터를 조회합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    weeklyCount: number,           // 이번 주 읽은 글
    averageScore: number,          // 전체 평균 정확도 (0~100)
    consecutiveDays: number,       // 연속 학습일
    recentSummaries: Array<{       // 최근 기록 최대 3개
      id: number,
      originalText: string,        // 첫 50자
      similarityScore: number,
      createdAt: string
    }>
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "weeklyCount": 5,
    "averageScore": 85.4,
    "consecutiveDays": 7,
    "recentSummaries": [
      {
        "id": 123,
        "originalText": "최근 경제 전문가들은 글로벌 경제 상황에 대해 우려를 표명하고...",
        "similarityScore": 85,
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": 122,
        "originalText": "인공지능 기술의 발전은 우리 사회에 많은 변화를 가져오고 있다...",
        "similarityScore": 90,
        "createdAt": "2024-01-14T15:20:00.000Z"
      },
      {
        "id": 121,
        "originalText": "기후 변화에 대응하기 위한 국제 사회의 노력이 가속화되고 있다...",
        "similarityScore": 78,
        "createdAt": "2024-01-13T09:10:00.000Z"
      }
    ]
  }
}
```

### 구현 로직

#### 1. 이번 주 읽은 글 (weeklyCount)
```sql
SELECT COUNT(*) as weekly_count
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

#### 2. 평균 정확도 (averageScore)
```sql
SELECT AVG(similarity_score) as average_score
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
```

소수점 첫째 자리까지 반올림하여 반환합니다.

#### 3. 연속 학습일 (consecutiveDays)
이 계산은 복잡하므로 로직을 설명합니다:

```typescript
async function calculateConsecutiveDays(userId: number): Promise<number> {
  // 1. 사용자의 모든 학습 날짜를 조회 (최신순)
  const query = `
    SELECT DISTINCT DATE(created_at) as study_date
    FROM summaries
    WHERE user_id = ? AND is_deleted = 0
    ORDER BY study_date DESC
  `;
  
  const dates = await db.query(query, [userId]);
  
  if (dates.length === 0) return 0;
  
  // 2. 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 3. 가장 최근 학습일
  const lastStudyDate = new Date(dates[0].study_date);
  
  // 4. 마지막 학습이 어제 또는 오늘이 아니면 연속일 0
  const diffDays = Math.floor((today - lastStudyDate) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;
  
  // 5. 연속 학습일 계산
  let consecutiveDays = 0;
  let expectedDate = new Date(lastStudyDate);
  
  for (const date of dates) {
    const currentDate = new Date(date.study_date);
    
    if (currentDate.getTime() === expectedDate.getTime()) {
      consecutiveDays++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return consecutiveDays;
}
```

#### 4. 최근 기록 3개 (recentSummaries)
```sql
SELECT id, 
       SUBSTRING(original_text, 1, 50) as original_text,
       similarity_score,
       created_at
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
ORDER BY created_at DESC
LIMIT 3
```

### 주의사항
- 평균 점수는 소수점 첫째 자리까지 반올림
- 연속 학습일 계산은 자정(00:00) 기준
- 최근 기록은 원문의 첫 50자만 반환

---

## 2. 학습 히스토리 통계

### Endpoint
```
GET /statistics/history
```

### 설명
학습 히스토리 페이지에 표시할 통계 데이터를 조회합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

#### Query Parameters
- `period` (string): 조회 기간
  - `7`: 최근 7일
  - `30`: 최근 30일
  - `all`: 전체 기간
  - 기본값: `7`

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    period: "7" | "30" | "all",
    totalCount: number,            // 총 학습 횟수
    averageScore: number,          // 평균 정확도
    highestScore: number,          // 최고 점수
    lowestScore: number,           // 최저 점수
    scoreByDifficulty: {           // 난이도별 평균
      level1: number,
      level2: number,
      level3: number
    }
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "period": "7",
    "totalCount": 15,
    "averageScore": 85.4,
    "highestScore": 95,
    "lowestScore": 72,
    "scoreByDifficulty": {
      "level1": 88.5,
      "level2": 84.2,
      "level3": 82.1
    }
  }
}
```

### 구현 로직

#### 기간 조건 생성
```typescript
function getPeriodCondition(period: string): string {
  switch (period) {
    case '7':
      return 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    case '30':
      return 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    case 'all':
      return '';
    default:
      return 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  }
}
```

#### 전체 통계 조회
```sql
SELECT 
  COUNT(*) as total_count,
  AVG(similarity_score) as average_score,
  MAX(similarity_score) as highest_score,
  MIN(similarity_score) as lowest_score
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
  {period_condition}
```

#### 난이도별 평균 조회
```sql
SELECT 
  difficulty_level,
  AVG(similarity_score) as average_score
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
  {period_condition}
GROUP BY difficulty_level
```

결과를 객체로 변환:
```typescript
const scoreByDifficulty = {
  level1: difficultyScores.find(s => s.difficulty_level === 1)?.average_score || 0,
  level2: difficultyScores.find(s => s.difficulty_level === 2)?.average_score || 0,
  level3: difficultyScores.find(s => s.difficulty_level === 3)?.average_score || 0
};
```

### 주의사항
- 데이터가 없는 경우 0 반환
- 소수점 첫째 자리까지 반올림
- 특정 난이도의 데이터가 없으면 해당 난이도는 0

---

## 3. 정확도 추이

### Endpoint
```
GET /statistics/accuracy-trend
```

### 설명
기간별 정확도 추이 데이터를 조회합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

#### Query Parameters
- `period` (string): 조회 기간
  - `7`: 최근 7일 (일별)
  - `30`: 최근 30일 (일별)
  - `all`: 전체 기간 (월별)
  - 기본값: `7`

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    period: "7" | "30" | "all",
    dataPoints: Array<{
      date: string,              // 7일/30일: "YYYY-MM-DD", all: "YYYY-MM"
      averageScore: number,
      count: number              // 해당 기간 학습 횟수
    }>
  }
}
```

#### 예시 (7일)
```json
{
  "success": true,
  "data": {
    "period": "7",
    "dataPoints": [
      {
        "date": "2024-01-15",
        "averageScore": 88.5,
        "count": 3
      },
      {
        "date": "2024-01-14",
        "averageScore": 85.0,
        "count": 2
      },
      {
        "date": "2024-01-13",
        "averageScore": 90.0,
        "count": 1
      },
      {
        "date": "2024-01-12",
        "averageScore": 82.5,
        "count": 2
      },
      {
        "date": "2024-01-11",
        "averageScore": 0,
        "count": 0
      },
      {
        "date": "2024-01-10",
        "averageScore": 87.0,
        "count": 1
      },
      {
        "date": "2024-01-09",
        "averageScore": 91.0,
        "count": 2
      }
    ]
  }
}
```

#### 예시 (all - 월별)
```json
{
  "success": true,
  "data": {
    "period": "all",
    "dataPoints": [
      {
        "date": "2024-01",
        "averageScore": 86.2,
        "count": 45
      },
      {
        "date": "2023-12",
        "averageScore": 84.1,
        "count": 38
      },
      {
        "date": "2023-11",
        "averageScore": 82.5,
        "count": 29
      }
    ]
  }
}
```

### 구현 로직

#### 일별 데이터 조회 (7일, 30일)
```sql
SELECT 
  DATE(created_at) as date,
  AVG(similarity_score) as average_score,
  COUNT(*) as count
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
  AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
GROUP BY DATE(created_at)
ORDER BY date ASC
```

학습하지 않은 날짜도 포함시키기:
```typescript
function fillMissingDates(data: any[], days: number) {
  const result = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const found = data.find(d => d.date === dateStr);
    result.push({
      date: dateStr,
      averageScore: found ? Math.round(found.average_score * 10) / 10 : 0,
      count: found ? found.count : 0
    });
  }
  
  return result;
}
```

#### 월별 데이터 조회 (all)
```sql
SELECT 
  DATE_FORMAT(created_at, '%Y-%m') as date,
  AVG(similarity_score) as average_score,
  COUNT(*) as count
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY date ASC
```

### 주의사항
- 7일/30일은 항상 정확히 그 기간의 데이터를 반환 (학습 안 한 날은 count: 0)
- all은 실제 학습한 월만 반환
- 최신순이 아닌 오래된 순서로 정렬 (차트 그리기 편함)

---

## 4. 학습 달력

### Endpoint
```
GET /statistics/calendar
```

### 설명
GitHub 잔디 스타일의 학습 달력 데이터를 조회합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

#### Query Parameters
- `year` (number, optional): 조회 연도 (기본값: 현재 연도)

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    year: number,
    learningDays: Array<{
      date: string,              // "YYYY-MM-DD"
      count: number,             // 해당 날짜 학습 횟수
      averageScore: number       // 해당 날짜 평균 점수
    }>
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "learningDays": [
      {
        "date": "2024-01-15",
        "count": 3,
        "averageScore": 88.5
      },
      {
        "date": "2024-01-14",
        "count": 2,
        "averageScore": 85.0
      },
      {
        "date": "2024-01-10",
        "count": 1,
        "averageScore": 87.0
      }
    ]
  }
}
```

### 구현 로직

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count,
  AVG(similarity_score) as average_score
FROM summaries
WHERE user_id = ?
  AND is_deleted = 0
  AND YEAR(created_at) = ?
GROUP BY DATE(created_at)
ORDER BY date ASC
```

### 주의사항
- 학습하지 않은 날은 포함하지 않음 (프론트엔드에서 처리)
- 해당 연도의 데이터만 반환
- 평균 점수는 소수점 첫째 자리까지 반올림
- 연도 파라미터가 없으면 현재 연도 사용

---

## TypeScript 타입 정의

```typescript
// Main Statistics
interface MainStatistics {
  weeklyCount: number;
  averageScore: number;
  consecutiveDays: number;
  recentSummaries: RecentSummary[];
}

interface RecentSummary {
  id: number;
  originalText: string;
  similarityScore: number;
  createdAt: string;
}

// History Statistics
interface HistoryStatistics {
  period: '7' | '30' | 'all';
  totalCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreByDifficulty: {
    level1: number;
    level2: number;
    level3: number;
  };
}

// Accuracy Trend
interface AccuracyTrend {
  period: '7' | '30' | 'all';
  dataPoints: AccuracyDataPoint[];
}

interface AccuracyDataPoint {
  date: string;
  averageScore: number;
  count: number;
}

// Learning Calendar
interface LearningCalendar {
  year: number;
  learningDays: CalendarDay[];
}

interface CalendarDay {
  date: string;
  count: number;
  averageScore: number;
}

// API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 성능 최적화 팁

### 1. 인덱스 활용
통계 쿼리는 다음 인덱스를 활용합니다:
- `idx_summaries_user_created`: (user_id, created_at DESC)
- `idx_summaries_difficulty`: (difficulty_level)

### 2. 캐싱 전략
통계 데이터는 자주 변하지 않으므로 캐싱을 고려할 수 있습니다:
```typescript
// Redis 캐싱 예시
const cacheKey = `stats:main:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const stats = await calculateMainStats(userId);
await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5분 캐시

return stats;
```

### 3. 쿼리 최적화
가능한 한 단일 쿼리로 여러 통계를 계산:
```sql
-- 한 번에 여러 통계 계산
SELECT 
  COUNT(*) as total_count,
  AVG(similarity_score) as average_score,
  MAX(similarity_score) as highest_score,
  MIN(similarity_score) as lowest_score,
  SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as weekly_count
FROM summaries
WHERE user_id = ? AND is_deleted = 0
```

---

## 테스트 케이스

### 1. 메인 통계
- [ ] 이번 주 읽은 글 수 정확도
- [ ] 평균 점수 계산 정확도
- [ ] 연속 학습일 계산 정확도
- [ ] 최근 기록 3개 조회
- [ ] 데이터가 없을 때 적절한 기본값 반환

### 2. 학습 히스토리 통계
- [ ] 7일 기간 조회
- [ ] 30일 기간 조회
- [ ] 전체 기간 조회
- [ ] 난이도별 평균 계산
- [ ] 데이터가 없는 난이도 처리

### 3. 정확도 추이
- [ ] 7일 일별 데이터 조회
- [ ] 30일 일별 데이터 조회
- [ ] 전체 월별 데이터 조회
- [ ] 학습하지 않은 날짜 처리 (7일/30일)
- [ ] 날짜 정렬 확인

### 4. 학습 달력
- [ ] 특정 연도 데이터 조회
- [ ] 현재 연도 기본값
- [ ] 날짜별 학습 횟수와 평균 점수
- [ ] 학습하지 않은 날은 제외
