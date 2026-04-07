// Cloudflare Pages Function — proxy for Yahoo Finance quotes
// GET /api/quote?symbols=PKO.WA,PKN.WA,...
//
// ZMIANA z v7 na v8: Yahoo Finance v7/finance/quote przestał działać anonimowo
// na początku 2025 r. (zwraca 401/403). Endpoint v8/finance/chart nadal akceptuje
// anonimowe requesty i zawiera aktualne dane w polu `meta`. Dla symboli, które
// nie odpowiadają z Yahoo, używamy Stooq CSV jako fallbacku.
// Odpowiedzi są cachowane na edge Cloudflare przez 90 sekund.

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

export async function onRequestGet(context) {
  const { request, waitUntil } = context;
  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get('symbols');

  if (!symbolsParam) {
    return new Response(JSON.stringify({ error: 'Missing symbols parameter' }), {
      status: 400,
      headers: corsHeaders('application/json'),
    });
  }

  // --- Cloudflare edge cache ---
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);

  // --- Yahoo v8 chart: wszystkie symbole równolegle ---
  const yahooResults = await Promise.allSettled(
    symbols.map((symbol) => fetchYahooV8(symbol))
  );

  const quotes = [];
  const failedSymbols = [];

  for (let i = 0; i < symbols.length; i++) {
    const result = yahooResults[i];
    if (result.status === 'fulfilled' && result.value) {
      quotes.push({ ...result.value, source: 'yahoo' });
    } else {
      failedSymbols.push(symbols[i]);
    }
  }

  // --- Stooq CSV fallback dla nieudanych symboli ---
  if (failedSymbols.length > 0) {
    const stooqResults = await Promise.allSettled(
      failedSymbols.map((symbol) => fetchStooq(symbol))
    );

    for (let i = 0; i < failedSymbols.length; i++) {
      const symbol = failedSymbols[i];
      const result = stooqResults[i];

      if (result.status === 'fulfilled' && result.value) {
        quotes.push({ ...result.value, source: 'stooq' });
      } else {
        quotes.push({
          symbol,
          price: null,
          change: null,
          changePercent: null,
          volume: null,
          previousClose: null,
          currency: 'PLN',
          source: 'error',
        });
      }
    }
  }

  const body = JSON.stringify({ quotes, timestamp: Date.now() });
  const response = new Response(body, {
    status: 200,
    headers: corsHeaders('application/json'),
  });

  // Zapisz do cache edge (nieblokująco)
  waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}

// Pobiera dane z Yahoo Finance v8 chart endpoint.
// Próbuje query1, potem query2 jako mirror.
async function fetchYahooV8(symbol) {
  const mirrors = ['query1', 'query2'];

  for (const mirror of mirrors) {
    try {
      const url = `https://${mirror}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
      const resp = await fetch(url, { headers: FETCH_HEADERS });

      if (!resp.ok) continue;

      const data = await resp.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) continue;

      const price = meta.regularMarketPrice ?? null;
      const previousClose = meta.chartPreviousClose ?? null;
      const change =
        price != null && previousClose != null
          ? +(price - previousClose).toFixed(4)
          : null;
      const changePercent =
        change != null && previousClose
          ? +((change / previousClose) * 100).toFixed(4)
          : null;

      return {
        symbol,
        price,
        previousClose,
        change,
        changePercent,
        volume: meta.regularMarketVolume ?? null,
        currency: meta.currency ?? 'PLN',
      };
    } catch {
      // próbuj kolejne mirror
    }
  }

  return null;
}

// Fallback: pobiera ostatni kurs zamknięcia z Stooq CSV.
// previousClose niedostępne w tym formacie — zwracamy null.
async function fetchStooq(symbol) {
  try {
    const ticker = symbol.toLowerCase();
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(ticker)}&f=sd2t2ohlcv&h&e=csv`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': FETCH_HEADERS['User-Agent'],
        'Accept': 'text/csv',
      },
    });

    if (!resp.ok) return null;

    const text = await resp.text();
    const lines = text.trim().split('\n');
    // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const values = lines[1].split(',').map((v) => v.trim());
    const get = (key) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? values[idx] : null;
    };

    const closeStr = get('close');
    if (!closeStr || closeStr === 'N/D') return null;

    const price = parseFloat(closeStr);
    if (isNaN(price)) return null;

    const volStr = get('volume');

    return {
      symbol,
      price,
      previousClose: null,
      change: null,
      changePercent: null,
      volume: volStr ? parseInt(volStr, 10) || null : null,
      currency: 'PLN',
    };
  } catch {
    return null;
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders(contentType) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=90',
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}
