import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLang } from '../context/LangContext';
import { wig20Companies, sectors, formatPrice, formatPercent, formatNumber } from '../data/wig20';
import TradingViewChart from '../components/TradingViewChart';
import FinancialTable from '../components/FinancialTable';
import ValuationMetrics from '../components/ValuationMetrics';
import HealthScore from '../components/HealthScore';
import { calculateHealthScore } from '../data/wig20';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, FileText, Target, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'chart', icon: BarChart3 },
  { id: 'financials', icon: FileText },
  { id: 'valuation', icon: Target },
  { id: 'health', icon: Shield },
];

export default function StockPage() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const [tab, setTab] = useState('chart');

  const stock = wig20Companies.find(s => s.id === id);

  if (!stock) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500 text-lg mb-4">
          {lang === 'pl' ? 'Spółka nie znaleziona' : 'Stock not found'}
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('stock.backToList')}
        </Link>
      </div>
    );
  }

  const isUp = stock.changePercent >= 0;
  const sectorName = sectors[lang]?.[stock.sector] || stock.sector;
  const health = calculateHealthScore(stock.ratios);

  const healthColor = {
    strong: 'text-up',
    good: 'text-up',
    neutral: 'text-warn',
    weak: 'text-down',
    critical: 'text-down',
  }[health.label];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500
                 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('stock.backToList')}
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-900
                          flex items-center justify-center text-2xl">
              {stock.logo}
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
                {stock.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-sm text-surface-500">{stock.tvSymbol}</span>
                <span className="text-surface-300 dark:text-surface-700">·</span>
                <span className="text-sm text-surface-500">{sectorName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-6">
            <div>
              <div className="font-mono font-bold text-3xl">
                {formatPrice(stock.price)} <span className="text-base text-surface-500">PLN</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${isUp ? 'badge-up' : 'badge-down'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatPercent(stock.changePercent)}
                </span>
                <span className={`font-mono text-sm ${isUp ? 'text-up' : 'text-down'}`}>
                  {isUp ? '+' : ''}{stock.change.toFixed(2)} PLN
                </span>
              </div>
            </div>

            {/* Mini health badge */}
            <div className="text-right">
              <div className="metric-label mb-1">{t('stock.healthScore')}</div>
              <span className={`font-display font-bold text-2xl ${healthColor}`}>
                {health.score}
              </span>
              <span className="text-xs text-surface-400">/100</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-200/50 dark:border-surface-800/50">
          <QuickStat label={t('home.marketCap')} value={formatNumber(stock.marketCap, lang)} />
          <QuickStat label={t('home.pe')} value={stock.ratios.pe !== null ? stock.ratios.pe.toFixed(1) : '—'} />
          <QuickStat label={t('stock.dividendYield')} value={`${stock.ratios.dividendYield}%`} />
          <QuickStat label={t('stock.roe')} value={`${stock.ratios.roe?.toFixed(1) || '—'}%`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {TABS.map(({ id: tabId, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`tab-button flex items-center gap-2 whitespace-nowrap
              ${tab === tabId ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {t(`stock.${tabId}`)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tab === 'chart' && (
          <div className="space-y-4">
            <TradingViewChart symbol={stock.tvSymbol} height={520} />
            <p className="text-xs text-surface-400 text-center">
              {lang === 'pl'
                ? 'Użyj paska narzędzi wykresu, aby dodać oscylatory (RSI, MACD, Bollinger Bands i inne).'
                : 'Use the chart toolbar to add oscillators (RSI, MACD, Bollinger Bands, and more).'}
            </p>
          </div>
        )}

        {tab === 'financials' && (
          <div className="card">
            <h2 className="section-title mb-6">{t('stock.financials')}</h2>
            <FinancialTable financials={stock.financials} />
          </div>
        )}

        {tab === 'valuation' && (
          <div className="card">
            <h2 className="section-title mb-6">{t('stock.valuation')}</h2>
            <ValuationMetrics ratios={stock.ratios} />
          </div>
        )}

        {tab === 'health' && (
          <div className="card">
            <h2 className="section-title mb-6">{t('stock.health')}</h2>
            <HealthScore ratios={stock.ratios} />
          </div>
        )}
      </motion.div>

      {/* Stock navigation */}
      <StockNavigation currentId={stock.id} />
    </motion.div>
  );
}

function QuickStat({ label, value }) {
  return (
    <div>
      <div className="metric-label mb-1">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}

function StockNavigation({ currentId }) {
  const { lang } = useLang();
  const idx = wig20Companies.findIndex(s => s.id === currentId);
  const prev = idx > 0 ? wig20Companies[idx - 1] : null;
  const next = idx < wig20Companies.length - 1 ? wig20Companies[idx + 1] : null;

  return (
    <div className="flex justify-between pt-6 border-t border-surface-200/40 dark:border-surface-800/40">
      {prev ? (
        <Link
          to={`/stock/${prev.id}`}
          className="flex items-center gap-2 text-sm text-surface-500
                   hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {prev.shortName}
        </Link>
      ) : <div />}
      {next ? (
        <Link
          to={`/stock/${next.id}`}
          className="flex items-center gap-2 text-sm text-surface-500
                   hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          {next.shortName}
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      ) : <div />}
    </div>
  );
}
