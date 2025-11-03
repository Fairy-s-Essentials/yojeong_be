
import { Router } from "express";
import summaryRouter from "./summaryRouter";
import testRouter from "./testRouter";

const RootRouter = Router();

RootRouter.use("/summary", summaryRouter);
RootRouter.use("/test", testRouter);


export default RootRouter;
