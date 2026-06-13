import { Request, Response, NextFunction } from 'express';
import { getLatestPrice, getPriceHistory } from '../services/priceService';

export async function getLatest(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const price = await getLatestPrice(symbol);

    if (!price) {
      return res.status(404).json({ error: `No price data for symbol ${symbol.toUpperCase()}` });
    }

    res.json(price);
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const { limit, from, to } = req.query as unknown as { limit?: number; from?: Date; to?: Date };

    const history = await getPriceHistory(symbol, { limit, from, to });

    if (history.length === 0) {
      return res.status(404).json({ error: `No price data for symbol ${symbol.toUpperCase()}` });
    }

    res.json(history);
  } catch (err) {
    next(err);
  }
}
