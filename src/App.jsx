import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import ComparePage from './pages/ComparePage';
import ScreenerPage from './pages/ScreenerPage';
import DividendsPage from './pages/DividendsPage';
import WatchlistPage from './pages/WatchlistPage';
import AdminDividendsPage from './pages/AdminDividendsPage';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';

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
        <Routes location={location}>
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/stock/:id" element={<ErrorBoundary><StockPage /></ErrorBoundary>} />
          <Route path="/compare" element={<ErrorBoundary><ComparePage /></ErrorBoundary>} />
          <Route path="/screener" element={<ErrorBoundary><ScreenerPage /></ErrorBoundary>} />
          <Route path="/dividends" element={<ErrorBoundary><DividendsPage /></ErrorBoundary>} />
          <Route path="/watchlist" element={<ErrorBoundary><WatchlistPage /></ErrorBoundary>} />
          <Route path="/admin/dividends" element={<ErrorBoundary><AdminDividendsPage /></ErrorBoundary>} />
        </Routes>
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
