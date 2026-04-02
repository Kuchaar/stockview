import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import useWatchlist from '../hooks/useWatchlist';
import useStockData from '../hooks/useStockData';
import StockCard from '../components/StockCard';
import { Bookmark, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WatchlistPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { setOpen } = useAuthModal();
  const { watchlist, loading: watchlistLoading } = useWatchlist();
  const { companies } = useStockData();

  const t = {
    pl: {
      title: 'Moje obserwowane',
      loginMsg: 'Zaloguj się, aby korzystać z listy obserwowanych',
      loginBtn: 'Zaloguj się',
      emptyTitle: 'Nie obserwujesz jeszcze żadnych spółek.',
      emptyHint: 'Kliknij 🔖 przy dowolnej spółce, aby ją dodać.',
    },
    en: {
      title: 'My Watchlist',
      loginMsg: 'Sign in to use your watchlist',
      loginBtn: 'Sign in',
      emptyTitle: "You're not watching any stocks yet.",
      emptyHint: 'Click 🔖 on any stock to add it.',
    },
  }[lang];

  const watchedStocks = companies.filter((c) => watchlist.includes(c.id));

  // Not logged in
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-20"
      >
        <Bookmark className="w-12 h-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
        <p className="text-surface-500 text-lg mb-6">{t.loginMsg}</p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl
                   text-sm font-medium shadow-md shadow-brand-600/20 hover:bg-brand-700
                   transition-all duration-200"
        >
          <LogIn className="w-4 h-4" />
          {t.loginBtn}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.title}</h1>
        {watchedStocks.length > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {watchedStocks.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {!watchlistLoading && watchedStocks.length === 0 && (
        <div className="text-center py-16">
          <Bookmark className="w-10 h-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
          <p className="text-surface-500 mb-1">{t.emptyTitle}</p>
          <p className="text-surface-400 text-sm">{t.emptyHint}</p>
        </div>
      )}

      {/* Stock grid */}
      {watchedStocks.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {watchedStocks.map((stock, i) => (
            <StockCard key={stock.id} stock={stock} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
