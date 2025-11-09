import { Router } from 'express';
import {
  getMainAnalysisController,
  getMainRecentSummaryController,
  getHistoryAnalysisController
} from '../controllers/main.controller';

const mainRouter = Router();

mainRouter.get('/analysis', getMainAnalysisController);
mainRouter.get('/recent-summary', getMainRecentSummaryController);
mainRouter.get('/history/analysis', getHistoryAnalysisController);

export default mainRouter;
