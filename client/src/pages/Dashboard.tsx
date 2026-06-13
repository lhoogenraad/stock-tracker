import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { usePriceStore } from '../store/priceStore';
import { usePriceSocket } from '../hooks/usePriceSocket';
import { useAuthStore } from '../store/authStore';
import { PriceRow } from '../components/PriceRow';
import { ConnectionStatus } from '../components/ConnectionStatus';

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
  const [loading, setLoading] = useState(true);
  const prices = usePriceStore((s) => s.prices);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const symbols = items.map((i) => i.symbol);
  const { connected } = usePriceSocket(symbols);

  useEffect(() => {
    async function init() {
      const lists = await api.getWatchlists();

      let watchlistId: number;
      if (lists.length === 0) {
        const created = await api.createWatchlist('My Watchlist');
        setWatchlists([created]);
        watchlistId = created.id;
      } else {
        setWatchlists(lists);
        watchlistId = lists[0].id;
      }

      const existingItems = await api.getWatchlistItems(watchlistId);
      setItems(existingItems);
      setLoading(false);
    }

    init();
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
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>●</span>
          <span style={styles.brandName}>STOCKWATCH</span>
        </div>
        <div style={styles.headerRight}>
          <ConnectionStatus connected={connected} />
          <button onClick={clearAuth} style={styles.logout}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        <form onSubmit={handleAddSymbol} style={styles.addForm}>
          <input
            placeholder="Add symbol (e.g. AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            style={styles.addInput}
          />
          <button type="submit" style={styles.addButton}>Add</button>
        </form>

        {loading ? (
          <div style={styles.empty}>Loading watchlist…</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>
            No symbols yet. Add one above to start tracking live prices.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Symbol</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Price</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Updated</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const live = prices[item.symbol];
                return (
                  <PriceRow
                    key={item.id}
                    symbol={item.symbol}
                    price={live?.price}
                    updatedAt={live?.recorded_at}
                    onRemove={() => handleRemoveSymbol(item.symbol)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    color: 'var(--gain)',
    fontSize: 10,
  },
  brandName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.15em',
    color: 'var(--text-secondary)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  logout: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-secondary)',
    fontSize: 13,
    padding: '6px 12px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 24px',
  },
  addForm: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
  },
  addInput: {
    flex: 1,
    padding: '10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--font-mono)',
  },
  addButton: {
    padding: '10px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
  },
  empty: {
    padding: '48px 24px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: 14,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
  },
};
