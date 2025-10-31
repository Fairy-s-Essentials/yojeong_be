import { Router } from "express";
import summaryRouter from "./summaryRouter";

const RootRouter = Router();

RootRouter.use("/summary", summaryRouter);

export default RootRouter;
