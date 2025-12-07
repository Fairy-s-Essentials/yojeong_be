# SSE (Server-Sent Events) 구현 변경 사항

## 📅 변경 일자
2025-12-07

## 🎯 변경 목적
`createSummaryController`의 AI 분석 작업이 너무 무거워서 응답 시간이 길어지는 문제를 해결하기 위해 SSE(Server-Sent Events) 패턴을 적용했습니다.

### 기존 방식의 문제점
- AI 분석 완료까지 클라이언트가 대기해야 함 (10~30초 소요)
- 타임아웃 위험
- 사용자 경험 저하 (진행 상황을 알 수 없음)

### 변경 후 개선점
- 즉시 `jobId` 반환 (응답 시간 < 100ms)
- 실시간 진행 상황 전송 (20% → 50% → 80% → 100%)
- 백그라운드 작업으로 서버 안정성 향상

---

## 📁 새로 생성된 파일

### 1. `src/types/sse.ts`
SSE 관련 타입 정의

```typescript
// Job 상태 타입
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 진행 단계 타입
type JobStep = 'validation' | 'ai_summary' | 'ai_evaluation' | 'saving' | 'completed' | 'failed';

// SSE Job 데이터 인터페이스
interface SSEJob {
  jobId: string;
  userId: number;
  status: JobStatus;
  currentStep: JobStep;
  progress: number; // 0-100
  message: string;
  result?: { resultId: number; usage: number; limit: number };
  error?: { code: string; message: string };
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. `src/services/sse.service.ts`
SSE 핵심 서비스 로직

**주요 기능:**
- `createJob(userId)`: 새 Job 생성 및 UUID 반환
- `registerClient(jobId, res, userId)`: SSE 클라이언트 연결 등록
- `processJob(jobId, jobData)`: 백그라운드 AI 분석 작업 처리
- `updateJob(jobId, updates)`: Job 상태 업데이트 및 SSE 이벤트 전송
- `getJobStatus(jobId, userId)`: Job 상태 조회 (폴링용)

**구현 방식:**
```typescript
class SSEService {
  // 인메모리 저장소 (Map 기반)
  private jobs: Map<string, SSEJob> = new Map();
  private clients: Map<string, SSEClient> = new Map();

  // 30분 후 자동 만료
  private readonly JOB_EXPIRY_MS = 30 * 60 * 1000;

  // 5분마다 만료된 Job 정리
  constructor() {
    setInterval(() => this.cleanupExpiredJobs(), 5 * 60 * 1000);
  }
}
```

### 3. `FRONTEND_SSE_GUIDE.md`
프론트엔드 적용 가이드 문서

---

## 📝 수정된 파일

### 1. `src/controllers/summary.controller.ts`

#### 변경 전 (동기 방식)
```typescript
export const createSummaryController = async (req, res, next) => {
  // ... 검증 로직 ...

  // AI 분석 (완료까지 대기)
  const aiSummaryResponse = await geminiService.aiSummary(originalText);
  const summaryEvaluationResponse = await geminiService.summaryEvaluation(...);

  // DB 저장
  const resultId = await insertSummary({ ... });

  // 사용량 업데이트
  const resultUsage = await updateUsage(userId);

  // 응답 (모든 작업 완료 후)
  return res.status(200).json({
    success: true,
    data: { resultId, usage, limit }
  });
};
```

#### 변경 후 (SSE 비동기 방식)
```typescript
export const createSummaryController = async (req, res, next) => {
  // ... 검증 로직 ...

  // Job 생성 (즉시)
  const jobId = sseService.createJob(userId);

  // 백그라운드 작업 시작 (await 없이)
  sseService.processJob(jobId, { userId, userInput });

  // 즉시 응답 (HTTP 202 Accepted)
  return res.status(202).json({
    success: true,
    message: '분석 작업이 시작되었습니다. SSE로 진행 상황을 구독하세요.',
    data: { jobId }
  });
};
```

#### 새로 추가된 컨트롤러

```typescript
// SSE 구독 엔드포인트
export const subscribeSummaryJobController = async (req, res, next) => {
  const { jobId } = req.params;
  const registered = sseService.registerClient(jobId, res, user.id);
  // SSE 연결 유지 (응답 종료하지 않음)
};

