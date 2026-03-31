import { useState, useEffect, useCallback } from 'react';

const CACHE_TTL = 3_600_000; // 1 hour

function getCached(symbol) {
  try {
    const raw = sessionStorage.getItem(`sv_fin_${symbol}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCache(symbol, data) {
  try {
    sessionStorage.setItem(`sv_fin_${symbol}`, JSON.stringify(data));
  } catch { /* ignore */ }
}

export default function useFinancials(yahooSymbol) {
  const [data, setData] = useState(() => getCached(yahooSymbol));
  const [loading, setLoading] = useState(!getCached(yahooSymbol));
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!yahooSymbol) return;

    const cached = getCached(yahooSymbol);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resp = await fetch(`/api/financials?symbol=${encodeURIComponent(yahooSymbol)}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const result = await resp.json();
      setData(result);
      setCache(yahooSymbol, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [yahooSymbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
