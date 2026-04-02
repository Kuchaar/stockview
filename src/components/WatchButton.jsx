import { Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import useWatchlist from '../hooks/useWatchlist';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useLang } from '../context/LangContext';

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]',
  lg: 'w-5 h-5',
};

export default function WatchButton({ companyId, size = 'md' }) {
  const { user } = useAuth();
  const { isWatched, toggle } = useWatchlist();
  const { setOpen } = useAuthModal();
  const { lang } = useLang();

  const watched = user ? isWatched(companyId) : false;

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setOpen(true);
      return;
    }
    toggle(companyId);
  }

  const tooltip = watched
    ? lang === 'pl' ? 'Usuń z obserwowanych' : 'Remove from watchlist'
    : lang === 'pl' ? 'Dodaj do obserwowanych' : 'Add to watchlist';

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={handleClick}
      title={tooltip}
      className={`${sizes[size]} rounded-lg flex items-center justify-center
                 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors duration-200`}
    >
      <Bookmark
        className={`${iconSizes[size]} transition-colors duration-200 ${
          watched
            ? 'text-brand-400 fill-brand-400'
            : 'text-surface-400'
        }`}
      />
    </motion.button>
  );
}
