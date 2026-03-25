import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import { Sun, Moon, Globe, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
  const { dark, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();
  const location = useLocation();

  return (
    <div className="min-h-screen noise-overlay flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-surface-200/40 dark:border-surface-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center
                            shadow-md shadow-brand-600/30 group-hover:shadow-lg group-hover:shadow-brand-600/40
                            transition-shadow duration-300">
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Stock<span className="text-brand-600 dark:text-brand-400">View</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink to="/" active={location.pathname === '/'}>
                <BarChart3 className="w-4 h-4" />
                {t('nav.home')}
              </NavLink>
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Language */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                         text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900
                         transition-colors duration-200"
                title={lang === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase font-mono text-xs">{lang === 'pl' ? 'EN' : 'PL'}</span>
              </button>

              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center
                         text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900
                         transition-colors duration-200"
                title={dark ? t('theme.light') : t('theme.dark')}
              >
                <motion.div
                  key={dark ? 'moon' : 'sun'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200/40 dark:border-surface-800/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-surface-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <span className="font-display font-semibold">StockView</span>
              <span className="text-surface-400">·</span>
              <span>WIG20</span>
            </div>
            <p className="text-center text-xs text-surface-400">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900'
        }`}
    >
      {children}
    </Link>
  );
}
