import { Request, Response, NextFunction } from 'express';

import {
  getScoreAverageByUserId,
  getSummaryDetailById,
  getSummariesWithPagination,
  getTotalSummariesCount
} from '../models/summary.model';
import { getUsageByUserId } from '../models/usage.model';
import { isUsageLimitExceeded } from '../utils/validation.util';
import { getTestSummary, saveLearningNote } from '../services/summary.service';
import {
  CreateSummaryReqBody,
  GetSummariesQueryParams,
  SummaryListItem,
  PaginationInfo
} from '../types/summary';
import validationService from '../services/validation.service';
import { sendAuthError } from '../utils/auth.util';
import sseService from '../services/sse.service';

export const getSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await getTestSummary();
    return res.status(200).json({
      success: true,
      message: 'Summary 조회 성공',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Summary 생성 컨트롤러 (SSE 버전)
 * 즉시 jobId를 반환하고 백그라운드에서 AI 분석 처리
 */
export const createSummaryController = async (
  req: Request<object, object, CreateSummaryReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.session;
    console.log('user in createSummaryController', user);
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;
    const userInput = req.body;

    // 사용자 분석 사용량 검증
    const { usage, limit } = await getUsageByUserId(userId);

    if (isUsageLimitExceeded(usage, limit)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'USAGE_LIMIT_EXCEEDED',
          message: '오늘의 분석 요청 가능 횟수를 모두 사용했습니다.',
          details: `오늘 ${usage}/${limit}회 사용했습니다. 내일 다시 시도해주세요.`
        }
      });
    }

    // 사용자 입력값 검증 (기본 검증 + 보안 검증)
    const validation = await validationService.validateSummaryCreate(userInput);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: validation.code || 'VALIDATION_ERROR',
          message: validation.message,
          details: validation.details
        }
      });
    }

    // Job 생성 및 즉시 응답
    const jobId = sseService.createJob(userId);

    // 백그라운드에서 AI 분석 작업 처리 (Promise를 기다리지 않음)
    sseService.processJob(jobId, {
      userId,
      userInput
    });

    // 즉시 jobId 반환
    return res.status(202).json({
      success: true,
      message: '분석 작업이 시작되었습니다. SSE로 진행 상황을 구독하세요.',
      data: {
        jobId
      }
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * SSE 구독 엔드포인트
 * 클라이언트가 jobId로 작업 진행 상황을 실시간으로 수신
 */
export const subscribeSummaryJobController = async (
  req: Request<{ jobId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }

    const { jobId } = req.params;

    // SSE 클라이언트 등록
    const registered = sseService.registerClient(jobId, res, user.id);

    if (!registered) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: '해당 작업을 찾을 수 없습니다.'
        }
      });
    }

    // SSE 연결이 유지되므로 여기서 응답을 보내지 않음
    // sseService.registerClient 내부에서 SSE 이벤트를 전송함
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Job 상태 조회 (폴링 대비용)
 * SSE가 지원되지 않는 환경에서 사용
 */
export const getJobStatusController = async (
  req: Request<{ jobId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }

    const { jobId } = req.params;
    const job = sseService.getJobStatus(jobId, user.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: '해당 작업을 찾을 수 없습니다.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        jobId: job.jobId,
        status: job.status,
        step: job.currentStep,
        progress: job.progress,
        message: job.message,
        result: job.result,
        error: job.error
      }
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getSummaryDetailByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;
    const { id } = req.params;

    const averageScore = await getScoreAverageByUserId(userId);

    const summary = await getSummaryDetailById(Number(id));
    const returnData = {
      id: summary.id,
      originalText: summary.original_text,
      originalUrl: summary.original_url,
      userSummary: summary.user_summary,
      criticalWeakness: summary.critical_weakness,
      criticalOpposite: summary.critical_opposite,
      aiSummary: summary.ai_summary,
      similarityScore: summary.similarity_score,
      averageScore,
      aiWellUnderstood: JSON.parse(summary.ai_well_understood),
      aiMissedPoints: JSON.parse(summary.ai_missed_points),
      aiImprovements: JSON.parse(summary.ai_improvements),
      learningNote: summary.learning_note,
      createdAt: summary.created_at
    };

    if (returnData.id === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUMMARY_NOT_FOUND',
          message: 'Summary를 찾을 수 없습니다.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Summary 상세 조회 성공',
      data: returnData
    });
  } catch (error) {
    next(error);
  }
};

export const saveLearningNoteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }
    const { id, learningNote } = req.body;
    const result = await saveLearningNote(Number(id), learningNote);
    return res.status(200).json({
      success: true,
      message: 'Learning Note 저장 성공',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 요약 목록 조회 컨트롤러 (페이지네이션, 검색, 정렬)
 */
export const getSummariesController = async (
  req: Request<object, object, object, GetSummariesQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.session;
    if (!user) {
      sendAuthError(res);
      return;
    }
    const userId = user.id;

    // 쿼리 파라미터 파싱 및 기본값 설정
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 5));
    const isLatest = req.query.isLatest !== 'false'; // 기본값 true
    const search = req.query.search?.trim() || undefined;

    // 전체 개수 조회
    const totalItems = await getTotalSummariesCount(userId, search);

    // 페이지네이션 계산
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // 데이터 조회
    const summaries = await getSummariesWithPagination(
      userId,
      page,
      limit,
      isLatest,
      search
    );

    // 응답 데이터 포맷팅
    const items: SummaryListItem[] = summaries.map(
      (summary: {
        id: number;
        user_summary: string;
        similarity_score: number;
        created_at: string;
      }) => {
        // userSummary를 100자로 제한
        const fullSummary = summary.user_summary || '';
        const truncatedSummary =
          fullSummary.length > 100
            ? fullSummary.substring(0, 100) + '...'
            : fullSummary;

        return {
          id: summary.id,
          userSummary: truncatedSummary,
          similarityScore: summary.similarity_score,
          createdAt: summary.created_at
        };
      }
    );

    const pagination: PaginationInfo = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNext,
      hasPrev
    };

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination
      }
    });
  } catch (error) {
    console.error('요약 목록 조회 실패:', error);
    next(error);
  }
};
