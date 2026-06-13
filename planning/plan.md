# 1. System Architecture Overview

This is a real-time analytics platform with a clear separation between **ingestion** (pulling market data in), **processing** (transforming/storing/alerting), and **delivery** (pushing data to users).

```
                                    ┌─────────────────┐
                                    │  External Stock  │
                                    │  Price API(s)     │
                                    └────────┬─────────┘
                                             │ poll/stream
                                    ┌────────▼─────────┐
                                    │  Market Data       │
                                    │  Ingestion Service │
                                    └────────┬─────────┘
                                             │ publish events
                                    ┌────────▼─────────┐
                                    │   Message Queue    │
                                    │  (Redis Streams /   │
                                    │   pub/sub or         │
                                    │   RabbitMQ)         │
                                    └───┬─────┬─────┬───┘
                  ┌─────────────────────┘     │     └───────────────────┐
                  │                           │                          │
         ┌────────▼────────┐         ┌───────▼───────┐         ┌───────▼────────┐
         │ Price Persistence │         │ Alert Evaluation│         │ WebSocket       │
         │ Service           │         │ Service          │         │ Gateway Service │
         │ (writes to DB)    │         │ (checks rules)   │         │ (pushes to UI)  │
         └────────┬─────────┘         └───────┬─────────┘         └───────┬────────┘
                  │                            │ triggers                  │
         ┌────────▼─────────┐        ┌────────▼─────────┐                 │
         │ PostgreSQL Primary│◄──────►│ Notification       │                │
         │ (writes)          │        │ Service (email/    │                │
         └────────┬─────────┘        │  push)             │                │
                  │ replication       └──────────────────┘                │
         ┌────────▼─────────┐                                              │
         │ PostgreSQL Read    │                                             │
         │ Replica            │                                             │
         └───────────────────┘                                             │
                                                                             │
                                    ┌──────────────────┐                   │
                                    │ Redis (cache +     │◄──────────────────┘
                                    │ pub/sub +           │
                                    │ session store)      │
                                    └──────────────────┘
                                              ▲
                                              │
                                    ┌─────────┴────────┐
                                    │  API Gateway /     │
                                    │  REST API Service  │◄──── React Frontend
                                    │  (Express/Nest)    │
                                    └───────────────────┘
```

---

# 2. Major Services & Responsibilities

**API Gateway / REST API Service**
Entry point for all standard CRUD operations: user auth, watchlists, alert configuration, historical data queries. Talks to PostgreSQL (read replica for reads, primary for writes) and Redis (cache).

**Market Data Ingestion Service**
Polls or streams from an external stock API (e.g., Finnhub, Alpha Vantage, Polygon.io). Normalizes data and publishes price-update events to the message queue. This is your "producer" — runs independently of user traffic.

**Message Queue / Event Bus**
Decouples ingestion from everything that needs the data. Redis Streams or pub/sub is sufficient for a learning project; RabbitMQ/Kafka if you want deeper exposure to dedicated brokers.

**Price Persistence Service (consumer)**
Subscribes to price events, batches/writes them to PostgreSQL (time-series table), and updates Redis cache with latest prices.

**Alert Evaluation Service (consumer)**
Subscribes to price events, checks against user-configured alert thresholds (cached in Redis for speed), and triggers notifications when conditions are met.

**WebSocket Gateway Service**
Maintains persistent connections with frontend clients. Subscribes to Redis pub/sub for live price updates and pushes them to subscribed clients based on their watchlists.

**Notification Service**
Consumes alert-triggered events and sends emails/push notifications. Good place to learn retry logic and dead-letter queues.

**PostgreSQL Primary + Read Replica**
Primary handles writes (price history inserts, user data mutations). Replica serves read-heavy queries (historical charts, analytics).

**Redis**
Multi-purpose: caching, pub/sub for real-time fan-out, session/rate-limit storage, and potentially as the message queue itself.

---

# 3. Data Flow

**Real-time price flow:**
1. Ingestion Service polls external API every N seconds (or uses their WebSocket if available) for symbols currently being watched by any user.
2. For each price update, it publishes an event to the message queue (`price.updated:AAPL`).
3. Price Persistence Service consumes the event, writes to PostgreSQL `price_history` table, and updates the "latest price" cache in Redis (`latest:AAPL`).
4. Alert Evaluation Service consumes the same event, checks Redis-cached alert thresholds for that symbol, and if triggered, publishes an `alert.triggered` event.
5. WebSocket Gateway consumes price events via Redis pub/sub and pushes updates to all connected clients subscribed to that symbol.
6. Notification Service consumes `alert.triggered` events and sends an email/push.

**Read flow (user opens dashboard):**
1. React app calls REST API for watchlist + historical data + current prices.
2. API Service checks Redis cache for "latest price" per symbol (cache hit = fast path).
3. Historical data queries hit the read replica.
4. API Service returns combined response; React then opens a WebSocket connection to subscribe to live updates for the watchlist symbols.

