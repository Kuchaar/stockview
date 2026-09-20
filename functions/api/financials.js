// Cloudflare Pages Function — proxy for Yahoo Finance financial statements
// GET /api/financials?symbol=PKO.WA
//
// Sprawozdania bierzemy z `ws/fundamentals-timeseries`, bo moduły `*History`
// w `v10/quoteSummary` Yahoo wypatroszył: dla spółek GPW oddawały tylko przychód
// i zysk netto, bez bilansu i przepływów (U6 → U9 w docs/DATA.md).
// Timeseries nie wymaga crumba ani cookie — wystarczy nagłówek User-Agent.
//
// `keyStats` dalej pochodzi z quoteSummary (moduły defaultKeyStatistics i financialData),
// które działają — stąd został tu 3-krokowy flow z crumbem. Jest to jednak pobieranie
// „w miarę możliwości": gdy padnie, sprawozdania i tak wracają, tylko bez keyStats.
//
// Gdy Yahoo całkowicie padnie → 200 z source:'unavailable' zamiast 5xx,
// żeby klient mógł zejść na niższy poziom danych bez błędu w UI.

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Moduły quoteSummary potrzebne wyłącznie do keyStats.
const KEY_STATS_MODULES = 'defaultKeyStatistics,financialData';

// Synthetic cache key do przechowywania crumba (niezależny od symbolu)
const CRUMB_CACHE_URL = 'https://internal.stockview/yahoo-crumb';

// Podbijane przy zmianie kształtu odpowiedzi — stare wpisy w cache na krawędzi
// przestają wtedy obowiązywać od razu, zamiast dożywać swojej godziny.
const CACHE_VERSION = 'ts1';

// Timeseries → klucze wierszy, których oczekuje normalizeFinancials() w
// src/data/financialSchema.js. Lista kandydatów = kolejność pierwszeństwa;
// pole, którego spółka nie raportuje, nie przychodzi wcale i ma zostać puste.
const FIELD_MAP = {
  income: {
    totalRevenue: ['TotalRevenue'],
    grossProfit: ['GrossProfit'],
    operatingIncome: ['OperatingIncome', 'EBIT'],
    ebitda: ['EBITDA'],
    netIncome: ['NetIncome', 'NetIncomeCommonStockholders'],
    interestExpense: ['InterestExpense'],
    dilutedEPS: ['DilutedEPS', 'BasicEPS'],
  },
  balance: {
    totalAssets: ['TotalAssets'],
    totalLiab: ['TotalLiabilitiesNetMinorityInterest'],
    totalStockholderEquity: ['StockholdersEquity', 'TotalEquityGrossMinorityInterest'],
    totalDebt: ['TotalDebt'],
    longTermDebt: ['LongTermDebt'],
    currentDebt: ['CurrentDebt'],
    cash: ['CashAndCashEquivalents'],
    totalCurrentAssets: ['CurrentAssets'],
    totalCurrentLiabilities: ['CurrentLiabilities'],
    inventory: ['Inventory'],
    retainedEarnings: ['RetainedEarnings'],
    netPPE: ['NetPPE'],
    sharesOutstanding: ['OrdinarySharesNumber', 'ShareIssued'],
  },
  cashFlow: {
    totalCashFromOperatingActivities: ['OperatingCashFlow'],
    totalCashflowsFromInvestingActivities: ['InvestingCashFlow'],
    totalCashFromFinancingActivities: ['FinancingCashFlow'],
    freeCashFlow: ['FreeCashFlow'],
    capitalExpenditures: ['CapitalExpenditure'],
  },
};

// Wszystkie sufiksy bez powtórzeń — z nich budujemy parametr `type`.
const FIELD_SUFFIXES = [
  ...new Set(Object.values(FIELD_MAP).flatMap((block) => Object.values(block).flat())),
];

const PERIODS = [
  { prefix: 'annual', periodType: '12M', quarterly: false },
  { prefix: 'quarterly', periodType: '3M', quarterly: true },
];

// 2015-01-01 — Yahoo i tak oddaje mniej, ale nie obcinamy tego po swojej stronie.
const PERIOD_START = 1420070400;

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

  // --- Edge cache odpowiedzi (1h — sprawozdania zmieniają się kwartalnie) ---
  const responseCacheKey = new Request(
    `${url.origin}${url.pathname}?symbol=${encodeURIComponent(symbol)}&v=${CACHE_VERSION}`,
    { method: 'GET' }
  );
  const cachedResponse = await cache.match(responseCacheKey);
  if (cachedResponse) return cachedResponse;

  // --- Sprawozdania: fundamentals-timeseries, bez crumba ---
  const series = await fetchTimeseries(symbol);

  if (!series || series.size === 0) {
    // Nie cachujemy — przy kolejnym request próbujemy znowu.
    return new Response(
      JSON.stringify({
        symbol,
        source: 'unavailable',
        message: 'Financials temporarily unavailable, using hardcoded fallback',
        timestamp: Date.now(),
      }),
      { status: 200, headers: corsHeaders('application/json', reqOrigin) }
    );
  }

  const statements = buildStatements(series);

  const pusto = ['incomeStatement', 'balanceSheet', 'cashFlow'].every(
    (blok) => statements[blok].annual.length === 0 && statements[blok].quarterly.length === 0
  );
  if (pusto) {
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

  // --- keyStats: w miarę możliwości, brak nie blokuje odpowiedzi ---
  const keyStats = await fetchKeyStats(symbol, cache, waitUntil);

  const response = new Response(
    JSON.stringify({ symbol, ...statements, keyStats, source: 'yahoo', timestamp: Date.now() }),
    { status: 200, headers: corsHeaders('application/json', reqOrigin) }
  );

  waitUntil(cache.put(responseCacheKey, response.clone()));
  return response;
}

