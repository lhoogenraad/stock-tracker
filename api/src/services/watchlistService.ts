import { db } from '../config/db';

export async function getWatchlistsForUser(userId: number) {
  return db('watchlists').where({ user_id: userId }).orderBy('created_at', 'asc');
}

export async function createWatchlist(userId: number, name?: string) {
  const [watchlist] = await db('watchlists')
    .insert({ user_id: userId, name: name ?? 'My Watchlist' })
    .returning('*');
  return watchlist;
}

export async function getWatchlistById(id: number, userId: number) {
  return db('watchlists').where({ id, user_id: userId }).first();
}

export async function deleteWatchlist(id: number, userId: number) {
  return db('watchlists').where({ id, user_id: userId }).del();
}

export async function getWatchlistItems(watchlistId: number) {
  return db('watchlist_items').where({ watchlist_id: watchlistId }).orderBy('added_at', 'asc');
}

export async function addWatchlistItem(watchlistId: number, symbol: string) {
  const [item] = await db('watchlist_items')
    .insert({ watchlist_id: watchlistId, symbol: symbol.toUpperCase() })
    .returning('*')
    .onConflict(['watchlist_id', 'symbol'])
    .ignore();
  return item;
}

export async function removeWatchlistItem(watchlistId: number, symbol: string) {
  return db('watchlist_items')
    .where({ watchlist_id: watchlistId, symbol: symbol.toUpperCase() })
    .del();
}