**Write flow (user creates a watchlist or alert):**
1. React sends request to API Service.
2. API Service writes to PostgreSQL primary.
3. API Service invalidates/updates relevant Redis cache entries (e.g., adds symbol to "actively watched" set so ingestion service knows to fetch it).

---

# 4. Where WebSockets Should Be Used

- **Only for the live price stream to the frontend.** This is the canonical real-time use case — clients shouldn't poll REST endpoints for price updates.
- **Connection management**: on connect, client authenticates and subscribes to symbols in their watchlist. The WebSocket Gateway maintains a mapping of `connectionId → subscribed symbols`.
- **Fan-out pattern**: rather than each WebSocket server querying the DB, it subscribes to Redis pub/sub channels per symbol (`channel:price:AAPL`) and forwards messages to relevant connections. This is critical for horizontal scaling (see below).
- **Not used for**: CRUD operations (watchlist edits, alert config, login) — these stay as REST calls. Mixing concerns over a single WebSocket connection adds complexity without much benefit at this scale.
- **Heartbeat/reconnection logic**: a good place to learn about connection liveness detection and graceful client reconnection with backoff.

---

# 5. Where Redis Should Be Used

Redis earns its place in multiple distinct roles — useful for understanding that "Redis" isn't one thing, it's a toolbox:

- **Cache for latest prices**: `GET latest:AAPL` avoids hitting Postgres for the most commonly requested data. TTL-based or event-driven invalidation.
- **Pub/sub for real-time fan-out**: decouples the Price Persistence/Ingestion services from WebSocket Gateways. Any gateway instance can subscribe to `channel:price:*` and forward to its connected clients.
- **Cached alert rules**: `alerts:AAPL` → list of user thresholds, avoiding a DB query on every price tick (which could be very frequent).
- **Session/rate-limit storage**: if you implement auth, Redis is a natural store for sessions or JWT blocklists, and for rate-limiting external API calls (important since most free-tier stock APIs have strict limits).
- **Active symbols set**: `SADD watched_symbols AAPL` — lets the Ingestion Service know which symbols actually need polling, avoiding wasted external API calls on unwatched stocks.
- **Optionally as the message queue itself** (Redis Streams) if you don't want to run a separate broker — good for learning queue semantics (consumer groups, acknowledgments) without extra infrastructure.

---

# 6. Horizontal Scaling

