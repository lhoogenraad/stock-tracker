import { Router } from 'express';
import { db } from '../config/db';

export const healthRouter = Router();

healthRouter.get('/', async (req, res, next) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected', yeji: "kim" });
  } catch (err) {
    next(err);
  }
});
