import { Router } from 'express';
import { getUsageController } from '../controllers/usage.controller';

const usageRouter = Router();

usageRouter.get('/', getUsageController);

export default usageRouter;
