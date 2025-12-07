import { Response } from 'express';
import { randomUUID } from 'crypto';
import { SSEJob, SSEEventData, SSEClient, CreateJobData } from '../types/sse';
import { insertSummary } from '../models/summary.model';
import { updateUsage } from '../models/usage.model';
import geminiService from './gemini.service';

class SSEService {
  // Job 저장소 (인메모리)
  private jobs: Map<string, SSEJob> = new Map();

  // SSE 클라이언트 연결 저장소
  private clients: Map<string, SSEClient> = new Map();

  // Job 만료 시간 (30분)
  private readonly JOB_EXPIRY_MS = 30 * 60 * 1000;

  // 주기적으로 만료된 Job 정리
  constructor() {
    setInterval(() => this.cleanupExpiredJobs(), 5 * 60 * 1000); // 5분마다
  }

  /**
   * 새 Job 생성
   */
  createJob(userId: number): string {
    const jobId = randomUUID();
    const now = new Date();

    const job: SSEJob = {
      jobId,
      userId,
      status: 'pending',
      currentStep: 'validation',
      progress: 0,
      message: '작업을 시작합니다...',
      createdAt: now,
      updatedAt: now
    };

    this.jobs.set(jobId, job);
    return jobId;
  }

  /**
   * Job 조회
   */
  getJob(jobId: string): SSEJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Job 상태 업데이트 및 SSE 이벤트 전송
   */
  updateJob(
    jobId: string,
    updates: Partial<
      Pick<
        SSEJob,
        'status' | 'currentStep' | 'progress' | 'message' | 'result' | 'error'
      >
    >
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Job 업데이트
    Object.assign(job, updates, { updatedAt: new Date() });
    this.jobs.set(jobId, job);

    // 연결된 클라이언트에 이벤트 전송
    this.sendEventToClient(jobId);
  }

  /**
   * SSE 클라이언트 연결 등록
   */
  registerClient(jobId: string, res: Response, userId: number): boolean {
    const job = this.jobs.get(jobId);

    // Job이 없거나 다른 사용자의 Job인 경우
    if (!job || job.userId !== userId) {
      return false;
    }

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 비활성화
    res.flushHeaders();

    // 클라이언트 등록
    this.clients.set(jobId, { res, userId });

    // 현재 상태 즉시 전송
    this.sendEventToClient(jobId);

    // 연결 종료 시 클라이언트 제거
    res.on('close', () => {
      this.clients.delete(jobId);
    });

    return true;
  }

  /**
   * SSE 이벤트 전송
   */
  private sendEventToClient(jobId: string): void {
    const client = this.clients.get(jobId);
    const job = this.jobs.get(jobId);

    if (!client || !job) return;

    const eventData: SSEEventData = {
      jobId: job.jobId,
      status: job.status,
      step: job.currentStep,
      progress: job.progress,
      message: job.message,
      result: job.result,
      error: job.error
    };

    const eventType =
      job.status === 'completed'
        ? 'completed'
        : job.status === 'failed'
          ? 'error'
          : 'progress';

    client.res.write(`event: ${eventType}\n`);
    client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);

    // 완료 또는 실패 시 연결 종료
    if (job.status === 'completed' || job.status === 'failed') {
      client.res.end();
      this.clients.delete(jobId);
    }
  }

  /**
   * 백그라운드 작업 처리
   */
  async processJob(jobId: string, jobData: CreateJobData): Promise<void> {
    try {
      const { userId, userInput } = jobData;
      const {
        originalText,
        originalUrl,
        difficultyLevel,
        userSummary,
        criticalWeakness,
        criticalOpposite
      } = userInput;

      // Step 1: AI 요약 생성
      this.updateJob(jobId, {
        status: 'processing',
        currentStep: 'ai_summary',
        progress: 20,
        message: 'AI가 원문을 분석하고 있습니다...'
      });

      const aiSummaryResponse = await geminiService.aiSummary(originalText);

      // Step 2: AI 평가
      this.updateJob(jobId, {
        currentStep: 'ai_evaluation',
        progress: 50,
        message: 'AI가 요약을 평가하고 있습니다...'
      });

      const summaryEvaluationResponse = await geminiService.summaryEvaluation(
        originalText,
        userSummary,
        aiSummaryResponse.aiSummary,
        criticalWeakness,
        criticalOpposite
      );

      // Step 3: DB 저장
      this.updateJob(jobId, {
        currentStep: 'saving',
        progress: 80,
        message: '결과를 저장하고 있습니다...'
      });

      const resultId = await insertSummary({
        userId,
        originalText,
        originalUrl,
        difficultyLevel,
        userSummary,
        criticalWeakness,
        criticalOpposite,
        ...summaryEvaluationResponse
      });

      // Step 4: 사용량 업데이트
      const resultUsage = await updateUsage(userId);

      // Step 5: 완료
      this.updateJob(jobId, {
        status: 'completed',
        currentStep: 'completed',
        progress: 100,
        message: '분석이 완료되었습니다!',
        result: {
          resultId: Number(resultId),
          usage: resultUsage.usage,
          limit: resultUsage.limit
        }
      });
    } catch (error: unknown) {
      console.error('SSE Job 처리 중 오류:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      const isAIError = errorMessage.includes('AI_SERVICE_ERROR');

      this.updateJob(jobId, {
        status: 'failed',
        currentStep: 'failed',
        progress: 0,
        message: '오류가 발생했습니다.',
        error: {
          code: isAIError ? 'AI_SERVICE_ERROR' : 'PROCESSING_ERROR',
          message: isAIError
            ? 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            : '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
      });
    }
  }

  /**
   * 만료된 Job 정리
   */
  private cleanupExpiredJobs(): void {
    const now = Date.now();
    const expiredJobs: string[] = [];

    this.jobs.forEach((job, jobId) => {
      if (now - job.createdAt.getTime() > this.JOB_EXPIRY_MS) {
        expiredJobs.push(jobId);
      }
    });

    expiredJobs.forEach((jobId) => {
      this.jobs.delete(jobId);
      this.clients.delete(jobId);
    });

    if (expiredJobs.length > 0) {
      console.log(`[SSE] ${expiredJobs.length}개의 만료된 Job 정리됨`);
    }
  }

  /**
   * Job 상태 조회 (폴링 대비용)
   */
  getJobStatus(jobId: string, userId: number): SSEJob | null {
    const job = this.jobs.get(jobId);

    if (!job || job.userId !== userId) {
      return null;
    }

    return job;
  }
}

export default new SSEService();
