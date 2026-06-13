export interface PriceHistory {
  id: number;
  symbol: string;
  price: string;
  recorded_at: Date;
  created_at: Date;
}

declare module 'knex/types/tables' {
  interface Tables {
    price_history: PriceHistory;
    watchlist_items: { id: number; watchlist_id: number; symbol: string; added_at: Date };
  }
}
