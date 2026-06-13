import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { registerClient, unregisterClient, subscribe, unsubscribe, send } from './connectionManager';
import { ClientMessage } from './types';

const JWT_SECRET = process.env.JWT_SECRET!;

export function startWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    // Auth via query param: ws://host:4000?token=<jwt>
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Missing auth token');
      return;
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      ws.close(4001, 'Invalid auth token');
      return;
    }

    registerClient(ws);
    console.log('Client connected');

    ws.on('message', (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      switch (message.type) {
        case 'subscribe':
          subscribe(ws, message.symbols);
          send(ws, { type: 'subscribed', symbols: message.symbols.map(s => s.toUpperCase()) });
          break;
        case 'unsubscribe':
          unsubscribe(ws, message.symbols);
          break;
        default:
          send(ws, { type: 'error', message: 'Unknown message type' });
      }
    });

    ws.on('close', () => {
      unregisterClient(ws);
      console.log('Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  console.log(`WebSocket gateway listening on port ${port}`);
  return wss;
}
