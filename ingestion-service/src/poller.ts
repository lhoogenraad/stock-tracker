import { fetchQuote } from './finhubbClient';
import { getActiveSymbols } from './symbolRegistry';
import { writePrice } from './priceWriter';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 10000;
const SYMBOL_REFRESH_INTERVAL_MS = 60000; // refresh active symbol list every 60s

let symbols: string[] = [];
let cursor = 0;

async function refreshSymbols() {
  try {
    symbols = await getActiveSymbols();
    console.log(`Active symbols (${symbols.length}):`, symbols.join(', ') || '(none)');
  } catch (err) {
    console.error('Failed to refresh symbol list:', err);
  }
}

async function pollNext() {
  if (symbols.length === 0) {
    return; // nothing to poll yet
  }

  const symbol = symbols[cursor % symbols.length];
  cursor++;

  try {
    const quote = await fetchQuote(symbol);

    if (!quote) {
      console.warn(`No quote data for ${symbol} (invalid symbol?)`);
      return;
    }

    await writePrice(symbol, quote.c, quote.t);
    console.log(`${symbol}: ${quote.c} @ ${new Date(quote.t * 1000).toISOString()}`);
  } catch (err) {
    console.error(`Error polling ${symbol}:`, err);
  }
}

export function startPolling() {
  refreshSymbols();
  setInterval(refreshSymbols, SYMBOL_REFRESH_INTERVAL_MS);

  // Tick interval = POLL_INTERVAL_MS / number of symbols, recalculated dynamically
  // by checking symbols.length each tick rather than fixing the interval upfront.
  const tick = async () => {
    await pollNext();
    const tickDelay = symbols.length > 0 ? POLL_INTERVAL_MS / symbols.length : POLL_INTERVAL_MS;
    setTimeout(tick, tickDelay);
  };

  tick();
}
