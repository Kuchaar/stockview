import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';

// Strona główna ładuje się od razu — to na nią trafia większość wejść.
// Reszta tras dociąga się przy pierwszym wejściu, żeby nie ciągnąć ich w głównej paczce.
const StockPage = lazy(() => import('./pages/StockPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const ScreenerPage = lazy(() => import('./pages/ScreenerPage'));
const DividendsPage = lazy(() => import('./pages/DividendsPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const AdminDividendsPage = lazy(() => import('./pages/AdminDividendsPage'));
const AdminFinancialsPage = lazy(() => import('./pages/AdminFinancialsPage'));

/**
 * Zastępnik na czas dociągania strony. Bez własnego tła — dziedziczy je po `body`,
 * więc w ciemnym motywie nic nie mignie na biało. Stała wysokość trzyma stopkę w miejscu.
 */
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-hidden="true">
      <div className="w-6 h-6 rounded-full border-2 border-surface-300 dark:border-surface-700
                      border-t-brand-600 dark:border-t-brand-400 animate-spin" />
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        {/* Strony prywatne trzymamy poza indeksem — jedno miejsce zamiast Helmeta w każdej. */}
        {/^\/(admin|watchlist)/.test(location.pathname) && (
          <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
        )}
        <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/stock/:id" element={<ErrorBoundary><StockPage /></ErrorBoundary>} />
          <Route path="/compare" element={<ErrorBoundary><ComparePage /></ErrorBoundary>} />
          <Route path="/screener" element={<ErrorBoundary><ScreenerPage /></ErrorBoundary>} />
          <Route path="/dividends" element={<ErrorBoundary><DividendsPage /></ErrorBoundary>} />
          <Route path="/watchlist" element={<ErrorBoundary><WatchlistPage /></ErrorBoundary>} />
          <Route path="/admin/dividends" element={<ErrorBoundary><AdminDividendsPage /></ErrorBoundary>} />
          <Route path="/admin/financials" element={<ErrorBoundary><AdminFinancialsPage /></ErrorBoundary>} />
        </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <AuthModalProvider>
            <BrowserRouter>
              <Layout>
                <ErrorBoundary>
                  <AnimatedRoutes />
                </ErrorBoundary>
              </Layout>
            </BrowserRouter>
          </AuthModalProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
