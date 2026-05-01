import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLang } from '../context/LangContext';
import {
  wig20Companies, sectors, formatPrice, formatPercent, formatNumber,
} from '../data/wig20';
import useStockData from '../hooks/useStockData';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Constants ────────────────────────────────────────────────────────────── */

const DEFAULT_FILTERS = {
  sector: 'all',
  peMin: '', peMax: '',
  pbMin: '', pbMax: '',
  roeMin: '',
  dividendYieldMin: '',
  marketCapMin: '', marketCapMax: '',
  debtToEquityMax: '',
  hasProfit: false,
  hasDividend: false,
};

const PRESETS = [
  {
    id: 'value', icon: '\u{1F48E}',
    filters: { ...DEFAULT_FILTERS, peMax: '15', pbMax: '1.5', hasProfit: true },
  },
  {
    id: 'dividend', icon: '\u{1F4B0}',
    filters: { ...DEFAULT_FILTERS, dividendYieldMin: '3', hasDividend: true },
  },
  {
    id: 'quality', icon: '\u2B50',
    filters: { ...DEFAULT_FILTERS, roeMin: '12', debtToEquityMax: '1', hasProfit: true },
  },
  {
    id: 'bluechip', icon: '\u{1F3DB}\uFE0F',
    filters: { ...DEFAULT_FILTERS, marketCapMin: '20' },
  },
];

const SORT_OPTIONS = [
  { key: 'marketCap',     pl: 'Kapitalizacja', en: 'Market Cap' },
  { key: 'changePercent', pl: 'Zmiana %',      en: 'Change %' },
  { key: 'pe',            pl: 'P/E',           en: 'P/E' },
  { key: 'pb',            pl: 'P/B',           en: 'P/B' },
  { key: 'roe',           pl: 'ROE',           en: 'ROE' },
  { key: 'dividendYield', pl: 'Dywidenda',     en: 'Dividend' },
  { key: 'debtToEquity',  pl: 'Dług/Kapitał',  en: 'Debt/Equity' },
  { key: 'price',         pl: 'Cena',          en: 'Price' },
  { key: 'name',          pl: 'Nazwa',         en: 'Name' },
];

