import { Router } from 'express';

import { Request, Response } from 'express';
import {
  getRecentSummaryController,
  getSummaryController,

  createSummaryController

} from '../controllers/summary.controller';

const summaryRouter = Router();




summaryRouter.get('/test', getSummaryController);
summaryRouter.get('/recent', getRecentSummaryController);
summaryRouter.post('/', createSummaryController);



export default summaryRouter;
