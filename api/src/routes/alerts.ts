import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createAlertSchema, updateAlertSchema } from '../schemas/alert';
import {
  listAlerts,
  createAlertHandler,
  updateAlertHandler,
  deleteAlertHandler,
} from '../controllers/alertController';

export const alertRouter = Router();

alertRouter.use(requireAuth);

alertRouter.get('/', listAlerts);
alertRouter.post('/', validateBody(createAlertSchema), createAlertHandler);
alertRouter.patch('/:id', validateBody(updateAlertSchema), updateAlertHandler);
alertRouter.delete('/:id', deleteAlertHandler);
