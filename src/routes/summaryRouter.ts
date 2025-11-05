import { Router } from 'express';

import {
  getSummaryController,
  createSummaryController,
  getSummaryDetailByIdController
} from '../controllers/summary.controller';

const summaryRouter = Router();

summaryRouter.get('/test', getSummaryController);

summaryRouter.post('/', createSummaryController);

summaryRouter.get('/:id', getSummaryDetailByIdController);

export default summaryRouter;
