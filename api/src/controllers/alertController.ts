import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getAlertsForUser,
  createAlert,
  getAlertById,
  updateAlertActive,
  deleteAlert,
} from '../services/alertService';

export async function listAlerts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const alerts = await getAlertsForUser(req.userId!);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

export async function createAlertHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { symbol, condition, target_price } = req.body;
    const alert = await createAlert(req.userId!, symbol, condition, target_price);
    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
}

export async function updateAlertHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body;

    const existing = await getAlertById(id, req.userId!);
    if (!existing) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alert = await updateAlertActive(id, req.userId!, is_active);
    res.json(alert);
  } catch (err) {
    next(err);
  }
}

export async function deleteAlertHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const deletedCount = await deleteAlert(id, req.userId!);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
