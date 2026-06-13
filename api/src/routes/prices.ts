import { Router } from 'express';

export const priceRouter = Router();

priceRouter.get('/:symbol/history', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

priceRouter.get('/:symbol/latest', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});
