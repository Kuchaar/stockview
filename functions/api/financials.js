// Cloudflare Pages Function — proxy for Yahoo Finance financial statements
// GET /api/financials?symbol=PKO.WA
//
// Yahoo Finance v10/quoteSummary wymaga crumb+cookie dla requestów z serwerów
// (od ~2023, szczególnie z Cloudflare edge — zwraca 401 "Invalid Crumb" bez nich).
// Przepływ: 1) fc.yahoo.com → Set-Cookie (A1/A3 session)
//           2) /v1/test/getcrumb z cookie → plain text crumb
//           3) /v10/finance/quoteSummary?crumb=... z cookie → dane
// Crumb cachowany 30 min, odpowiedzi 1h (dane kwartalne).
// Jeśli Yahoo całkowicie padnie → 200 z source:'unavailable' zamiast 502,
// żeby frontend mógł użyć hardkodowanych danych z wig20.js bez błędu w UI.

const MODULES = [
  'incomeStatementHistory',
  'incomeStatementHistoryQuarterly',
  'balanceSheetHistory',
  'balanceSheetHistoryQuarterly',
  'cashflowStatementHistory',
  'cashflowStatementHistoryQuarterly',
  'defaultKeyStatistics',
  'financialData',
].join(',');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Synthetic cache key do przechowywania crumba (niezależny od symbolu)
const CRUMB_CACHE_URL = 'https://internal.stockview/yahoo-crumb';

export async function onRequestGet(context) {
  const { request, waitUntil } = context;
  const reqOrigin = request.headers.get('Origin');
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol');

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Missing symbol parameter' }), {
      status: 400,
      headers: corsHeaders('application/json', reqOrigin),
    });
  }

  const cache = caches.default;

  // --- Edge cache odpowiedzi (1h — dane kwartalne) ---
  const responseCacheKey = new Request(url.toString(), { method: 'GET' });
  const cachedResponse = await cache.match(responseCacheKey);
  if (cachedResponse) return cachedResponse;

  // --- Pobierz crumb+cookie (z cache lub świeży) ---
  let auth = await getCachedCrumb(cache);
  if (!auth) {
    auth = await fetchFreshCrumb(cache, waitUntil);
  }

  // --- Zapytaj Yahoo v10/quoteSummary ---
  let raw = null;
  if (auth) {
    raw = await fetchQuoteSummary(symbol, auth.crumb, auth.cookie, 'query2');

    // 401 = wygasły/nieprawidłowy crumb → odśwież i spróbuj ponownie
    if (raw === null || raw === 401) {
      await cache.delete(new Request(CRUMB_CACHE_URL));
      auth = await fetchFreshCrumb(cache, waitUntil);
      if (auth) {
        raw = await fetchQuoteSummary(symbol, auth.crumb, auth.cookie, 'query1');
      }
    }
  }

  // --- Graceful fallback gdy Yahoo totalnie padnie ---
  if (!raw || raw === 401) {
    const fallback = new Response(
      JSON.stringify({
        symbol,
        source: 'unavailable',
        message: 'Financials temporarily unavailable, using hardcoded fallback',
        timestamp: Date.now(),
      }),
      { status: 200, headers: corsHeaders('application/json', reqOrigin) }
    );
    // Nie cachujemy fallbacku — przy kolejnym request próbujemy znowu
    return fallback;
  }

  const result = raw.quoteSummary?.result?.[0];
  if (!result) {
    return new Response(
      JSON.stringify({
        symbol,
        source: 'unavailable',
        message: 'No data found for symbol',
        timestamp: Date.now(),
      }),
      { status: 200, headers: corsHeaders('application/json', reqOrigin) }
    );
  }

  const transformed = transformFinancials(result);
  const response = new Response(
    JSON.stringify({ symbol, ...transformed, source: 'yahoo', timestamp: Date.now() }),
    { status: 200, headers: corsHeaders('application/json', reqOrigin) }
  );

  waitUntil(cache.put(responseCacheKey, response.clone()));
  return response;
}

// Pobiera crumb+cookie z edge cache (zwraca null gdy brak/wygasły)
async function getCachedCrumb(cache) {
  try {
    const cached = await cache.match(new Request(CRUMB_CACHE_URL));
    if (!cached) return null;
    return await cached.json();
  } catch {
    return null;
  }
}

