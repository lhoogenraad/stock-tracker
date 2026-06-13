export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface Watchlist {
  id: number;
  user_id: number;
  name: string;
  created_at: Date;
}

export interface WatchlistItem {
  id: number;
  watchlist_id: number;
  symbol: string;
  added_at: Date;
}

export interface PriceHistory {
  id: number; // bigint comes back as string from pg unless configured — note below
  symbol: string;
  price: string; // NUMERIC comes back as string from pg driver by default
  recorded_at: Date;
  created_at: Date;
}

export interface Alert {
  id: number;
  user_id: number;
  symbol: string;
  condition: 'above' | 'below';
  target_price: string;
  triggered_at: Date | null;
  is_active: boolean;
  created_at: Date;
}

// Augment Knex's table types for type-safe query building
declare module 'knex/types/tables' {
  interface Tables {
    users: User;
    watchlists: Watchlist;
    watchlist_items: WatchlistItem;
    price_history: PriceHistory;
    alerts: Alert;
  }
}