const COLUMNS = [
  { key: 'name',          pl: 'Spółka',     en: 'Stock',    minW: 180, sortKey: 'name' },
  { key: 'sector',        pl: 'Sektor',     en: 'Sector',   minW: 100, sortKey: null },
  { key: 'price',         pl: 'Kurs',       en: 'Price',    minW: 100, sortKey: 'price', align: 'right' },
  { key: 'changePercent', pl: 'Zmiana',     en: 'Change',   minW: 80,  sortKey: 'changePercent', align: 'right' },
  { key: 'pe',            pl: 'P/E',        en: 'P/E',      minW: 70,  sortKey: 'pe', align: 'right' },
  { key: 'pb',            pl: 'P/B',        en: 'P/B',      minW: 70,  sortKey: 'pb', align: 'right' },
  { key: 'roe',           pl: 'ROE',        en: 'ROE',      minW: 70,  sortKey: 'roe', align: 'right' },
  { key: 'dividendYield', pl: 'Dyw.',       en: 'Div.',     minW: 70,  sortKey: 'dividendYield', align: 'right' },
  { key: 'debtToEquity',  pl: 'D/E',        en: 'D/E',      minW: 70,  sortKey: 'debtToEquity', align: 'right' },
  { key: 'marketCap',     pl: 'Kap.',       en: 'MCap',     minW: 100, sortKey: 'marketCap', align: 'right' },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function countActiveFilters(filters) {
  let count = 0;
  if (filters.sector !== 'all') count++;
  if (filters.peMin !== '') count++;
  if (filters.peMax !== '') count++;
  if (filters.pbMin !== '') count++;
  if (filters.pbMax !== '') count++;
  if (filters.roeMin !== '') count++;
  if (filters.dividendYieldMin !== '') count++;
  if (filters.marketCapMin !== '') count++;
  if (filters.marketCapMax !== '') count++;
  if (filters.debtToEquityMax !== '') count++;
  if (filters.hasProfit) count++;
  if (filters.hasDividend) count++;
  return count;
}

function filtersEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getSortValue(stock, sortKey) {
  if (sortKey === 'name') return stock.shortName.toLowerCase();
  if (['pe', 'pb', 'roe', 'dividendYield', 'debtToEquity'].includes(sortKey)) {
    return stock.ratios[sortKey];
  }
  return stock[sortKey];
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function ScreenerPage() {
  const { t, lang } = useLang();
  const { companies } = useStockData();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState('marketCap');
  const [sortDir, setSortDir] = useState('desc');
  const [filtersOpen, setFiltersOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 640,
  );

  const activeCount = countActiveFilters(filters);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const updateFilter = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  /* ── Filtering ── */
  const filteredStocks = useMemo(() => {
    return companies.filter(stock => {
      const r = stock.ratios;
      const f = filters;

      if (f.sector !== 'all' && stock.sector !== f.sector) return false;

      if (f.peMin !== '' && (r.pe == null || r.pe < parseFloat(f.peMin))) return false;
      if (f.peMax !== '' && (r.pe == null || r.pe > parseFloat(f.peMax))) return false;
      if (f.pbMin !== '' && (r.pb == null || r.pb < parseFloat(f.pbMin))) return false;
      if (f.pbMax !== '' && (r.pb == null || r.pb > parseFloat(f.pbMax))) return false;
      if (f.roeMin !== '' && (r.roe == null || r.roe < parseFloat(f.roeMin))) return false;
      if (f.dividendYieldMin !== '' && (r.dividendYield == null || r.dividendYield < parseFloat(f.dividendYieldMin))) return false;
      if (f.marketCapMin !== '' && (stock.marketCap == null || stock.marketCap / 1000 < parseFloat(f.marketCapMin))) return false;
      if (f.marketCapMax !== '' && (stock.marketCap == null || stock.marketCap / 1000 > parseFloat(f.marketCapMax))) return false;
      if (f.debtToEquityMax !== '' && (r.debtToEquity == null || r.debtToEquity > parseFloat(f.debtToEquityMax))) return false;

      if (f.hasProfit) {
        const ni = stock.financials?.annual?.netIncome;
        const lastNI = ni && ni.length > 0 ? ni[ni.length - 1] : null;
        if (lastNI == null || lastNI <= 0) return false;
      }
      if (f.hasDividend && (r.dividendYield == null || r.dividendYield <= 0)) return false;

      return true;
    });
  }, [companies, filters]);

  /* ── Sorting ── */
  const sortedStocks = useMemo(() => {
    return [...filteredStocks].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);

      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      if (sortKey === 'name') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [filteredStocks, sortKey, sortDir]);

  const handleColumnSort = (colSortKey) => {
    if (!colSortKey) return;
    if (sortKey === colSortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(colSortKey);
      setSortDir(colSortKey === 'name' ? 'asc' : 'desc');
    }
  };

  const uniqueSectors = [...new Set(companies.map(s => s.sector).filter(Boolean))];

  return (
    <>
      <Helmet>
        <title>{lang === 'pl' ? 'Screener spółek WIG20 | StockView' : 'WIG20 Stock Screener | StockView'}</title>
        <meta name="description" content={lang === 'pl'
          ? 'Filtruj spółki WIG20 po P/E, ROE, stopie dywidendy, kapitalizacji i innych wskaźnikach. Znajdź spółki wartościowe, dywidendowe i jakościowe.'
          : 'Filter WIG20 stocks by P/E, ROE, dividend yield, market cap and other metrics. Find value, dividend, and quality stocks.'
        } />
      </Helmet>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{t('screener.title')}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{t('screener.subtitle')}</p>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map(preset => {
            const isActive = filtersEqual(filters, preset.filters);
            return (
              <button
                key={preset.id}
                onClick={() => setFilters(isActive ? DEFAULT_FILTERS : preset.filters)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                  border transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                      : 'border-surface-200/60 dark:border-surface-800/50 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900'
                  }`}
              >
                <span>{preset.icon}</span>
                {t(`screener.${preset.id}`)}
              </button>
            );
          })}
        </div>

        {/* Filter panel */}
        <div className="card mb-6">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="w-full flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{t('screener.filters')}</span>
              {activeCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                  {activeCount}
                </span>
              )}
            </div>
            {filtersOpen
              ? <ChevronUp className="w-4 h-4 text-surface-400" />
              : <ChevronDown className="w-4 h-4 text-surface-400" />
            }
          </button>

          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4">
                  {/* Sector */}
                  <FilterBlock label={t('screener.sector')}>
                    <select
                      value={filters.sector}
                      onChange={e => updateFilter('sector', e.target.value)}
                      className={inputCls}
                    >
                      <option value="all">{lang === 'pl' ? 'Wszystkie' : 'All'}</option>
                      {uniqueSectors.map(s => (
                        <option key={s} value={s}>{sectors[lang]?.[s] || s}</option>
                      ))}
                    </select>
                  </FilterBlock>

                  {/* P/E */}
                  <FilterBlock label="P/E">
                    <div className="flex gap-1.5">
                      <input type="number" step="0.1" placeholder={t('screener.from')}
                        value={filters.peMin} onChange={e => updateFilter('peMin', e.target.value)} className={inputCls} />
                      <input type="number" step="0.1" placeholder={t('screener.to')}
                        value={filters.peMax} onChange={e => updateFilter('peMax', e.target.value)} className={inputCls} />
                    </div>
                  </FilterBlock>

                  {/* P/B */}
                  <FilterBlock label="P/B">
                    <div className="flex gap-1.5">
                      <input type="number" step="0.1" min="0" placeholder={t('screener.from')}
                        value={filters.pbMin} onChange={e => updateFilter('pbMin', e.target.value)} className={inputCls} />
                      <input type="number" step="0.1" min="0" placeholder={t('screener.to')}
                        value={filters.pbMax} onChange={e => updateFilter('pbMax', e.target.value)} className={inputCls} />
                    </div>
                  </FilterBlock>

                  {/* ROE */}
                  <FilterBlock label="ROE (%)">
                    <input type="number" step="0.1" placeholder={`${t('screener.min')} %`}
                      value={filters.roeMin} onChange={e => updateFilter('roeMin', e.target.value)} className={inputCls} />
                  </FilterBlock>

                  {/* Dividend Yield */}
                  <FilterBlock label={t('compare.dividendYield')}>
                    <input type="number" step="0.1" min="0" placeholder={`${t('screener.min')} %`}
                      value={filters.dividendYieldMin} onChange={e => updateFilter('dividendYieldMin', e.target.value)} className={inputCls} />
                  </FilterBlock>

                  {/* Market Cap */}
                  <FilterBlock label={`${t('screener.marketCap')} (${lang === 'pl' ? 'mld' : 'B'} PLN)`}>
                    <div className="flex gap-1.5">
                      <input type="number" step="1" min="0" placeholder={t('screener.from')}
                        value={filters.marketCapMin} onChange={e => updateFilter('marketCapMin', e.target.value)} className={inputCls} />
                      <input type="number" step="1" min="0" placeholder={t('screener.to')}
                        value={filters.marketCapMax} onChange={e => updateFilter('marketCapMax', e.target.value)} className={inputCls} />
                    </div>
                  </FilterBlock>

                  {/* Debt/Equity */}
                  <FilterBlock label={t('screener.debtToEquity')}>
                    <input type="number" step="0.1" min="0" placeholder={t('screener.max')}
                      value={filters.debtToEquityMax} onChange={e => updateFilter('debtToEquityMax', e.target.value)} className={inputCls} />
                  </FilterBlock>

                  {/* Checkboxes */}
                  <FilterBlock label="">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-surface-600 dark:text-surface-400">
                      <input type="checkbox" checked={filters.hasProfit}
                        onChange={e => updateFilter('hasProfit', e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-green-500 focus:ring-green-500/30" />
                      {t('screener.hasProfit')}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-surface-600 dark:text-surface-400 mt-2">
                      <input type="checkbox" checked={filters.hasDividend}
                        onChange={e => updateFilter('hasDividend', e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-green-500 focus:ring-green-500/30" />
                      {t('screener.hasDividend')}
                    </label>
                  </FilterBlock>
                </div>

                {/* Reset */}
                {activeCount > 0 && (
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-surface-200/40 dark:border-surface-800/40">
                    <button onClick={resetFilters}
                      className="text-xs text-surface-500 hover:text-red-500 transition-colors">
                      {t('screener.reset')}
                    </button>
                    <span className="text-[11px] text-surface-400">
                      {activeCount} {t('screener.activeFilters')}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            {t('screener.results')}: <strong>{sortedStocks.length}</strong> {t('screener.stocks')}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400 hidden sm:inline">{t('screener.sortBy')}:</span>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-900
                         border border-surface-200/60 dark:border-surface-800/50
                         focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{lang === 'pl' ? o.pl : o.en}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500
                         hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
              aria-label={sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Results table */}
        {sortedStocks.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200/50 dark:border-surface-800/50">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleColumnSort(col.sortKey)}
                      style={{ minWidth: col.minW }}
                      className={`py-3 px-3 text-xs font-medium text-surface-500 uppercase tracking-wide select-none
                        ${col.align === 'right' ? 'text-right' : 'text-left'}
                        ${col.sortKey ? 'cursor-pointer hover:text-surface-700 dark:hover:text-surface-300' : ''}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {lang === 'pl' ? col.pl : col.en}
                        {col.sortKey && sortKey === col.sortKey && (
                          sortDir === 'asc'
                            ? <ArrowUp className="w-3 h-3" />
                            : <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/30 dark:divide-surface-800/30">
                {sortedStocks.map(stock => (
                  <ResultRow key={stock.id} stock={stock} lang={lang} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-16 text-surface-400">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('screener.noResults')}</p>
            <button onClick={resetFilters}
              className="text-xs text-green-600 dark:text-green-400 mt-2 hover:underline">
              {t('screener.reset')}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────────────── */

const inputCls = `w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-900
  border border-surface-200/60 dark:border-surface-800/50
  text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30
  placeholder:text-surface-400`;

function FilterBlock({ label, children }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function ResultRow({ stock, lang }) {
  const isUp = stock.changePercent >= 0;
  const r = stock.ratios;

  return (
    <tr className="hover:bg-surface-100/50 dark:hover:bg-surface-800/30 transition-colors">
      <td className="py-2.5 px-3">
        <Link to={`/stock/${stock.id}`} className="flex items-center gap-2 cursor-pointer">
          <span className="text-lg leading-none">{stock.logo}</span>
          <div>
            <div className="font-medium text-surface-800 dark:text-surface-100">{stock.shortName}</div>
            <div className="text-[11px] text-surface-400">{stock.ticker}</div>
          </div>
        </Link>
      </td>
      <td className="py-2.5 px-3 text-surface-500 dark:text-surface-400 text-xs">
        {sectors[lang]?.[stock.sector] || stock.sector}
      </td>
      <td className="py-2.5 px-3 text-right font-mono">{formatPrice(stock.price)} PLN</td>
      <td className={`py-2.5 px-3 text-right font-mono font-medium ${
        isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
      }`}>
        {formatPercent(stock.changePercent)}
      </td>
      <td className="py-2.5 px-3 text-right font-mono">{r.pe != null ? r.pe.toFixed(1) : <Null />}</td>
      <td className="py-2.5 px-3 text-right font-mono">{r.pb != null ? r.pb.toFixed(2) : <Null />}</td>
      <td className="py-2.5 px-3 text-right font-mono">{r.roe != null ? r.roe.toFixed(1) + '%' : <Null />}</td>
      <td className="py-2.5 px-3 text-right font-mono">{r.dividendYield != null ? r.dividendYield.toFixed(1) + '%' : <Null />}</td>
      <td className="py-2.5 px-3 text-right font-mono">{r.debtToEquity != null ? r.debtToEquity.toFixed(2) : <Null />}</td>
      <td className="py-2.5 px-3 text-right font-mono">{formatNumber(stock.marketCap, lang)}</td>
    </tr>
  );
}

function Null() {
  return <span className="text-surface-400">—</span>;
}
