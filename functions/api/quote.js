// Cloudflare Pages Function — proxy for Yahoo Finance quotes
// GET /api/quote?symbols=PKO.WA,PKN.WA,...

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const symbols = url.searchParams.get('symbols');

  if (!symbols) {
    return new Response(JSON.stringify({ error: 'Missing symbols parameter' }), {
      status: 400,
      headers: corsHeaders('application/json'),
    });
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,regularMarketPreviousClose,currency,shortName`;

    const resp = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!resp.ok) {
      // Try fallback endpoint
      const fallbackUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,regularMarketPreviousClose,currency,shortName`;
      const fallbackResp = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!fallbackResp.ok) {
        return new Response(JSON.stringify({ error: 'Yahoo Finance API unavailable' }), {
          status: 502,
          headers: corsHeaders('application/json'),
        });
      }

      const data = await fallbackResp.json();
      return formatQuoteResponse(data);
    }

    const data = await resp.json();
    return formatQuoteResponse(data);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), {
      status: 502,
      headers: corsHeaders('application/json'),
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function formatQuoteResponse(data) {
  const quotes = (data.quoteResponse?.result || []).map((q) => ({
    symbol: q.symbol,
    price: q.regularMarketPrice ?? null,
    change: q.regularMarketChange ?? null,
    changePercent: q.regularMarketChangePercent ?? null,
    volume: q.regularMarketVolume ?? null,
    marketCap: q.marketCap ?? null,
    previousClose: q.regularMarketPreviousClose ?? null,
    currency: q.currency ?? 'PLN',
    shortName: q.shortName ?? null,
  }));

  return new Response(JSON.stringify({ quotes, timestamp: Date.now() }), {
    status: 200,
    headers: corsHeaders('application/json'),
  });
}

function corsHeaders(contentType) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60',
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}
