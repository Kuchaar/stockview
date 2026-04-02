// Cloudflare Pages Function — proxy for Yahoo Finance financial statements
// GET /api/financials?symbol=PKO.WA

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

export async function onRequestGet(context) {
  const reqOrigin = context.request.headers.get('Origin');
  const url = new URL(context.request.url);
  const symbol = url.searchParams.get('symbol');

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Missing symbol parameter' }), {
      status: 400,
      headers: corsHeaders('application/json', reqOrigin),
    });
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${MODULES}`;

    let resp = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!resp.ok) {
      // Try fallback
      const fallbackUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${MODULES}`;
      resp = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
    }

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Yahoo Finance API unavailable' }), {
        status: 502,
        headers: corsHeaders('application/json', reqOrigin),
      });
    }

    const raw = await resp.json();
    const result = raw.quoteSummary?.result?.[0];

    if (!result) {
      return new Response(JSON.stringify({ error: 'No data found for symbol' }), {
        status: 404,
        headers: corsHeaders('application/json', reqOrigin),
      });
    }

    const transformed = transformFinancials(result);

    return new Response(JSON.stringify({ symbol, ...transformed, timestamp: Date.now() }), {
      status: 200,
      headers: corsHeaders('application/json', reqOrigin),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), {
      status: 502,
      headers: corsHeaders('application/json', reqOrigin),
    });
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
