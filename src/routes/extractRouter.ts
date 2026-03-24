import { Router } from 'express';
import { extractController } from '../controllers/extract.controller';

const extractRouter = Router();

extractRouter.post('/', extractController);

export default extractRouter;
