import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useDividends() {
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('dividends')
      .select('*')
      .order('ex_date', { ascending: true })
      .then(({ data }) => {
        setDividends(
          (data ?? []).map((r) => ({
            id: r.id,
            ticker: r.ticker,
            companyId: r.company_id,
            shortName: r.short_name,
            logo: r.logo,
            sector: r.sector,
            dividendPerShare: Number(r.dividend_per_share),
            dividendYield: Number(r.dividend_yield),
            exDate: r.ex_date,
            paymentDate: r.payment_date,
            status: r.status,
            year: r.year,
            note: r.note,
          })),
        );
        setLoading(false);
      });
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const upcoming = dividends
    .filter((d) => d.exDate >= today)
    .sort((a, b) => a.exDate.localeCompare(b.exDate));

  const recent = (() => {
    const d90 = new Date();
    d90.setDate(d90.getDate() - 90);
    const cutoff = d90.toISOString().split('T')[0];
    return dividends
      .filter((d) => d.exDate < today && d.exDate >= cutoff)
      .sort((a, b) => b.exDate.localeCompare(a.exDate));
  })();

  return { dividends, upcoming, recent, loading };
}
