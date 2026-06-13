import { db } from './config/db';

// Pulls the set of symbols currently being watched by any user.
// This is the "demand-driven ingestion" pattern — only poll what matters.
export async function getActiveSymbols(): Promise<string[]> {
  const rows = await db('watchlist_items')
    .distinct('symbol')
    .orderBy('symbol', 'asc');

  return rows.map(r => r.symbol);
}
