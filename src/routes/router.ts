import { Router } from 'express';
import summaryRouter from './summaryRouter';
import testRouter from './testRouter';
import mainRouter from './mainRouter';
import authRouter from "./authRouter";
import historyRouter from './historyRouter';
import usageRouter from './UsageRouter';

const RootRouter = Router();

RootRouter.use('/summary', summaryRouter);
RootRouter.use('/main', mainRouter);
RootRouter.use('/test', testRouter);
RootRouter.use("/auth", authRouter);
RootRouter.use("/history", historyRouter);
RootRouter.use("/usage-limit", usageRouter);

export default RootRouter;
