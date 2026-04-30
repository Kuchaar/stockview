import { useState, useEffect, useCallback } from 'react';
import { normalizeFinancials } from '../data/financialSchema';
import { wig20Companies } from '../data/wig20';

const CACHE_TTL = 3_600_000; // 1 hour

function getCached(companyId) {
  try {
    const raw = sessionStorage.getItem(`sv_fin_v3_${companyId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached._cachedAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCache(companyId, data) {
  try {
    sessionStorage.setItem(`sv_fin_v3_${companyId}`, JSON.stringify({
      ...data,
      _cachedAt: Date.now(),
    }));
  } catch { /* ignore */ }
}

export default function useFinancials(yahooSymbol, companyId) {
  const [data, setData] = useState(() => companyId ? getCached(companyId) : null);
  const [loading, setLoading] = useState(() => companyId ? !getCached(companyId) : false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!companyId) return;

    const cached = getCached(companyId);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Tier 1: Yahoo API
      if (yahooSymbol) {
        try {
          const resp = await fetch(`/api/financials?symbol=${encodeURIComponent(yahooSymbol)}`);
          if (resp.ok) {
            const result = await resp.json();
            if (result.source !== 'unavailable') {
              const ticker = yahooSymbol.replace(/\.WA$/, '');
              const normalized = normalizeFinancials(result, 'yahoo', { ticker, companyId });
              setData(normalized);
              setCache(companyId, normalized);
              return;
            }
          }
        } catch { /* fall through to tier 2 */ }
      }

      // Tier 2: Manual JSON files
      try {
        const resp = await fetch(`/data/financials/${companyId}/data.json`);
        if (resp.ok) {
          const result = await resp.json();
          const normalized = normalizeFinancials(result, 'manual', { companyId });
          setData(normalized);
          setCache(companyId, normalized);
          return;
        }
      } catch { /* fall through to tier 3 */ }

      // Tier 3: Hardcoded wig20.js data
      const company = wig20Companies.find(c => c.id === companyId);
      if (company) {
        const normalized = normalizeFinancials(company, 'hardcoded', {
          ticker: company.ticker,
          companyId,
        });
        setData(normalized);
        // Don't cache hardcoded — always try Yahoo/manual first on next mount
        return;
      }

      setError('No financial data available');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [yahooSymbol, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    source: data?.source || null,
    refetch: fetchData,
  };
}
