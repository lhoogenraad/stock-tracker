import 'dotenv/config';
import { startPolling } from './poller';

console.info('Ingestion service starting...');
startPolling();
