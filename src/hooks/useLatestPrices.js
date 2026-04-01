import { useState, useEffect } from 'react';

const CACHE_KEY = 'sv_latest_prices';
const CACHE_TTL = 5 * 60_000; // 5 minutes (static data, changes only on deploy)

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

export default function useLatestPrices() {
  const [data, setData] = useState(() => getCached());
  const [loading, setLoading] = useState(!getCached());
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/data/latest-prices.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((result) => {
        const withTimestamp = { ...result, _fetchedAt: Date.now() };
        setData(withTimestamp);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(withTimestamp));
        } catch { /* ignore */ }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return {
    prices: data?.prices || null,
    loading,
    error,
    lastUpdated: data?.lastUpdated || null,
  };
}
