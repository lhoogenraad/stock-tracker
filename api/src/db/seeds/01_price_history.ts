import type { Knex } from 'knex';

const SYMBOLS = ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];
const BASE_PRICES: Record<string, number> = {
  AAPL: 190,
  GOOGL: 175,
  TSLA: 250,
  MSFT: 430,
};

export async function seed(knex: Knex): Promise<void> {
  await knex('price_history').del();

  const rows: { symbol: string; price: number; recorded_at: Date }[] = [];
  const now = Date.now();
  const intervalMs = 5 * 60 * 1000; // 5-minute ticks
  const numTicks = 288; // ~24 hours of data

  for (const symbol of SYMBOLS) {
    let price = BASE_PRICES[symbol];

    for (let i = numTicks; i >= 0; i--) {
      // Random walk: small % change each tick
      const changePercent = (Math.random() - 0.5) * 0.01; // ±0.5%
      price = price * (1 + changePercent);

      rows.push({
        symbol,
        price: Math.round(price * 100) / 100,
        recorded_at: new Date(now - i * intervalMs),
      });
    }
  }

  // Batch insert to avoid one giant query
  const BATCH_SIZE = 200;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await knex('price_history').insert(rows.slice(i, i + BATCH_SIZE));
  }

  console.log(`Seeded ${rows.length} price_history rows for ${SYMBOLS.join(', ')}`);
}
