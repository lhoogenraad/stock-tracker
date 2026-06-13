const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface FinnhubQuote {
  c: number; // current price
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp (unix seconds)
}

export async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Finnhub API error for ${symbol}: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as FinnhubQuote;

  // Finnhub returns all zeros for invalid/unknown symbols rather than an error
  if (data.c === 0 && data.t === 0) {
    return null;
  }

  console.debug(`Got response for symbol: ${symbol}`);
  console.dir(data);
  console.log('\n')
  return data;
}
