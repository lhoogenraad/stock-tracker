export interface PriceUpdate {
  symbol: string;
  price: number;
  recorded_at: string;
}

export type ClientMessage =
  | { type: 'subscribe'; symbols: string[] }
  | { type: 'unsubscribe'; symbols: string[] };

export type ServerMessage =
  | { type: 'price_update'; data: PriceUpdate }
  | { type: 'subscribed'; symbols: string[] }
  | { type: 'error'; message: string };
