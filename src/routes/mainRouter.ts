import { Router } from 'express';
import {
  getMainAnalysisController,
  getMainRecentSummaryController,
  getHistoryAnalysisController,
  getAccuracyTrendController,
  getCalendarYearsController,
  getCalendarController
} from '../controllers/main.controller';

const mainRouter = Router();

mainRouter.get('/analysis', getMainAnalysisController);
mainRouter.get('/recent-summary', getMainRecentSummaryController);
mainRouter.get('/history/analysis', getHistoryAnalysisController);
mainRouter.get('/history/accuracy-trend', getAccuracyTrendController);
mainRouter.get('/history/calendar/years', getCalendarYearsController);
mainRouter.get('/history/calendar', getCalendarController);

export default mainRouter;
