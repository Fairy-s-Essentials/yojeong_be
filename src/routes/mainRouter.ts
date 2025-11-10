import { Router } from 'express';
import {
  getMainAnalysisController,
  getMainRecentSummaryController,
} from '../controllers/main.controller';
import historyRouter from './historyRouter';

const mainRouter = Router();

mainRouter.get('/analysis', getMainAnalysisController);
mainRouter.get('/recent-summary', getMainRecentSummaryController);
mainRouter.use('/history', historyRouter);

export default mainRouter;
