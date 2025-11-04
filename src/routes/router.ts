import { Router } from 'express';
import summaryRouter from './summaryRouter';
import testRouter from './testRouter';
import mainRouter from './mainRouter';

const RootRouter = Router();

RootRouter.use('/summary', summaryRouter);
RootRouter.use('/main', mainRouter);
RootRouter.use('/test', testRouter);

export default RootRouter;
