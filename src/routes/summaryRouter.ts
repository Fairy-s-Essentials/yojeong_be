import { Router } from "express";
import { Request, Response } from "express";
import { getSummaryController } from "../controllers/summary.controller";

const summaryRouter = Router();

summaryRouter.get(
  "/",
  (req: Request, res: Response): Response<{ message: string }> => {
    return res.status(200).json({ message: "Hello, World!" });
  }
);

summaryRouter.get("/test", getSummaryController);

export default summaryRouter;
