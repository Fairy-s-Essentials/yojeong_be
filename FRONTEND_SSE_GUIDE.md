# 프론트엔드 SSE 적용 가이드

## 개요

`POST /summary` API가 SSE(Server-Sent Events) 방식으로 변경되었습니다.  
기존에는 요청 후 AI 분석이 완료될 때까지 대기했지만, 이제는 즉시 `jobId`를 반환하고 백그라운드에서 처리합니다.

## API 변경 사항

### 1. Summary 생성 요청

**Endpoint:** `POST /summary`

**Request Body:** (변경 없음)

```json
{
  "originalText": "원문 텍스트",
  "originalUrl": "https://example.com (선택)",
  "difficultyLevel": 3,
  "userSummary": "사용자가 작성한 요약",
  "criticalWeakness": "약점 분석 (선택)",
  "criticalOpposite": "반대 의견 (선택)"
}
```

**Response:** (변경됨 - HTTP 202 Accepted)

```json
{
  "success": true,
  "message": "분석 작업이 시작되었습니다. SSE로 진행 상황을 구독하세요.",
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 2. SSE 구독 (진행 상황 실시간 수신)

**Endpoint:** `GET /summary/sse/:jobId`

**사용 예시:**

```typescript
const eventSource = new EventSource(`${API_BASE_URL}/summary/sse/${jobId}`, {
  withCredentials: true
});

// 진행 상황 이벤트
eventSource.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data);
  // { jobId, status, step, progress, message }
});

// 완료 이벤트
eventSource.addEventListener('completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('Completed:', data);
  // { jobId, status, step, progress, message, result }
  eventSource.close();
});

// 에러 이벤트
eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Error:', data);
  // { jobId, status, step, progress, message, error }
  eventSource.close();
});

// 연결 에러 처리
eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
};
```

### 3. Job 상태 조회 (폴링 대비용)

SSE가 지원되지 않는 환경에서 사용합니다.

**Endpoint:** `GET /summary/job/:jobId`

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "step": "ai_evaluation",
    "progress": 50,
    "message": "AI가 요약을 평가하고 있습니다...",
    "result": null,
    "error": null
  }
}
```

## SSE 이벤트 타입

### 1. `progress` 이벤트

작업이 진행 중일 때 전송됩니다.

```typescript
interface ProgressEvent {
  jobId: string;
  status: 'pending' | 'processing';
  step: 'validation' | 'ai_summary' | 'ai_evaluation' | 'saving';
  progress: number; // 0-100
  message: string;
}
```

### 2. `completed` 이벤트

작업이 성공적으로 완료되었을 때 전송됩니다.

```typescript
interface CompletedEvent {
  jobId: string;
  status: 'completed';
  step: 'completed';
  progress: 100;
  message: string;
  result: {
    resultId: number; // 생성된 Summary ID
    usage: number; // 현재 사용량
    limit: number; // 일일 제한
  };
}
```

### 3. `error` 이벤트

작업이 실패했을 때 전송됩니다.

```typescript
interface ErrorEvent {
  jobId: string;
  status: 'failed';
  step: 'failed';
  progress: 0;
  message: string;
  error: {
    code: 'AI_SERVICE_ERROR' | 'PROCESSING_ERROR';
    message: string;
  };
}
```

## 진행 단계 (Step)

| Step            | Progress | 설명                             |
| --------------- | -------- | -------------------------------- |
| `validation`    | 0%       | 검증 완료                        |
| `ai_summary`    | 20%      | AI가 원문을 분석하고 있습니다... |
| `ai_evaluation` | 50%      | AI가 요약을 평가하고 있습니다... |
| `saving`        | 80%      | 결과를 저장하고 있습니다...      |
| `completed`     | 100%     | 분석이 완료되었습니다!           |
| `failed`        | 0%       | 오류가 발생했습니다.             |

## 프론트엔드 구현 예시 (React)

### 1. Custom Hook

