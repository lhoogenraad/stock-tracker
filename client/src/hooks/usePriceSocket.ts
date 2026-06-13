import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePriceStore } from '../store/priceStore';

const WS_URL = import.meta.env.VITE_WS_URL;

export function usePriceSocket(symbols: string[]) {
  const token = useAuthStore((s) => s.token);
  const setPrice = usePriceStore((s) => s.setPrice);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token || symbols.length === 0) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', symbols }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'price_update') {
        setPrice(message.data);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [token, symbols.join(',')]);
}
