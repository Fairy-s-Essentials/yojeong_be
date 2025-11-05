import { Router } from 'express';
import summaryRouter from './summaryRouter';
import testRouter from './testRouter';
import mainRouter from './mainRouter';
import authRouter from "./authRouter";

const RootRouter = Router();

RootRouter.use('/summary', summaryRouter);
RootRouter.use('/main', mainRouter);
RootRouter.use('/test', testRouter);
RootRouter.use("/auth", authRouter);

export default RootRouter;
