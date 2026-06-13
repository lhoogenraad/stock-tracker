import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createWatchlistSchema, addItemSchema } from '../schemas/watchlist';
import {
  listWatchlists,
  createWatchlistHandler,
  deleteWatchlistHandler,
  addItemHandler,
  removeItemHandler,
  listItemsHandler,
} from '../controllers/watchlistController';

export const watchlistRouter = Router();

watchlistRouter.use(requireAuth);

watchlistRouter.get('/', listWatchlists);
watchlistRouter.post('/', validateBody(createWatchlistSchema), createWatchlistHandler);
watchlistRouter.delete('/:id', deleteWatchlistHandler);
watchlistRouter.post('/:id/items', validateBody(addItemSchema), addItemHandler);
watchlistRouter.delete('/:id/items/:symbol', removeItemHandler);
watchlistRouter.get('/:id/items', listItemsHandler);
