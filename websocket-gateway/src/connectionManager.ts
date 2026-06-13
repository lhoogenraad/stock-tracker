import { WebSocket } from 'ws';
import { ServerMessage, PriceUpdate } from './types';

interface ClientState {
  ws: WebSocket;
  subscriptions: Set<string>; // symbols this client cares about
}

const clients = new Map<WebSocket, ClientState>();

export function registerClient(ws: WebSocket) {
  clients.set(ws, { ws, subscriptions: new Set() });
}

export function unregisterClient(ws: WebSocket) {
  clients.delete(ws);
}

export function subscribe(ws: WebSocket, symbols: string[]) {
  const client = clients.get(ws);
  if (!client) return;
  for (const symbol of symbols) {
    client.subscriptions.add(symbol.toUpperCase());
  }
}

export function unsubscribe(ws: WebSocket, symbols: string[]) {
  const client = clients.get(ws);
  if (!client) return;
  for (const symbol of symbols) {
    client.subscriptions.delete(symbol.toUpperCase());
  }
}

// Called when a price update arrives from Redis pub/sub.
// Broadcasts only to clients subscribed to this symbol.
export function broadcastPriceUpdate(update: PriceUpdate) {
  const message: ServerMessage = { type: 'price_update', data: update };
  const payload = JSON.stringify(message);

  for (const client of clients.values()) {
    if (client.subscriptions.has(update.symbol) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

export function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