/**
 * Pobiera szereg czasowy dla wszystkich pól naraz.
 * Zwraca Map<'annualTotalAssets', [{asOfDate, periodType, currencyCode, reportedValue}]>
 * albo null, gdy Yahoo nie odpowiedział.
 */
async function fetchTimeseries(symbol) {
  const types = PERIODS.flatMap(({ prefix }) => FIELD_SUFFIXES.map((s) => prefix + s)).join(',');
  const now = Math.floor(Date.now() / 1000);

  for (const mirror of ['query2', 'query1']) {
    try {
      const url =
        `https://${mirror}.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/` +
        `${encodeURIComponent(symbol)}?symbol=${encodeURIComponent(symbol)}` +
        `&type=${types}&period1=${PERIOD_START}&period2=${now}&merge=false`;

      const resp = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      if (!resp.ok) continue;

      const json = await resp.json();
      const result = json?.timeseries?.result;
      if (!Array.isArray(result)) continue;

      const series = new Map();
      for (const entry of result) {
        const type = entry?.meta?.type?.[0];
        if (!type) continue;
        const rows = (entry[type] || []).filter(Boolean);
        if (rows.length) series.set(type, rows);
      }
      return series;
    } catch {
      // spróbuj drugiego mirrora
    }
  }
  return null;
}

/** Szereg czasowy → kształt odpowiedzi, którego oczekują klient i importer. */
function buildStatements(series) {
  const out = {
    incomeStatement: { annual: [], quarterly: [] },
    balanceSheet: { annual: [], quarterly: [] },
    cashFlow: { annual: [], quarterly: [] },
  };

  const bloki = [
    ['incomeStatement', FIELD_MAP.income],
    ['balanceSheet', FIELD_MAP.balance],
    ['cashFlow', FIELD_MAP.cashFlow],
  ];

  for (const { prefix, periodType, quarterly } of PERIODS) {
    for (const [blok, mapa] of bloki) {
      out[blok][quarterly ? 'quarterly' : 'annual'] = collectRows(series, prefix, periodType, mapa, quarterly);
    }
  }
  return out;
}

/** Zbiera wiersze jednego sprawozdania dla jednego typu okresu, sklejone po dacie. */
function collectRows(series, prefix, periodType, fieldMap, isQuarterly) {
  const byDate = new Map();

  for (const [rowKey, candidates] of Object.entries(fieldMap)) {
    for (const suffix of candidates) {
      const rows = series.get(prefix + suffix);
      if (!rows) continue;

      for (const row of rows) {
        if (row.periodType !== periodType) continue;
        const value = row?.reportedValue?.raw;
        const date = row?.asOfDate;
        if (value == null || !date) continue;

        if (!byDate.has(date)) byDate.set(date, {});
        const target = byDate.get(date);
        // Pierwszy kandydat z listy wygrywa — kolejne to tylko zapas.
        if (target[rowKey] == null) target[rowKey] = value;
        if (!target.currency && row.currencyCode) target.currency = row.currencyCode;
      }
    }
  }

  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0])) // najnowszy okres pierwszy
    .map(([date, fields]) => ({
      date,
      period: derivePeriod(date, isQuarterly),
      ...fields,
    }));
}

/**
 * keyStats z quoteSummary — wymaga crumba i cookie.
 * Zwraca null, gdy cokolwiek po drodze zawiedzie; to nie jest błąd krytyczny.
 */
async function fetchKeyStats(symbol, cache, waitUntil) {
  try {
    let auth = await getCachedCrumb(cache);
    if (!auth) auth = await fetchFreshCrumb(cache, waitUntil);
    if (!auth) return null;

    let raw = await fetchQuoteSummary(symbol, auth.crumb, auth.cookie, 'query2');
    if (raw === 401) {
      await cache.delete(new Request(CRUMB_CACHE_URL));
      auth = await fetchFreshCrumb(cache, waitUntil);
      raw = auth ? await fetchQuoteSummary(symbol, auth.crumb, auth.cookie, 'query1') : null;
    }
    if (!raw || raw === 401) return null;

    const result = raw.quoteSummary?.result?.[0];
    if (!result) return null;

    return extractKeyStats(result.defaultKeyStatistics, result.financialData);
  } catch {
    return null;
  }
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
    const fcResp = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });

    let cookieHeaders = [];
    if (typeof fcResp.headers.getAll === 'function') {
      cookieHeaders = fcResp.headers.getAll('set-cookie');
    } else {
      const raw = fcResp.headers.get('set-cookie');
      if (raw) cookieHeaders = [raw];
    }

    const cookieParts = cookieHeaders
      .map((h) => h.split(';')[0].trim())
      .filter(Boolean);

    const cookie = cookieParts.length > 0 ? cookieParts.join('; ') : 'A1=d=AQAB';

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
      `${encodeURIComponent(symbol)}?modules=${KEY_STATS_MODULES}&crumb=${encodeURIComponent(crumb)}`;

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

function derivePeriod(dateStr, isQuarterly) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const year = d.getFullYear();
  if (!isQuarterly) return `FY${year}`;
  const month = d.getMonth() + 1;
  if (month <= 3) return `Q1 ${year}`;
  if (month <= 6) return `Q2 ${year}`;
  if (month <= 9) return `Q3 ${year}`;
  return `Q4 ${year}`;
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
  'https://stockview.org',
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
