# API 명세 - 요약 (Summaries)

## 1. 새 글 요약 생성

### Endpoint
```
POST /summaries
```

### 설명
사용자가 작성한 요약을 AI로 분석하고 결과를 저장합니다. (동기 처리, 10~30초 소요)

### Request

#### Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

#### Body
```typescript
{
  originalText: string,        // 원문 (1000~5000자)
  originalUrl?: string,         // 원문 링크 (선택, 최대 2048자)
  difficultyLevel: 1 | 2 | 3,  // 난이도
  userSummary: string,         // 사용자 요약
  criticalWeakness: string,    // 비판적 읽기: 약점
  criticalOpposite: string,    // 비판적 읽기: 반대 의견
  criticalApplication: string  // 비판적 읽기: 실제 적용
}
```

**난이도별 제한**:
- 1단계 (1,000~2,000자): 요약 최대 300자
- 2단계 (2,000~3,500자): 요약 최대 450자
- 3단계 (3,500~5,000자): 요약 최대 600자

#### 예시
```json
{
  "originalText": "최근 경제 전문가들은 글로벌 경제 상황에 대해 우려를 표명하고 있다...(1500자)",
  "originalUrl": "https://example.com/article/123",
  "difficultyLevel": 1,
  "userSummary": "글로벌 경제 전문가들이 인플레이션과 금리 인상에 대한 우려를 표명했다...(250자)",
  "criticalWeakness": "단기적 관점에만 집중하고 있어 장기 구조적 문제를 간과할 수 있다.",
  "criticalOpposite": "일부 경제학자들은 오히려 현재 상황이 일시적이며 회복세가 곧 나타날 것이라 주장한다.",
  "criticalApplication": "개인 투자자는 분산 투자를 통해 리스크를 관리하고 장기적 관점을 유지해야 한다."
}
```

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    id: number,
    userId: number,
    originalText: string,
    originalUrl: string | null,
    difficultyLevel: 1 | 2 | 3,
    userSummary: string,
    criticalWeakness: string,
    criticalOpposite: string,
    criticalApplication: string,
    aiSummary: string,
    similarityScore: number,     // 0~100
    aiWellUnderstood: string[],  // AI 분석: 잘 파악한 것
    aiMissedPoints: string[],    // AI 분석: 놓친 포인트
    aiImprovements: string[],    // AI 분석: 개선 제안
    learningNote: string | null,
    createdAt: string
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": 1,
    "originalText": "최근 경제 전문가들은...",
    "originalUrl": "https://example.com/article/123",
    "difficultyLevel": 1,
    "userSummary": "글로벌 경제 전문가들이...",
    "criticalWeakness": "단기적 관점에만 집중하고 있어...",
    "criticalOpposite": "일부 경제학자들은 오히려...",
    "criticalApplication": "개인 투자자는 분산 투자를 통해...",
    "aiSummary": "원문은 글로벌 경제의 불확실성과 전문가들의 우려를 다루고 있습니다...",
    "similarityScore": 85,
    "aiWellUnderstood": [
      "글로벌 경제 상황에 대한 전문가들의 우려를 정확히 파악했습니다",
      "인플레이션과 금리 인상이라는 핵심 이슈를 잘 요약했습니다"
    ],
    "aiMissedPoints": [
      "지역별 경제 상황의 차이점을 언급하지 않았습니다",
      "구체적인 수치 데이터가 누락되었습니다"
    ],
    "aiImprovements": [
      "주요 경제 지표를 구체적으로 명시하면 더욱 명확한 요약이 될 것입니다",
      "각 전문가의 의견을 구분하여 정리하면 이해도가 높아집니다"
    ],
    "learningNote": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 실패 (400 Bad Request)

**유효성 검증 실패**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다",
    "details": {
      "originalText": "원문은 1000자 이상 5000자 이하여야 합니다",
      "userSummary": "요약은 난이도 1의 경우 300자 이하여야 합니다",
      "difficultyLevel": "난이도는 1, 2, 3 중 하나여야 합니다"
    }
  }
}
```

**난이도 오류**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DIFFICULTY",
    "message": "난이도는 1, 2, 3 중 하나여야 합니다"
  }
}
```

#### 실패 (500 Internal Server Error)

