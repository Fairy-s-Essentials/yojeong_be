import { Router } from 'express';
import summaryRouter from './summaryRouter';

const RootRouter = Router();

RootRouter.use('/summaries', summaryRouter);

export default RootRouter;
