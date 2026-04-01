import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import {
  Sun, Moon, Globe, TrendingUp, BarChart3,
  DollarSign, Calendar, LogIn, LogOut, Menu, X, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children }) {
  const { dark, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { to: '/', label: t('nav.home'), icon: BarChart3 },
    { to: '/dividends', label: t('nav.dividends'), icon: DollarSign },
    { to: '/calendar', label: t('nav.calendar'), icon: Calendar, comingSoon: true },
  ];

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  async function handleSignOut() {
    setShowUserMenu(false);
    setMobileOpen(false);
    await signOut();
  }

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

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  active={location.pathname === item.to}
                  comingSoon={item.comingSoon}
                  comingSoonLabel={t('nav.comingSoon')}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Auth — desktop */}
              {user ? (
                <div className="hidden sm:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg
                             hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center
                                  text-white text-xs font-bold">
                      {userInitial}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 w-56 glass card !p-2 shadow-xl z-50"
                      >
                        <div className="px-3 py-2 border-b border-surface-200/40 dark:border-surface-800/40 mb-1">
                          <p className="text-xs text-surface-400 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-600
                                   dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800
                                   transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          {lang === 'pl' ? 'Wyloguj się' : 'Sign out'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden sm:flex items-center gap-1.5 border border-brand-600 text-brand-600
                           hover:bg-brand-600 hover:text-white rounded-lg px-3 py-1.5 text-sm font-medium
                           transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  {t('nav.login')}
                </button>
              )}

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

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center
                         text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900
                         transition-colors duration-200"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden overflow-hidden border-t border-surface-200/40 dark:border-surface-800/40"
            >
              <nav className="flex flex-col gap-1 px-4 py-3">
                {navItems.map((item) => (
                  <MobileNavLink
                    key={item.to}
                    to={item.to}
                    active={location.pathname === item.to}
                    comingSoon={item.comingSoon}
                    comingSoonLabel={t('nav.comingSoon')}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </MobileNavLink>
                ))}

                {/* Auth — mobile */}
                {user ? (
                  <div className="mt-2 pt-2 border-t border-surface-200/40 dark:border-surface-800/40">
                    <p className="text-xs text-surface-400 px-3 py-1 truncate">{user.email}</p>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                               text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900
                               transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      {lang === 'pl' ? 'Wyloguj się' : 'Sign out'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setShowAuthModal(true);
                    }}
                    className="flex items-center gap-2 mt-2 border border-brand-600 text-brand-600
                             hover:bg-brand-600 hover:text-white rounded-lg px-3 py-2 text-sm font-medium
                             transition-all duration-200"
                  >
                    <LogIn className="w-4 h-4" />
                    {t('nav.login')}
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

/* ─── Desktop nav link ─────────────────────────────────────────────────────── */

function NavLink({ to, active, comingSoon, comingSoonLabel, children }) {
  const base =
    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative';

  if (comingSoon) {
    return (
      <span
        className={`${base} text-surface-400 dark:text-surface-600 cursor-default`}
        title={comingSoonLabel}
      >
        {children}
        <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-200/60 dark:bg-surface-800/60 text-surface-400 dark:text-surface-600">
          {comingSoonLabel}
        </span>
      </span>
    );
  }

  return (
    <Link
      to={to}
      className={`${base} ${
        active
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900'
      }`}
    >
      {children}
    </Link>
  );
}

/* ─── Mobile nav link ──────────────────────────────────────────────────────── */

function MobileNavLink({ to, active, comingSoon, comingSoonLabel, onClick, children }) {
  const base =
    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200';

  if (comingSoon) {
    return (
      <span className={`${base} text-surface-400 dark:text-surface-600 cursor-default`}>
        {children}
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-200/60 dark:bg-surface-800/60 text-surface-400 dark:text-surface-600">
          {comingSoonLabel}
        </span>
      </span>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${base} ${
        active
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900'
      }`}
    >
      {children}
    </Link>
  );
}