**AI 서비스 오류**
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
  }
}
```

### 구현 로직

1. 요청 유효성 검증
   - 원문 길이: 1,000~5,000자
   - 난이도: 1, 2, 3 중 하나
   - 난이도별 요약 길이 확인
   - URL 형식 및 길이 검증

2. AI 서비스 호출 (동기 처리)
   - 원문과 사용자 요약을 AI 서비스에 전송
   - AI 요약 생성
   - 유사도 점수 계산 (0~100)
   - 잘 파악한 것, 놓친 포인트, 개선 제안 생성

3. DB 저장
   - AI 분석 결과의 배열을 `||` 구분자로 join하여 저장
   ```typescript
   const aiWellUnderstoodText = aiWellUnderstood.join('||');
   const aiMissedPointsText = aiMissedPoints.join('||');
   const aiImprovementsText = aiImprovements.join('||');
   ```

4. 응답 생성
   - DB에 저장된 `||` 구분자 문자열을 split하여 배열로 변환
   ```typescript
   const aiWellUnderstood = row.ai_well_understood.split('||');
   const aiMissedPoints = row.ai_missed_points.split('||');
   const aiImprovements = row.ai_improvements.split('||');
   ```

### 주의사항
- 타임아웃 설정: 최대 60초
- AI 서비스 장애 시 적절한 에러 처리
- 트랜잭션 사용 (DB 저장 실패 시 롤백)
- 응답 시 배열 변환 필수

---

## 2. 요약 상세 조회

### Endpoint
```
GET /summaries/:id
```

### 설명
특정 요약의 상세 정보를 조회합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

#### Path Parameters
- `id` (number): 요약 ID

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    id: number,
    userId: number,
    originalText: string,
    originalUrl: string | null,
    difficultyLevel: 1 | 2 | 3,
    userSummary: string,
    criticalWeakness: string,
    criticalOpposite: string,
    criticalApplication: string,
    aiSummary: string,
    similarityScore: number,
    aiWellUnderstood: string[],
    aiMissedPoints: string[],
    aiImprovements: string[],
    learningNote: string | null,
    createdAt: string,
    updatedAt: string
  }
}
```

#### 실패 (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "SUMMARY_NOT_FOUND",
    "message": "요약을 찾을 수 없습니다"
  }
}
```

#### 실패 (403 Forbidden)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "본인의 요약만 조회할 수 있습니다"
  }
}
```

### 구현 로직

1. 요약 조회
   ```sql
   SELECT * FROM summaries
   WHERE id = ? AND is_deleted = 0
   ```

2. 권한 검증
   - 조회한 요약의 `user_id`와 토큰의 `userId` 비교
   - 불일치 시 403 에러

3. 응답 생성
   - AI 분석 필드를 `||`로 split하여 배열로 변환

---

## 3. 요약 목록 조회

### Endpoint
```
GET /summaries
```

### 설명
사용자의 요약 목록을 페이지네이션으로 조회합니다. 검색 기능을 지원합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

#### Query Parameters
- `page` (number, optional): 페이지 번호 (기본값: 1)
- `limit` (number, optional): 페이지당 항목 수 (기본값: 10, 최대: 50)
- `search` (string, optional): 검색어 (원문 또는 요약 내용)

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    items: Array<{
      id: number,
      originalText: string,  // 첫 100자만 (미리보기)
      difficultyLevel: 1 | 2 | 3,
      similarityScore: number,
      createdAt: string
    }>,
    pagination: {
      currentPage: number,
      totalPages: number,
      totalItems: number,
      itemsPerPage: number,
      hasNext: boolean,
      hasPrev: boolean
    }
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "originalText": "최근 경제 전문가들은 글로벌 경제 상황에 대해 우려를 표명하고 있다. 특히 인플레이션과 금리 인상이...",
        "difficultyLevel": 1,
        "similarityScore": 85,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 구현 로직

1. 파라미터 검증
   - `page`: 1 이상
   - `limit`: 1~50 사이

2. 검색 쿼리 구성
   ```sql
   -- 검색어 없을 때
   SELECT id, SUBSTRING(original_text, 1, 100) as original_text, 
          difficulty_level, similarity_score, created_at
   FROM summaries
   WHERE user_id = ? AND is_deleted = 0
   ORDER BY created_at DESC
   LIMIT ? OFFSET ?

   -- 검색어 있을 때
   SELECT id, SUBSTRING(original_text, 1, 100) as original_text,
          difficulty_level, similarity_score, created_at
   FROM summaries
   WHERE user_id = ? 
     AND is_deleted = 0
     AND (original_text LIKE ? OR user_summary LIKE ?)
   ORDER BY created_at DESC
   LIMIT ? OFFSET ?
   ```

3. 전체 개수 조회
   ```sql
   SELECT COUNT(*) as total
   FROM summaries
   WHERE user_id = ? AND is_deleted = 0
   -- 검색어가 있다면 동일한 WHERE 조건 추가
   ```

4. 페이지네이션 계산
   ```typescript
   const totalPages = Math.ceil(totalItems / limit);
   const hasNext = currentPage < totalPages;
   const hasPrev = currentPage > 1;
   ```

---

## 4. 배운점 추가/수정

### Endpoint
```
PATCH /summaries/:id/learning-note
```

