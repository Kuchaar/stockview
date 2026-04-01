#!/usr/bin/env node
// Fetch historical OHLCV data for all WIG20 companies
// Source: Yahoo Finance chart API (v8) — supports .WA (Warsaw) tickers
// Usage: node scripts/fetch-stooq.mjs
// Generates: public/data/history/{ticker}.json + public/data/latest-prices.json

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'public', 'data');
const HISTORY_DIR = join(DATA_DIR, 'history');

// WIG20 ticker → Yahoo Finance symbol mapping
const STOCKS = [
  { ticker: 'PKO', yahoo: 'PKO.WA' },
  { ticker: 'PKN', yahoo: 'PKN.WA' },
  { ticker: 'KGH', yahoo: 'KGH.WA' },
  { ticker: 'PZU', yahoo: 'PZU.WA' },
  { ticker: 'PEO', yahoo: 'PEO.WA' },
  { ticker: 'CDR', yahoo: 'CDR.WA' },
  { ticker: 'MOD', yahoo: 'MDV.WA' },
  { ticker: 'DNP', yahoo: 'DNP.WA' },
  { ticker: 'LPP', yahoo: 'LPP.WA' },
  { ticker: 'CPS', yahoo: 'CPS.WA' },
  { ticker: 'MBK', yahoo: 'MBK.WA' },
  { ticker: 'JSW', yahoo: 'JSW.WA' },
  { ticker: 'PGE', yahoo: 'PGE.WA' },
  { ticker: 'KRU', yahoo: 'KRU.WA' },
  { ticker: 'CCC', yahoo: 'CCC.WA' },
  { ticker: 'PCO', yahoo: 'PCO.WA' },
  { ticker: 'ACP', yahoo: 'ACP.WA' },
  { ticker: 'OPL', yahoo: 'OPL.WA' },
  { ticker: 'ALR', yahoo: 'ALR.WA' },
  { ticker: 'KTY', yahoo: 'KTY.WA' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStock(yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=5y&interval=1d`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const json = await resp.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('No chart data');

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};

  const data = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close?.[i];
    if (close == null) continue;

    data.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: +(quote.open?.[i] ?? close).toFixed(2),
      high: +(quote.high?.[i] ?? close).toFixed(2),
      low: +(quote.low?.[i] ?? close).toFixed(2),
      close: +close.toFixed(2),
      volume: quote.volume?.[i] ?? 0,
    });
  }

  return data;
}

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(HISTORY_DIR)) mkdirSync(HISTORY_DIR, { recursive: true });

  const latestPrices = {};
  const today = new Date().toISOString().slice(0, 10);
  let successCount = 0;
  let errorCount = 0;

  console.log(`Fetching WIG20 historical data (5y daily OHLCV)...`);
  console.log(`Source: Yahoo Finance chart API\n`);

  for (const stock of STOCKS) {
    try {
      process.stdout.write(`  ${stock.ticker} (${stock.yahoo})... `);
      const data = await fetchStock(stock.yahoo);

      if (data.length === 0) {
        console.log('NO DATA');
        errorCount++;
        continue;
      }

      // Save history file (compact JSON — no whitespace)
      const historyFile = join(HISTORY_DIR, `${stock.ticker.toLowerCase()}.json`);
      writeFileSync(
        historyFile,
        JSON.stringify({
          ticker: stock.ticker,
          yahooSymbol: stock.yahoo,
          lastUpdated: today,
          count: data.length,
          data,
        })
      );

      // Extract latest price
      const latest = data[data.length - 1];
      const prev = data.length >= 2 ? data[data.length - 2] : null;
      const change = prev ? +(latest.close - prev.close).toFixed(2) : 0;
      const changePercent = prev ? +((change / prev.close) * 100).toFixed(2) : 0;

      latestPrices[stock.ticker] = {
        close: latest.close,
        change,
        changePercent,
        date: latest.date,
        volume: latest.volume,
        open: latest.open,
        high: latest.high,
        low: latest.low,
      };

      const sizeKB = (Buffer.byteLength(JSON.stringify({ data })) / 1024).toFixed(0);
      console.log(`OK (${data.length} days, ${sizeKB}KB, latest: ${latest.close} PLN @ ${latest.date})`);
      successCount++;
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errorCount++;
    }

    // Rate limiting
    await sleep(500);
  }

  // Write latest-prices.json
  const latestFile = join(DATA_DIR, 'latest-prices.json');
  writeFileSync(latestFile, JSON.stringify({ lastUpdated: today, prices: latestPrices }, null, 2));

  console.log(`\nDone! ${successCount} succeeded, ${errorCount} failed.`);
  console.log(`Output: ${DATA_DIR}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
