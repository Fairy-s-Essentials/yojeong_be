
import { Router } from "express";
import summaryRouter from "./summaryRouter";
import testRouter from "./testRouter";
import authRouter from "./authRouter";

const RootRouter = Router();

RootRouter.use("/summary", summaryRouter);
RootRouter.use("/test", testRouter);
RootRouter.use("/auth", authRouter);


export default RootRouter;
