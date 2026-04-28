import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import DividendsPage from './pages/DividendsPage';
import WatchlistPage from './pages/WatchlistPage';
import AdminDividendsPage from './pages/AdminDividendsPage';
import { AnimatePresence, motion } from 'framer-motion';

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
          <Route path="/" element={<HomePage />} />
          <Route path="/stock/:id" element={<StockPage />} />
          <Route path="/dividends" element={<DividendsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/admin/dividends" element={<AdminDividendsPage />} />
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
                <AnimatedRoutes />
              </Layout>
            </BrowserRouter>
          </AuthModalProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
