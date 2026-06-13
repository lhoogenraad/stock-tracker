-- users
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- watchlists (a user can have multiple, or just one default — your call)
watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'My Watchlist',
  created_at TIMESTAMPTZ DEFAULT now()
)

-- watchlist_items (join table — symbol per watchlist)
watchlist_items (
  id SERIAL PRIMARY KEY,
  watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(watchlist_id, symbol)
)

-- price_history (seeded manually for now, real ingestion comes in M2)
price_history (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  price NUMERIC(12,4) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)
-- index for the access pattern you'll use constantly: "latest N prices for symbol X"
CREATE INDEX idx_price_history_symbol_time ON price_history (symbol, recorded_at DESC);

-- alerts (schema now, logic in M6 — design it correctly early)
alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  condition VARCHAR(10) NOT NULL CHECK (condition IN ('above','below')),
  target_price NUMERIC(12,4) NOT NULL,
  triggered_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
)
