import { Router } from 'express';
import { getUsageController } from '../controllers/usage.controller';

const usageRouter = Router();

usageRouter.post('/', getUsageController);

export default usageRouter;
