import { useState, useEffect, useCallback } from 'react';

const CACHE_TTL = 3_600_000; // 1 hour

function getCached(ticker) {
  try {
    const raw = sessionStorage.getItem(`sv_ohlcv_v1_${ticker}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached._cachedAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCache(ticker, payload) {
  try {
    sessionStorage.setItem(`sv_ohlcv_v1_${ticker}`, JSON.stringify({
      ...payload,
      _cachedAt: Date.now(),
    }));
  } catch { /* ignore */ }
}

export default function useHistoricalPrices(ticker) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    if (!ticker) return;

    const cached = getCached(ticker);
    if (cached) {
      setData(cached.data || []);
      setLastUpdated(cached.lastUpdated || null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(`/data/history/${ticker.toLowerCase()}.json`);
      if (resp.status === 404) {
        setData([]);
        setLastUpdated(null);
        setLoading(false);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const result = await resp.json();
      const rows = result.data || [];
      setData(rows);
      setLastUpdated(result.lastUpdated || null);
      setCache(ticker, { data: rows, lastUpdated: result.lastUpdated });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (!ticker) {
      setData([]);
      setLastUpdated(null);
      setLoading(false);
      return;
    }
    fetchData();
  }, [ticker, fetchData]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}
