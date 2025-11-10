import { Router } from 'express';
import {
  getHistoryAnalysisController,
  getAccuracyTrendController,
  getCalendarYearsController,
  getCalendarController
} from '../controllers/history.controller';
import { getSummariesController } from '../controllers/summary.controller';

const historyRouter = Router();

historyRouter.get('/analysis', getHistoryAnalysisController);
historyRouter.get('/accuracy-trend', getAccuracyTrendController);
historyRouter.get('/calendar/years', getCalendarYearsController);
historyRouter.get('/calendar', getCalendarController);
historyRouter.get('/summaries', getSummariesController);

export default historyRouter;