### 설명
요약에 배운점을 추가하거나 수정합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

#### Path Parameters
- `id` (number): 요약 ID

#### Body
```typescript
{
  learningNote: string  // 최대 500자
}
```

#### 예시
```json
{
  "learningNote": "경제 뉴스를 읽을 때는 단순히 현상만 보는 것이 아니라 그 이면의 구조적 원인을 파악하는 것이 중요하다는 것을 배웠다."
}
```

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    id: number,
    learningNote: string,
    updatedAt: string
  }
}
```

#### 실패 (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "배운점은 500자 이하여야 합니다"
  }
}
```

#### 실패 (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "SUMMARY_NOT_FOUND",
    "message": "요약을 찾을 수 없습니다"
  }
}
```

#### 실패 (403 Forbidden)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "본인의 요약만 수정할 수 있습니다"
  }
}
```

### 구현 로직

1. 유효성 검증
   - `learningNote` 길이: 최대 500자

2. 요약 조회 및 권한 검증

3. DB 업데이트
   ```sql
   UPDATE summaries
   SET learning_note = ?, updated_at = NOW()
   WHERE id = ? AND user_id = ? AND is_deleted = 0
   ```

---

## 5. 요약 삭제

### Endpoint
```
DELETE /summaries/:id
```

### 설명
요약을 소프트 삭제합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

#### Path Parameters
- `id` (number): 요약 ID

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    message: string
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "message": "요약이 삭제되었습니다"
  }
}
```

#### 실패 (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "SUMMARY_NOT_FOUND",
    "message": "요약을 찾을 수 없습니다"
  }
}
```

#### 실패 (403 Forbidden)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "본인의 요약만 삭제할 수 있습니다"
  }
}
```

### 구현 로직

1. 요약 조회 및 권한 검증

2. 소프트 삭제
   ```sql
   UPDATE summaries
   SET is_deleted = 1, updated_at = NOW()
   WHERE id = ? AND user_id = ? AND is_deleted = 0
   ```

---

## TypeScript 타입 정의

```typescript
// Request Types
interface CreateSummaryRequest {
  originalText: string;
  originalUrl?: string;
  difficultyLevel: 1 | 2 | 3;
  userSummary: string;
  criticalWeakness: string;
  criticalOpposite: string;
  criticalApplication: string;
}

interface UpdateLearningNoteRequest {
  learningNote: string;
}

// Response Types
interface Summary {
  id: number;
  userId: number;
  originalText: string;
  originalUrl: string | null;
  difficultyLevel: 1 | 2 | 3;
  userSummary: string;
  criticalWeakness: string;
  criticalOpposite: string;
  criticalApplication: string;
  aiSummary: string;
  similarityScore: number;
  aiWellUnderstood: string[];
  aiMissedPoints: string[];
  aiImprovements: string[];
  learningNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SummaryListItem {
  id: number;
  originalText: string;
  difficultyLevel: 1 | 2 | 3;
  similarityScore: number;
  createdAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SummaryListResponse {
  items: SummaryListItem[];
  pagination: PaginationMeta;
}
```

---

## 테스트 케이스

### 1. 요약 생성
- [ ] 유효한 데이터로 요약 생성 성공
- [ ] AI 분석 결과 배열이 올바르게 저장되고 반환되는지 확인
- [ ] 원문 길이 검증 (1000자 미만, 5000자 초과)
- [ ] 난이도별 요약 길이 검증
- [ ] URL 형식 및 길이 검증
- [ ] AI 서비스 에러 처리
- [ ] 타임아웃 처리

### 2. 요약 조회
- [ ] 본인의 요약 조회 성공
- [ ] 다른 사용자의 요약 조회 시 403 에러
- [ ] 존재하지 않는 요약 조회 시 404 에러
- [ ] 삭제된 요약 조회 시 404 에러
- [ ] AI 분석 필드가 배열로 변환되는지 확인

### 3. 요약 목록
- [ ] 페이지네이션 정상 동작
- [ ] 검색 기능 정상 동작
- [ ] limit 제한 (최대 50)
- [ ] 삭제된 요약은 목록에 포함되지 않음
- [ ] 다른 사용자의 요약은 목록에 포함되지 않음

### 4. 배운점 수정
- [ ] 배운점 추가 성공
- [ ] 배운점 수정 성공
- [ ] 500자 초과 시 에러
- [ ] 다른 사용자의 요약 수정 시 403 에러

### 5. 요약 삭제
- [ ] 본인의 요약 삭제 성공
- [ ] 소프트 삭제 확인 (is_deleted = 1)
- [ ] 삭제 후 조회/목록에서 제외 확인
- [ ] 다른 사용자의 요약 삭제 시 403 에러
