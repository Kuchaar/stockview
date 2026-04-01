import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import DividendsPage from './pages/DividendsPage';

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/stock/:id" element={<StockPage />} />
              <Route path="/dividends" element={<DividendsPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </LangProvider>
    </ThemeProvider>
  );
}
