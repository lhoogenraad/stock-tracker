import { create } from 'zustand';

interface PriceUpdate {
  symbol: string;
  price: number;
  recorded_at: string;
}

interface PriceState {
  prices: Record<string, PriceUpdate>;
  setPrice: (update: PriceUpdate) => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  setPrice: (update) =>
    set((state) => ({
      prices: { ...state.prices, [update.symbol]: update },
    })),
}));
