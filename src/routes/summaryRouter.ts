import { Router } from 'express';
import {
  getSummaryController,
  createSummaryController
} from '../controllers/summary.controller';

const summaryRouter = Router();

// POST /summaries - 사용자 요약 생성 및 AI 분석
summaryRouter.post('/', createSummaryController);

summaryRouter.get('/test', getSummaryController);

export default summaryRouter;
