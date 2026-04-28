import { useState, useEffect, useRef, useCallback } from 'react';
import { TICKER_TO_YAHOO } from '../data/wig20';

const CACHE_KEY = 'sv_live_prices';
const CACHE_TTL = 60_000; // 60 seconds
const REFRESH_INTERVAL = 60_000; // auto-refresh every 60s
const FETCH_TIMEOUT = 5_000; // 5s timeout for /api/quote

// Reverse map: "PKO.WA" → "PKO", "MDV.WA" → "MOD", etc.
const YAHOO_TO_TICKER = Object.fromEntries(
  Object.entries(TICKER_TO_YAHOO).map(([ticker, yahoo]) => [yahoo, ticker])
);

const allSymbols = Object.values(TICKER_TO_YAHOO).join(',');

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached._fetchedAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* sessionStorage full — ignore */ }
}

/**
 * Map /api/quote response → format expected by useStockData:
 * { prices: { PKO: { close, change, changePercent, date, volume } }, lastUpdated: "YYYY-MM-DD" }
 */
function mapApiQuotes(apiData) {
  const prices = {};
  const timestamp = apiData.timestamp;
  const dateStr = timestamp
    ? new Date(timestamp).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  for (const q of apiData.quotes) {
    const ticker = YAHOO_TO_TICKER[q.symbol] || q.symbol.replace(/\.WA$/, '');
    if (q.price == null) continue;

    prices[ticker] = {
      close: q.price,
      change: q.change ?? 0,
      changePercent: q.changePercent ?? 0,
      date: dateStr,
      volume: q.volume ?? 0,
    };
  }

  return { prices, lastUpdated: dateStr };
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLiveQuotes() {
  const resp = await fetchWithTimeout(
    `/api/quote?symbols=${encodeURIComponent(allSymbols)}`,
    FETCH_TIMEOUT
  );
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (!data.quotes?.length) throw new Error('Empty quotes response');
  return mapApiQuotes(data);
}

async function fetchStaticFallback() {
  const resp = await fetch('/data/latest-prices.json');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const result = await resp.json();
  // Derive session date from the price data itself
  const dates = Object.values(result.prices || {}).map(p => p.date).filter(Boolean);
  const sessionDate = dates.length ? dates.sort().pop() : result.lastUpdated;
  return { prices: result.prices, lastUpdated: sessionDate };
}

export default function useLatestPrices() {
  const [data, setData] = useState(() => getCached());
  const [loading, setLoading] = useState(!getCached());
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchPrices = useCallback(async (isInitial = false) => {
    // On non-initial fetches, check cache first
    if (!isInitial) {
      const cached = getCached();
      if (cached) {
        setData(cached);
        return;
      }
    }

    if (isInitial) setLoading(true);
    setError(null);

    try {
      // Try live API first
      const result = await fetchLiveQuotes();
      const withTimestamp = { ...result, _fetchedAt: Date.now(), _source: 'live' };
      setData(withTimestamp);
      setCache(withTimestamp);
    } catch (liveErr) {
      // Fallback to static JSON
      try {
        const result = await fetchStaticFallback();
        const withTimestamp = { ...result, _fetchedAt: Date.now(), _source: 'static' };
        setData(withTimestamp);
        setCache(withTimestamp);
      } catch (fallbackErr) {
        setError(fallbackErr.message);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      fetchPrices(true);
    }

    // Auto-refresh every 60s
    intervalRef.current = setInterval(() => fetchPrices(false), REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchPrices]);

  return {
    prices: data?.prices || null,
    loading,
    error,
    lastUpdated: data?.lastUpdated || null,
  };
}
