import { db } from './config/db';
import { redis } from './config/redis';

const LATEST_PRICE_TTL_SECONDS = 30;

export async function writePrice(symbol: string, price: number, timestamp: number) {
  const recordedAt = new Date(timestamp * 1000);
  price = Math.random()*100;

  await db('price_history').insert({
    symbol,
    price,
    recorded_at: recordedAt,
  });

  const payload = JSON.stringify({
    symbol,
    price,
    recorded_at: recordedAt.toISOString(),
  });

  try {
    await redis.set(`latest:${symbol}`, payload, 'EX', LATEST_PRICE_TTL_SECONDS);
    await redis.publish('prices', payload);
  } catch (err) {
    console.error(`Redis write/publish failed for ${symbol}:`, err);
  }
}
