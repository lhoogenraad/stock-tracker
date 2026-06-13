import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { watchlistRouter } from './routes/watchlists';
import { priceRouter } from './routes/prices';
import { alertRouter } from './routes/alerts';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/watchlists', watchlistRouter);
app.use('/api/prices', priceRouter);
app.use('/api/alerts', alertRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler — every controller should call next(err)
// rather than res.status().json() directly on errors.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});
