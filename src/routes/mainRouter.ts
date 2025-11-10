import { Router } from 'express';
import {
  getMainAnalysisController,
  getMainRecentSummaryController,
} from '../controllers/main.controller';

const mainRouter = Router();

mainRouter.get('/analysis', getMainAnalysisController);
mainRouter.get('/recent-summary', getMainRecentSummaryController);

export default mainRouter;
