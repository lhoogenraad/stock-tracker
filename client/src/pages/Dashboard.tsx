import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { usePriceStore } from '../store/priceStore';
import { usePriceSocket } from '../hooks/usePriceSocket';
import { useAuthStore } from '../store/authStore';

interface Watchlist {
  id: number;
  name: string;
}

interface WatchlistItem {
  id: number;
  watchlist_id: number;
  symbol: string;
}

export function Dashboard() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const prices = usePriceStore((s) => s.prices);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const symbols = items.map((i) => i.symbol);
  usePriceSocket(symbols);

  async function loadWatchlists() {
    const lists = await api.getWatchlists();
    setWatchlists(lists);

    if (lists.length === 0) {
      const created = await api.createWatchlist('My Watchlist');
      setWatchlists([created]);
      return created.id;
    }
    return lists[0].id;
  }

  async function loadItems(watchlistId: number) {
    // We don't have a "get items" endpoint exposed separately yet —
    // for now, reuse the add endpoint's idempotency or add a GET endpoint.
    // Placeholder: assumes items are tracked client-side after add.
  }

  useEffect(() => {
    loadWatchlists();
  }, []);

  async function handleAddSymbol(e: React.FormEvent) {
    e.preventDefault();
    if (!newSymbol || watchlists.length === 0) return;

    const item = await api.addWatchlistItem(watchlists[0].id, newSymbol.toUpperCase());
    setItems((prev) => [...prev, item]);
    setNewSymbol('');
  }

  async function handleRemoveSymbol(symbol: string) {
    if (watchlists.length === 0) return;
    await api.removeWatchlistItem(watchlists[0].id, symbol);
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Watchlist</h2>
        <button onClick={clearAuth}>Logout</button>
      </div>

      <form onSubmit={handleAddSymbol} style={{ marginBottom: 16 }}>
        <input
          placeholder="Symbol (e.g. AAPL)"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Symbol</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th style={{ textAlign: 'right' }}>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const live = prices[item.symbol];
            return (
              <tr key={item.id}>
                <td>{item.symbol}</td>
                <td style={{ textAlign: 'right' }}>
                  {live ? `$${live.price.toFixed(2)}` : '—'}
                </td>
                <td style={{ textAlign: 'right', fontSize: 12, color: '#888' }}>
                  {live ? new Date(live.recorded_at).toLocaleTimeString() : '—'}
                </td>
                <td>
                  <button onClick={() => handleRemoveSymbol(item.symbol)}>Remove</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
