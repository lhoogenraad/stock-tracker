import { db } from '../config/db';

export async function getLatestPrice(symbol: string) {
  return db('price_history')
    .where({ symbol: symbol.toUpperCase() })
    .orderBy('recorded_at', 'desc')
    .first();
}

export async function getPriceHistory(
  symbol: string,
  options: { limit?: number; from?: Date; to?: Date }
) {
  const query = db('price_history')
    .where({ symbol: symbol.toUpperCase() })
    .orderBy('recorded_at', 'desc');

  if (options.from) {
    query.andWhere('recorded_at', '>=', options.from);
  }
  if (options.to) {
    query.andWhere('recorded_at', '<=', options.to);
  }

  query.limit(options.limit ?? 100);

  return query;
}