// Job 상태 조회 (폴링용)
export const getJobStatusController = async (req, res, next) => {
  const job = sseService.getJobStatus(jobId, user.id);
  return res.status(200).json({ success: true, data: job });
};
```

### 2. `src/routes/summaryRouter.ts`

#### 변경 전
```typescript
summaryRouter.post('/', createSummaryController);
summaryRouter.get('/:id', getSummaryDetailByIdController);
```

#### 변경 후
```typescript
// Summary 생성 (SSE jobId 반환)
summaryRouter.post('/', createSummaryController);

// SSE 구독 엔드포인트 (NEW)
summaryRouter.get('/sse/:jobId', subscribeSummaryJobController);

// Job 상태 조회 (NEW - 폴링 대비용)
summaryRouter.get('/job/:jobId', getJobStatusController);

summaryRouter.post('/learning-note', saveLearningNoteController);

// Summary 상세 조회 (맨 마지막 배치 - 라우트 충돌 방지)
summaryRouter.get('/:id', getSummaryDetailByIdController);
```

#### ⚠️ Express 5 호환성 수정
```typescript
// 변경 전 (Express 4 문법 - Express 5에서 에러 발생)
summaryRouter.get('/:id(\\d+)', getSummaryDetailByIdController);
// PathError: Unexpected ( at index 4

// 변경 후 (Express 5 호환)
summaryRouter.get('/:id', getSummaryDetailByIdController);
// 라우트 순서로 충돌 방지 (맨 마지막 배치)
```

---

## 🔄 API 흐름 변경

### 기존 흐름
```
Client                          Server
  |                               |
  |  POST /summary                |
  | ----------------------------> |
  |                               | (AI 분석 10~30초)
  |                               |
  |  200 OK { resultId }          |
  | <---------------------------- |
```

### 새로운 흐름
```
Client                          Server
  |                               |
  |  POST /summary                |
  | ----------------------------> |
  |  202 Accepted { jobId }       |
  | <---------------------------- | (즉시 응답)
  |                               |
  |  GET /summary/sse/:jobId      |
  | ----------------------------> | (SSE 연결)
  |                               |
  |  event: progress (20%)        |
  | <---------------------------- |
  |  event: progress (50%)        |
  | <---------------------------- |
  |  event: progress (80%)        |
  | <---------------------------- |
  |  event: completed (100%)      |
  | <---------------------------- |
  |                               |
```

---

## 📊 SSE 이벤트 구조

### progress 이벤트
```json
{
  "jobId": "uuid",
  "status": "processing",
  "step": "ai_evaluation",
  "progress": 50,
  "message": "AI가 요약을 평가하고 있습니다..."
}
```

### completed 이벤트
```json
{
  "jobId": "uuid",
  "status": "completed",
  "step": "completed",
  "progress": 100,
  "message": "분석이 완료되었습니다!",
  "result": {
    "resultId": 103,
    "usage": 5,
    "limit": 10
  }
}
```

### error 이벤트
```json
{
  "jobId": "uuid",
  "status": "failed",
  "step": "failed",
  "progress": 0,
  "message": "오류가 발생했습니다.",
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI 분석 중 오류가 발생했습니다."
  }
}
```

---

## 🛠️ 기술적 구현 세부사항

### 1. UUID 생성
```typescript
// uuid 패키지 대신 Node.js 내장 함수 사용
import { randomUUID } from 'crypto';
const jobId = randomUUID();
```

### 2. SSE 헤더 설정
```typescript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 비활성화
res.flushHeaders();
```

### 3. SSE 이벤트 전송 형식
```typescript
client.res.write(`event: ${eventType}\n`);
client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
```

### 4. 백그라운드 작업 처리
```typescript
// Promise를 await하지 않고 백그라운드로 실행
sseService.processJob(jobId, { userId, userInput });
// 즉시 다음 코드 실행 (응답 반환)
```

---

## 📌 주의사항

1. **인메모리 저장소**: 현재 Job 데이터는 인메모리에 저장되므로 서버 재시작 시 손실됩니다. 프로덕션에서는 Redis 사용을 권장합니다.

2. **Job 만료**: 30분 후 자동 만료되며, 5분마다 정리 작업이 실행됩니다.

3. **라우트 순서**: Express 5에서 `/:id` 같은 동적 라우트는 다른 정적 라우트(`/sse/:jobId`, `/job/:jobId`)보다 뒤에 배치해야 합니다.

4. **CORS**: SSE 연결에서 `withCredentials: true` 설정 시 CORS 설정이 올바르게 되어 있어야 합니다.

---

## 📚 관련 문서

- `FRONTEND_SSE_GUIDE.md`: 프론트엔드 적용 가이드

