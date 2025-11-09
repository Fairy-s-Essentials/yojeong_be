import { Router } from 'express';

import {
  getSummaryController,
  createSummaryController,
  getSummaryDetailByIdController,
  saveLearningNoteController
} from '../controllers/summary.controller';

const summaryRouter = Router();

summaryRouter.get('/test', getSummaryController);

summaryRouter.post('/', createSummaryController);

summaryRouter.get('/:id', getSummaryDetailByIdController);

summaryRouter.post('/learning-note', saveLearningNoteController);

export default summaryRouter;
