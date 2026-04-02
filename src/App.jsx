import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <AuthModalProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/stock/:id" element={<StockPage />} />
                  <Route path="/dividends" element={<DividendsPage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                  <Route path="/admin/dividends" element={<AdminDividendsPage />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </AuthModalProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
