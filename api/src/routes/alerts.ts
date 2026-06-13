import { Router } from 'express';

export const alertRouter = Router();

alertRouter.get('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

alertRouter.post('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

alertRouter.patch('/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

alertRouter.delete('/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});
