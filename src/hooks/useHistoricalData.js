import { useState, useEffect, useCallback } from 'react';

const CACHE_TTL = 30 * 60_000; // 30 minutes

function getCached(ticker) {
  try {
    const raw = sessionStorage.getItem(`sv_hist_${ticker}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached._fetchedAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

export default function useHistoricalData(ticker) {
  const lowerTicker = ticker?.toLowerCase();
  const [data, setData] = useState(() => getCached(lowerTicker));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!lowerTicker) return;

    const cached = getCached(lowerTicker);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(`/data/history/${lowerTicker}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      const withTimestamp = { ...result, _fetchedAt: Date.now() };
      setData(withTimestamp);
      try {
        sessionStorage.setItem(`sv_hist_${lowerTicker}`, JSON.stringify(withTimestamp));
      } catch { /* ignore */ }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lowerTicker]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    history: data?.data || null,
    count: data?.count || 0,
    lastUpdated: data?.lastUpdated || null,
    loading,
    error,
    refetch: fetchData,
  };
}
