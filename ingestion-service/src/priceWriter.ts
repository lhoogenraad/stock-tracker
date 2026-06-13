import { db } from './config/db';
import { redis } from './config/redis';

const LATEST_PRICE_TTL_SECONDS = 30;

export async function writePrice(symbol: string, price: number, timestamp: number) {
  const recordedAt = new Date(timestamp * 1000);

  // Write to source of truth (Postgres)
  await db('price_history').insert({
    symbol,
    price,
    recorded_at: recordedAt,
  });

  // Write-through to cache — keeps "latest price" reads fast and DB-load-free
  const cacheValue = JSON.stringify({
    symbol,
    price,
    recorded_at: recordedAt.toISOString(),
  });

  try {
    await redis.set(`latest:${symbol}`, cacheValue, 'EX', LATEST_PRICE_TTL_SECONDS);
  } catch (err) {
    // Cache write failure shouldn't break ingestion — Postgres write already succeeded
    console.error(`Redis write failed for ${symbol}:`, err);
  }
}
