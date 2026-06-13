import { db } from './config/db';

export async function writePrice(symbol: string, price: number, timestamp: number) {
  await db('price_history').insert({
    symbol,
    price,
    recorded_at: new Date(timestamp * 1000), // Finnhub timestamps are unix seconds
  });
}
