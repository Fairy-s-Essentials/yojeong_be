import { Router } from 'express';

import {
  getSummaryController,
  createSummaryController,
  getSummaryDetailByIdController,
  saveLearningNoteController,
  subscribeSummaryJobController,
  getJobStatusController
} from '../controllers/summary.controller';

const summaryRouter = Router();

summaryRouter.get('/test', getSummaryController);

// Summary 생성 (SSE jobId 반환)
summaryRouter.post('/', createSummaryController);

// SSE 구독 엔드포인트
summaryRouter.get('/sse/:jobId', subscribeSummaryJobController);

// Job 상태 조회 (폴링 대비용)
summaryRouter.get('/job/:jobId', getJobStatusController);

summaryRouter.post('/learning-note', saveLearningNoteController);

// Summary 상세 조회 (맨 마지막에 배치 - :id는 모든 경로와 매칭될 수 있음)
summaryRouter.get('/:id', getSummaryDetailByIdController);

export default summaryRouter;