// Wykonuje pełny 3-krokowy flow: fc.yahoo.com → cookie → crumb
// Zapisuje wynik do cache z TTL 30 min i zwraca { crumb, cookie }
async function fetchFreshCrumb(cache, waitUntil) {
  try {
    // Krok 1: pobierz session cookie z fc.yahoo.com
    const fcResp = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });

    // Zbierz Set-Cookie headery (Workers obsługuje getAll dla multi-value headers)
    let cookieHeaders = [];
    if (typeof fcResp.headers.getAll === 'function') {
      cookieHeaders = fcResp.headers.getAll('set-cookie');
    } else {
      const raw = fcResp.headers.get('set-cookie');
      if (raw) cookieHeaders = [raw];
    }

    // Wyciągnij tylko name=value (bez atrybutów jak Path, Expires...)
    const cookieParts = cookieHeaders
      .map((h) => h.split(';')[0].trim())
      .filter(Boolean);

    // Dołóż też cookies z odpowiedzi samego crumb endpoint jeśli fc.yahoo nie dał
    const cookie = cookieParts.length > 0 ? cookieParts.join('; ') : 'A1=d=AQAB';

    // Krok 2: pobierz crumb używając cookie
    const crumbResp = await fetch(
      'https://query2.finance.yahoo.com/v1/test/getcrumb',
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': cookie,
          'Accept': 'text/plain',
        },
      }
    );

    if (!crumbResp.ok) return null;

    const crumb = (await crumbResp.text()).trim();
    if (!crumb || crumb.includes('<')) return null; // zwrócono HTML zamiast crumba

    const auth = { crumb, cookie };

    // Zapisz do cache z TTL 30 min
    const crumbCacheResp = new Response(JSON.stringify(auth), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=1800' },
    });
    waitUntil(cache.put(new Request(CRUMB_CACHE_URL), crumbCacheResp));

    return auth;
  } catch {
    return null;
  }
}

// Wykonuje request do v10/quoteSummary. Zwraca: parsed JSON | 401 | null (inny błąd)
async function fetchQuoteSummary(symbol, crumb, cookie, mirror) {
  try {
    const url =
      `https://${mirror}.finance.yahoo.com/v10/finance/quoteSummary/` +
      `${encodeURIComponent(symbol)}?modules=${MODULES}&crumb=${encodeURIComponent(crumb)}`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': cookie,
        'Accept': 'application/json',
      },
    });

    if (resp.status === 401 || resp.status === 403) return 401;
    if (!resp.ok) return null;

    return await resp.json();
  } catch {
    return null;
  }
}

export async function onRequestOptions(context) {
  const reqOrigin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(null, reqOrigin) });
}

function transformFinancials(result) {
  return {
    incomeStatement: {
      annual: transformStatements(result.incomeStatementHistory?.incomeStatementHistory || []),
      quarterly: transformStatements(result.incomeStatementHistoryQuarterly?.incomeStatementHistory || []),
    },
    balanceSheet: {
      annual: transformStatements(result.balanceSheetHistory?.balanceSheetStatements || []),
      quarterly: transformStatements(result.balanceSheetHistoryQuarterly?.balanceSheetStatements || []),
    },
    cashFlow: {
      annual: transformStatements(result.cashflowStatementHistory?.cashflowStatements || []),
      quarterly: transformStatements(result.cashflowStatementHistoryQuarterly?.cashflowStatements || []),
    },
    keyStats: extractKeyStats(result.defaultKeyStatistics, result.financialData),
  };
}

function transformStatements(statements) {
  return statements.map((stmt) => {
    const row = {};
    for (const [key, val] of Object.entries(stmt)) {
      if (val && typeof val === 'object' && 'raw' in val) {
        row[key] = val.raw;
      } else if (key === 'endDate' && val?.fmt) {
        row.date = val.fmt;
        row.dateRaw = val.raw;
      } else if (typeof val === 'string' || typeof val === 'number') {
        row[key] = val;
      }
    }
    return row;
  });
}

function extractKeyStats(keyStats, financialData) {
  const ks = keyStats || {};
  const fd = financialData || {};

  return {
    pe: fd.currentPrice?.raw && ks.trailingEps?.raw
      ? +(fd.currentPrice.raw / ks.trailingEps.raw).toFixed(2)
      : null,
    forwardPe: ks.forwardPE?.raw ?? null,
    pb: ks.priceToBook?.raw ?? null,
    evEbitda: ks.enterpriseToEbitda?.raw ?? null,
    roe: fd.returnOnEquity?.raw ? +(fd.returnOnEquity.raw * 100).toFixed(2) : null,
    roa: fd.returnOnAssets?.raw ? +(fd.returnOnAssets.raw * 100).toFixed(2) : null,
    currentRatio: fd.currentRatio?.raw ?? null,
    quickRatio: fd.quickRatio?.raw ?? null,
    debtToEquity: fd.debtToEquity?.raw ? +(fd.debtToEquity.raw / 100).toFixed(2) : null,
    dividendYield: fd.dividendYield?.raw ? +(fd.dividendYield.raw * 100).toFixed(2) : null,
    eps: ks.trailingEps?.raw ?? null,
    bookValue: ks.bookValue?.raw ?? null,
    grossMargin: fd.grossMargins?.raw ? +(fd.grossMargins.raw * 100).toFixed(2) : null,
    operatingMargin: fd.operatingMargins?.raw ? +(fd.operatingMargins.raw * 100).toFixed(2) : null,
    netMargin: fd.profitMargins?.raw ? +(fd.profitMargins.raw * 100).toFixed(2) : null,
    marketCap: fd.marketCap?.raw ?? null,
    totalRevenue: fd.totalRevenue?.raw ?? null,
    revenueGrowth: fd.revenueGrowth?.raw ? +(fd.revenueGrowth.raw * 100).toFixed(2) : null,
  };
}

const ALLOWED_ORIGINS = [
  'https://stockview-3e4.pages.dev',
  'https://stockview.pages.dev',
  'http://localhost:5173',
  'http://localhost:8788',
];

function corsHeaders(contentType, requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
  const h = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600',
    'Vary': 'Origin',
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}
