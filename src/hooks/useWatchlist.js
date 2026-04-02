import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch watchlist on login
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      return;
    }
    setLoading(true);
    supabase
      .from('watchlist')
      .select('company_id')
      .then(({ data }) => {
        setWatchlist(data?.map((r) => r.company_id) ?? []);
        setLoading(false);
      });
  }, [user]);

  const isWatched = useCallback(
    (companyId) => watchlist.includes(companyId),
    [watchlist],
  );

  const toggle = useCallback(
    async (companyId) => {
      if (!user) return;
      if (isWatched(companyId)) {
        setWatchlist((prev) => prev.filter((id) => id !== companyId));
        await supabase.from('watchlist').delete().eq('company_id', companyId).eq('user_id', user.id);
      } else {
        setWatchlist((prev) => [...prev, companyId]);
        await supabase.from('watchlist').insert({ company_id: companyId, user_id: user.id });
      }
    },
    [user, isWatched],
  );

  return { watchlist, loading, isWatched, toggle };
}
