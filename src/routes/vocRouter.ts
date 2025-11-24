import { Router } from 'express';
import { createVocController } from '../controllers/voc.controller';

const vocRouter = Router();

vocRouter.post('/', createVocController);

export default vocRouter;
