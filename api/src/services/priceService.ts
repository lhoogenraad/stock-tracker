import { db } from '../config/db';
import { redis } from '../config/redis';

export async function getLatestPrice(symbol: string) {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `latest:${upperSymbol}`;

  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { ...JSON.parse(cached), _source: 'cache' };
    }
  } catch (err) {
    console.error(`Redis read failed for ${cacheKey}:`, err);
    // Fall through to DB on cache failure
  }

  // Cache miss or Redis unavailable — fall back to Postgres
  const row = await db('price_history')
    .where({ symbol: upperSymbol })
    .orderBy('recorded_at', 'desc')
    .first();

  if (!row) return null;

  return { ...row, _source: 'db' };
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
