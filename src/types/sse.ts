import { CreateSummaryReqBody } from './summary';

/**
 * SSE Job 상태
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * SSE 진행 단계
 */
export type JobStep =
  | 'validation' // 검증 완료
  | 'ai_summary' // AI 요약 생성 중
  | 'ai_evaluation' // AI 평가 중
  | 'saving' // DB 저장 중
  | 'completed' // 완료
  | 'failed'; // 실패

/**
 * SSE 이벤트 타입
 */
export type SSEEventType = 'progress' | 'completed' | 'error';

/**
 * SSE Job 데이터
 */
export interface SSEJob {
  jobId: string;
  userId: number;
  status: JobStatus;
  currentStep: JobStep;
  progress: number; // 0-100
  message: string;
  result?: {
    resultId: number;
    usage: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SSE 이벤트 데이터
 */
export interface SSEEventData {
  jobId: string;
  status: JobStatus;
  step: JobStep;
  progress: number;
  message: string;
  result?: SSEJob['result'];
  error?: SSEJob['error'];
}

/**
 * Job 생성 요청 데이터
 */
export interface CreateJobData {
  userId: number;
  userInput: CreateSummaryReqBody;
}

/**
 * SSE 클라이언트 연결
 */
export interface SSEClient {
  res: import('express').Response;
  userId: number;
}
