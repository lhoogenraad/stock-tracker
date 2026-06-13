import Redis from 'ioredis';
import { broadcastPriceUpdate } from './connectionManager';
import { PriceUpdate } from './types';

export function startRedisSubscriber() {
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  subscriber.subscribe('prices', (err) => {
    if (err) {
      console.error('Failed to subscribe to Redis channel:', err);
      return;
    }
    console.log('Subscribed to Redis channel: prices');
  });

  subscriber.on('message', (channel, message) => {
    if (channel !== 'prices') return;

    try {
      const update: PriceUpdate = JSON.parse(message);
      broadcastPriceUpdate(update);
    } catch (err) {
      console.error('Failed to parse price update from Redis:', err);
    }
  });

  subscriber.on('error', (err) => {
    console.error('Redis subscriber error:', err);
  });

  return subscriber;
}
