import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getWatchlistsForUser,
  createWatchlist,
  getWatchlistById,
  deleteWatchlist,
  getWatchlistItems,
  addWatchlistItem,
  removeWatchlistItem,
} from '../services/watchlistService';

export async function listWatchlists(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const watchlists = await getWatchlistsForUser(req.userId!);
    res.json(watchlists);
  } catch (err) {
    next(err);
  }
}

export async function createWatchlistHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    const watchlist = await createWatchlist(req.userId!, name);
    res.status(201).json(watchlist);
  } catch (err) {
    next(err);
  }
}

export async function deleteWatchlistHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const deletedCount = await deleteWatchlist(id, req.userId!);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addItemHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const watchlistId = Number(req.params.id);
    const { symbol } = req.body;

    // Ensure the watchlist belongs to this user before adding to it
    const watchlist = await getWatchlistById(watchlistId, req.userId!);
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const item = await addWatchlistItem(watchlistId, symbol);

    if (!item) {
      // onConflict().ignore() returns undefined if it already existed
      const items = await getWatchlistItems(watchlistId);
      const existing = items.find(i => i.symbol === symbol.toUpperCase());
      return res.status(200).json(existing);
    }

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function removeItemHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const watchlistId = Number(req.params.id);
    const { symbol } = req.params;

    const watchlist = await getWatchlistById(watchlistId, req.userId!);
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const deletedCount = await removeWatchlistItem(watchlistId, symbol);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}


export async function listItemsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const watchlistId = Number(req.params.id);

    const watchlist = await getWatchlistById(watchlistId, req.userId!);
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const items = await getWatchlistItems(watchlistId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}
