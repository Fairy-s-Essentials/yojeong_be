import { Router } from 'express';

import {
  getSummaryController,
  createSummaryController
} from '../controllers/summary.controller';

const summaryRouter = Router();

summaryRouter.get('/test', getSummaryController);

summaryRouter.post('/', createSummaryController);

export default summaryRouter;
