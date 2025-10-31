import { Router } from 'express';
import { testGeminiController } from '../controllers/test.controller';

const testRouter = Router();

testRouter.post('/gemini', testGeminiController);

export default testRouter;