- **REST API Service**: stateless, scales trivially behind a load balancer. Sessions/auth state live in Redis, not in-process, so any instance can serve any request.
- **WebSocket Gateway**: the tricky one. Each instance holds its own set of client connections. The Redis pub/sub layer is what makes this work — when Instance A's client needs a price update published by Instance B's consumer, both instances are subscribed to the same Redis channel, so the message reaches the right gateway regardless of which instance the client is connected to.
- **Sticky sessions**: load balancer needs to route a given client's WebSocket connection consistently to the same gateway instance for the connection's lifetime (not for data routing — Redis handles that — but because WebSocket connections are stateful at the TCP level).
- **Ingestion Service**: should run as a single instance (or use leader election) to avoid duplicate API calls to the external provider and duplicate event publishing. This is a deliberate "non-scaled" component — a good discussion point for interviews about when *not* to scale something.
- **Consumer services** (Persistence, Alert Evaluation): can scale horizontally if using consumer groups (Redis Streams `XREADGROUP` or RabbitMQ competing consumers), since each event should be processed once across the group.
- **Database**: read replicas scale read capacity; the primary remains a single write bottleneck (until you'd consider sharding, which is likely out of scope here but worth mentioning as a tradeoff).

---

# 7. Read Replica Placement

- All historical price queries, analytics/trend calculations, and dashboard "load my data" queries route to the **read replica**.
- All writes (price history inserts from the Persistence Service, user account/watchlist/alert mutations) go to the **primary**.
- **Replication lag** becomes a real, tangible concept here: if a user just created a watchlist and immediately refreshes, the replica might not have it yet. You'll need to decide — read-your-writes from primary for a short window, or just accept eventual consistency for non-critical reads.
- A simple connection-routing layer (even just two separate `pg.Pool` instances — one pointed at primary, one at replica) in your API service is enough to demonstrate the pattern without needing a proxy like PgBouncer/Pgpool, though mentioning those as production alternatives is good interview context.
- Good exercise: deliberately introduce replication lag (e.g., add artificial delay) and observe/handle the stale-read scenario.

---

# 8. Bottlenecks & Failure Modes

- **External API rate limits**: most free stock APIs limit you to ~5-60 calls/minute. This is your most likely real bottleneck — forces you to think about polling intervals, batching symbols per request, and only polling actively-watched symbols.
- **Message queue backpressure**: if the Alert Evaluation or Persistence consumers fall behind (e.g., DB write spike), the queue backs up. With Redis Streams, unacknowledged messages accumulate — you'll need to think about consumer scaling or dropping/sampling old price ticks.
- **WebSocket connection storms**: many clients reconnecting simultaneously (e.g., after a gateway restart) can spike load on Redis pub/sub and the auth flow. Reconnection backoff/jitter matters.
- **Redis as single point of failure**: if Redis is both your cache, pub/sub, and queue, its failure is wide-reaching. Worth discussing Redis persistence (AOF/RDB), Sentinel/Cluster for HA, and what degrades gracefully vs. what breaks entirely (e.g., cache failure → fallback to DB; pub/sub failure → no live updates).
- **Primary DB write contention**: high-frequency price ticks writing to `price_history` can cause lock contention or table bloat. Batching writes, using a dedicated time-series-friendly schema (or extension like TimescaleDB), and partitioning by date are relevant mitigations.
- **Replication lag under load**: as above — stale reads becoming visible during traffic spikes.
- **Cascading failure**: if the external API goes down, does Ingestion retry aggressively and overwhelm itself? Need circuit breakers and exponential backoff.
- **Alert duplication**: if Alert Evaluation Service scales without proper consumer-group semantics, the same price event could trigger duplicate notifications — an idempotency/dedup problem.

---

# 9. Phased Implementation Plan (Easiest → Hardest)

**Milestone 1: Basic REST API + PostgreSQL CRUD**
Build Express API for users, watchlists, and a manually-seeded `price_history` table. No real-time, no external API yet — just CRUD with proper schema design.

**Milestone 2: External API Integration + Scheduled Ingestion**
Add a service that polls a real stock API on a cron/interval, stores results in `price_history`. Introduces rate-limit handling, retries, and basic error handling for third-party dependencies.

**Milestone 3: Redis Caching Layer**
Cache "latest price" lookups and watchlist data. Implement cache invalidation on writes. Measure/observe cache hit vs. miss behavior.

**Milestone 4: WebSocket Live Updates (single instance)**
Add a WebSocket server that pushes price updates to connected clients when ingestion writes new data. Single-instance, direct in-process event emission — no pub/sub yet. Frontend subscribes and renders live updates.

**Milestone 5: Event-Driven Decoupling with Message Queue**
Introduce Redis Streams (or RabbitMQ) between Ingestion and downstream consumers (Persistence, WebSocket broadcast). Refactor Milestone 4's direct coupling into a proper pub/sub event flow. This is where "event-driven architecture" becomes real.

**Milestone 6: Alerts + Notification Service**
Build the Alert Evaluation consumer and Notification Service. Introduces consumer groups, idempotency (avoiding duplicate alerts), and async side-effects triggered by events.

**Milestone 7: Horizontal Scaling of WebSocket Gateway + API**
Run multiple instances of the API and WebSocket Gateway behind a load balancer (Docker Compose with replicas, or simple nginx config). Move WebSocket fan-out to Redis pub/sub so any gateway instance can serve any client. This is the conceptual core of the project.

**Milestone 8: Read Replica + Observability**
Add a PostgreSQL read replica, route historical/analytics queries to it, and deliberately test replication lag scenarios. Add observability: structured logging, basic metrics (Prometheus/Grafana or even simple custom dashboards), and health checks across all services. Optionally add circuit breakers for the external API.

---

# 10. Engineering Concepts Per Milestone

**Milestone 1 (COMPLETE)** — Relational schema design, normalization, REST API design conventions, connection pooling, basic auth (JWT/sessions), Docker Compose basics for multi-container local dev.

**Milestone 2** — Working with third-party APIs under rate limits, scheduled jobs (cron vs. interval), idempotent writes (avoiding duplicate price entries), basic retry/backoff strategies, error handling for unreliable dependencies.

**Milestone 3** — Cache-aside pattern, cache invalidation strategies, TTL design, the tradeoff between staleness and load reduction, measuring cache effectiveness.

**Milestone 4** — WebSocket protocol fundamentals, connection lifecycle (connect/auth/subscribe/disconnect), event-driven UI updates on the frontend, in-process pub/sub vs. distributed pub/sub (setting up the "why" for Milestone 5).

**Milestone 5** — Producer/consumer decoupling, message queue semantics (at-least-once vs. at-most-once delivery), event schema design, the tradeoffs of choosing Redis Streams vs. a dedicated broker, backpressure and consumer lag.

**Milestone 6** — Consumer groups and competing consumers, idempotency keys, side-effect isolation (notifications shouldn't block the main pipeline), dead-letter handling for failed notifications.

**Milestone 7** — Stateless service design, load balancing strategies (round-robin vs. sticky sessions), distributed pub/sub as a scaling primitive, the CAP-theorem-adjacent tradeoffs of distributing state, container orchestration basics (scaling replicas in Docker Compose or intro to Kubernetes concepts).

**Milestone 8** — Database replication mechanics (streaming replication, replication lag), read/write splitting at the application layer, eventual consistency tradeoffs and read-your-writes patterns, observability fundamentals (structured logs, metrics, tracing), circuit breaker pattern, and graceful degradation design — the kind of "what happens when X fails" thinking senior interviews probe heavily.
