import 'dotenv/config';
import { startWebSocketServer } from './server';
import { startRedisSubscriber } from './redisSubscriber';

const PORT = Number(process.env.PORT) || 4000;

startWebSocketServer(PORT);
startRedisSubscriber();