```typescript
// hooks/useSummarySSE.ts
import { useState, useCallback } from 'react';

interface SSEState {
  isLoading: boolean;
  progress: number;
  step: string;
  message: string;
  result: { resultId: number; usage: number; limit: number } | null;
  error: { code: string; message: string } | null;
}

export const useSummarySSE = () => {
  const [state, setState] = useState<SSEState>({
    isLoading: false,
    progress: 0,
    step: '',
    message: '',
    result: null,
    error: null
  });

  const createSummary = useCallback(async (data: CreateSummaryRequest) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      result: null
    }));

    try {
      // 1. Summary 생성 요청 → jobId 반환
      const response = await fetch(`${API_BASE_URL}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const json = await response.json();

      if (!json.success) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: json.error
        }));
        return;
      }

      const { jobId } = json.data;

      // 2. SSE 구독
      const eventSource = new EventSource(
        `${API_BASE_URL}/summary/sse/${jobId}`,
        { withCredentials: true }
      );

      eventSource.addEventListener('progress', (event) => {
        const eventData = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          progress: eventData.progress,
          step: eventData.step,
          message: eventData.message
        }));
      });

      eventSource.addEventListener('completed', (event) => {
        const eventData = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          progress: 100,
          step: 'completed',
          message: eventData.message,
          result: eventData.result
        }));
        eventSource.close();
      });

      eventSource.addEventListener('error', (event) => {
        const eventData = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          progress: 0,
          step: 'failed',
          message: eventData.message,
          error: eventData.error
        }));
        eventSource.close();
      });

      eventSource.onerror = () => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: { code: 'CONNECTION_ERROR', message: '연결이 끊어졌습니다.' }
        }));
        eventSource.close();
      };
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '네트워크 오류가 발생했습니다.'
        }
      }));
    }
  }, []);

  return { ...state, createSummary };
};
```

### 2. 컴포넌트 사용 예시

```tsx
// components/SummaryForm.tsx
import { useSummarySSE } from '../hooks/useSummarySSE';

export const SummaryForm = () => {
  const { isLoading, progress, step, message, result, error, createSummary } =
    useSummarySSE();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSummary({
      originalText: '...',
      userSummary: '...'
      // ...
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드들 */}

      <button type="submit" disabled={isLoading}>
        {isLoading ? '분석 중...' : '분석 시작'}
      </button>

      {/* 진행 상황 표시 */}
      {isLoading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <p>{message}</p>
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="result">
          <p>분석 완료! (ID: {result.resultId})</p>
          <p>
            오늘 사용량: {result.usage}/{result.limit}
          </p>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="error">
          <p>{error.message}</p>
        </div>
      )}
    </form>
  );
};
```

### 3. Progress Bar 컴포넌트 예시

```tsx
// components/ProgressBar.tsx
interface ProgressBarProps {
  progress: number;
  step: string;
  message: string;
}

const stepLabels: Record<string, string> = {
  validation: '검증 중',
  ai_summary: 'AI 요약 생성',
  ai_evaluation: 'AI 평가',
  saving: '저장 중',
  completed: '완료'
};

export const ProgressBar = ({ progress, step, message }: ProgressBarProps) => {
  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="step-label">{stepLabels[step] || step}</span>
        <span className="progress-percent">{progress}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-message">{message}</p>
    </div>
  );
};
```

## CORS 및 인증 관련 주의사항

### 1. withCredentials 설정

SSE 연결 시 쿠키 기반 세션 인증을 위해 `withCredentials: true` 설정이 필요합니다.

```typescript
const eventSource = new EventSource(url, { withCredentials: true });
```

### 2. EventSource polyfill (선택)

기본 `EventSource`는 `withCredentials`를 지원하지 않는 브라우저가 있습니다.  
필요시 `event-source-polyfill` 패키지를 사용하세요.

```bash
npm install event-source-polyfill
```

```typescript
import { EventSourcePolyfill } from 'event-source-polyfill';

const eventSource = new EventSourcePolyfill(url, {
  withCredentials: true
});
```

## 기존 API와의 호환성

기존 동기 방식 API가 필요한 경우, 다음과 같이 폴링 방식으로 대체할 수 있습니다:

```typescript
const pollJobStatus = async (jobId: string): Promise<JobResult> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const response = await fetch(`${API_BASE_URL}/summary/job/${jobId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.data.status === 'completed') {
        clearInterval(interval);
        resolve(data.data.result);
      } else if (data.data.status === 'failed') {
        clearInterval(interval);
        reject(data.data.error);
      }
    }, 1000); // 1초마다 폴링
  });
};
```

## 에러 코드

| 코드                   | 설명                |
| ---------------------- | ------------------- |
| `USAGE_LIMIT_EXCEEDED` | 일일 사용량 초과    |
| `VALIDATION_ERROR`     | 입력값 검증 실패    |
| `JOB_NOT_FOUND`        | 작업을 찾을 수 없음 |
| `AI_SERVICE_ERROR`     | AI 분석 중 오류     |
| `PROCESSING_ERROR`     | 처리 중 오류        |

## 타임아웃 및 재시도

- Job은 생성 후 30분 후 자동으로 만료됩니다.
- SSE 연결이 끊어진 경우, 같은 `jobId`로 다시 연결할 수 있습니다.
- 완료된 작업도 30분 동안은 `/summary/job/:jobId`로 조회 가능합니다.
