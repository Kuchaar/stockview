import { useState, useEffect, useCallback, useRef } from 'react';
import { TICKER_TO_YAHOO } from '../data/wig20';

const CACHE_KEY = 'sv_quotes';
const CACHE_TTL = 60_000; // 60 seconds
const REFRESH_INTERVAL = 60_000;

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
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

export default function useStockQuotes() {
  const [quotes, setQuotes] = useState(() => getCached()?.quotes || null);
  const [loading, setLoading] = useState(!getCached());
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => getCached()?.timestamp || null);
  const intervalRef = useRef(null);

  const symbols = Object.values(TICKER_TO_YAHOO).join(',');

  const fetchQuotes = useCallback(async (isInitial = false) => {
    // Check cache first (on non-initial calls)
    if (!isInitial) {
      const cached = getCached();
      if (cached) {
        setQuotes(cached.quotes);
        setLastUpdated(cached.timestamp);
        return;
      }
    }

    try {
      if (isInitial) setLoading(true);
      setError(null);

      const resp = await fetch(`/api/quote?symbols=${encodeURIComponent(symbols)}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      const quoteMap = {};
      for (const q of data.quotes) {
        quoteMap[q.symbol] = q;
      }

      setQuotes(quoteMap);
      setLastUpdated(data.timestamp);
      setCache({ quotes: quoteMap, timestamp: data.timestamp });
    } catch (err) {
      setError(err.message);
      // Keep existing quotes on error (fallback)
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchQuotes(true);

    intervalRef.current = setInterval(() => fetchQuotes(false), REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchQuotes]);

  return { quotes, loading, error, lastUpdated, refetch: () => fetchQuotes(true) };
}
