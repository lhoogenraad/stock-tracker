import { Router } from 'express';
import { validateQuery } from '../middleware/validate';
import { priceHistoryQuerySchema } from '../schemas/price';
import { getLatest, getHistory } from '../controllers/priceController';

export const priceRouter = Router();

priceRouter.get('/:symbol/latest', getLatest);
priceRouter.get('/:symbol/history', validateQuery(priceHistoryQuerySchema), getHistory);
