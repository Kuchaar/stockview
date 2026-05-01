import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLang } from '../context/LangContext';
import {
  wig20Companies, sectors, formatPrice, formatPercent, formatNumber,
} from '../data/wig20';
import useStockData from '../hooks/useStockData';
import { Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

const sortedCompanies = [...wig20Companies].sort((a, b) =>
  a.shortName.localeCompare(b.shortName, 'pl'),
);

// Row definitions: [translationKey, getter, config]
// config.higher = true  → higher is better (green)
// config.higher = false → lower is better (green)
// config.higher = null  → no highlighting
const SECTIONS = [
  {
    key: 'priceAndCap',
    labelPl: 'Cena i kapitalizacja',
    labelEn: 'Price & Market Cap',
    rows: [
      { key: 'price', get: (s, lang) => formatPrice(s.price) + ' PLN', raw: s => s.price, higher: null },
      {
        key: 'change',
        get: (s) => formatPercent(s.changePercent),
        raw: s => s.changePercent,
        higher: null,
        color: s => s.changePercent >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-500 dark:text-red-400',
      },
      { key: 'marketCap', get: (s, lang) => formatNumber(s.marketCap, lang), raw: s => s.marketCap, higher: null },
    ],
  },
  {
    key: 'valuation',
    rows: [
      { key: 'pe', label: 'P/E', get: s => s.ratios.pe?.toFixed(1), raw: s => s.ratios.pe, higher: false },
      { key: 'pb', label: 'P/B', get: s => s.ratios.pb?.toFixed(2), raw: s => s.ratios.pb, higher: false },
      { key: 'evEbitda', label: 'EV/EBITDA', get: s => s.ratios.evEbitda?.toFixed(1), raw: s => s.ratios.evEbitda, higher: false },
      { key: 'dividendYield', get: s => s.ratios.dividendYield != null ? s.ratios.dividendYield.toFixed(1) + '%' : null, raw: s => s.ratios.dividendYield, higher: true },
    ],
  },
  {
    key: 'profitability',
    rows: [
      { key: 'roe', label: 'ROE', get: s => s.ratios.roe != null ? s.ratios.roe.toFixed(1) + '%' : null, raw: s => s.ratios.roe, higher: true },
      { key: 'roa', label: 'ROA', get: s => s.ratios.roa != null ? s.ratios.roa.toFixed(1) + '%' : null, raw: s => s.ratios.roa, higher: true },
      { key: 'operatingMargin', get: s => s.ratios.operatingMargin != null ? s.ratios.operatingMargin.toFixed(1) + '%' : null, raw: s => s.ratios.operatingMargin, higher: true },
      { key: 'netMargin', get: s => s.ratios.netMargin != null ? s.ratios.netMargin.toFixed(1) + '%' : null, raw: s => s.ratios.netMargin, higher: true },
    ],
  },
  {
    key: 'balance',
    rows: [
      { key: 'debtToEquity', get: s => s.ratios.debtToEquity?.toFixed(2), raw: s => s.ratios.debtToEquity, higher: false },
      { key: 'currentRatio', label: 'Current Ratio', get: s => s.ratios.currentRatio?.toFixed(2), raw: s => s.ratios.currentRatio, higher: true },
      { key: 'eps', label: 'EPS', get: s => s.ratios.eps?.toFixed(2), raw: s => s.ratios.eps, higher: true },
    ],
  },
  {
    key: 'info',
    rows: [
      { key: 'employees', get: (s, lang) => s.profile?.employees?.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US'), raw: s => s.profile?.employees, higher: true },
      { key: 'founded', get: s => s.profile?.founded, raw: s => s.profile?.founded, higher: null },
      { key: 'ipoYear', get: s => s.profile?.ipoYear, raw: s => s.profile?.ipoYear, higher: null },
    ],
  },
];

function getBestIndices(stocks, raw, higher) {
  if (higher == null) return [];
  const values = stocks.map(s => {
    const v = raw(s);
    return v != null && isFinite(v) ? v : null;
  });
  const valid = values.filter(v => v != null);
  if (valid.length < 2) return [];
  const best = higher ? Math.max(...valid) : Math.min(...valid);
  return values.reduce((acc, v, i) => {
    if (v === best) acc.push(i);
    return acc;
  }, []);
}

export default function ComparePage() {
  const { t, lang } = useLang();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState([null, null]);

  const { companies } = useStockData();

  // Preselect from URL
  const preselected = searchParams.get('stock');
  useEffect(() => {
    if (preselected && wig20Companies.some(c => c.id === preselected)) {
      setSelected(prev => [preselected, prev[1]]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge live prices into static data
  const resolveStock = (id) => {
    if (!id) return null;
    const live = companies.find(c => c.id === id);
    if (live) return live;
    return wig20Companies.find(c => c.id === id) || null;
  };

  const stocks = useMemo(
    () => selected.map(resolveStock).filter(Boolean),
    [selected, companies],
  );

  const selectedSet = new Set(selected.filter(Boolean));

  const handleSelect = (index, value) => {
    setSelected(prev => {
      const next = [...prev];
      next[index] = value || null;
      return next;
    });
  };

  const addSlot = () => {
    if (selected.length < 4) setSelected(prev => [...prev, null]);
  };

  const removeSlot = (index) => {
    setSelected(prev => prev.filter((_, i) => i !== index));
  };

  const rowLabel = (row) => {
    if (row.label) return row.label;
    return t(`compare.${row.key}`);
  };

  const sectionLabel = (section) => {
    if (section.labelPl) return lang === 'pl' ? section.labelPl : section.labelEn;
    return t(`compare.${section.key}`);
  };

  return (
    <>
      <Helmet>
        <title>{lang === 'pl' ? 'Porównywarka spółek WIG20 | StockView' : 'Compare WIG20 Stocks | StockView'}</title>
        <meta name="description" content={lang === 'pl'
          ? 'Porównaj wskaźniki finansowe spółek WIG20 — P/E, ROE, marże, dywidenda i więcej.'
          : 'Compare financial metrics of WIG20 stocks — P/E, ROE, margins, dividend and more.'
        } />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{t('compare.title')}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{t('compare.subtitle')}</p>
        </div>

        {/* Stock selectors */}
        <div className="flex flex-wrap items-end gap-3 mb-8">
          {selected.map((id, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={id || ''}
                onChange={e => handleSelect(i, e.target.value)}
                aria-label={`${t('compare.selectStock')} ${i + 1}`}
                className="h-10 min-w-[180px] px-3 pr-8 rounded-lg border border-surface-200 dark:border-surface-800
                           bg-white dark:bg-surface-900 text-sm text-surface-700 dark:text-surface-200
                           focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
                           transition-colors appearance-none
                           bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22/%3E%3C/svg%3E')]
                           bg-[length:20px] bg-[right_6px_center] bg-no-repeat"
              >
                <option value="">{t('compare.selectStock')}</option>
                {sortedCompanies.map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={selectedSet.has(c.id) && c.id !== id}
                  >
                    {c.shortName} ({c.ticker})
                  </option>
                ))}
              </select>
              {i >= 2 && (
                <button
                  onClick={() => removeSlot(i)}
                  aria-label={t('compare.removeStock')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400
                             hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {selected.length < 4 && (
            <button
              onClick={addSlot}
              className="h-10 px-3 flex items-center gap-1.5 rounded-lg border border-dashed
                         border-surface-300 dark:border-surface-700 text-sm text-surface-500
                         hover:border-green-500 hover:text-green-600 dark:hover:text-green-400
                         transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('compare.addStock')}
            </button>
          )}
        </div>

        {/* Comparison table */}
        {stocks.length >= 2 ? (
          <div className="card overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: stocks.length * 140 + 160 }}>
              {/* Header */}
              <thead>
                <tr>
                  <th className="text-left p-3 border-b border-surface-200/50 dark:border-surface-800/50" />
                  {stocks.map(s => (
                    <th key={s.id} className="p-3 text-center border-b border-surface-200/50 dark:border-surface-800/50">
                      <div className="font-bold text-sm">{s.ticker}</div>
                      <div className="text-xs text-surface-500 dark:text-surface-400">{s.shortName}</div>
                      <div className="text-[11px] text-surface-400 mt-0.5">
                        {sectors[lang]?.[s.sector] || s.sector}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {SECTIONS.map(section => (
                  <SectionRows
                    key={section.key}
                    section={section}
                    stocks={stocks}
                    lang={lang}
                    sectionLabel={sectionLabel(section)}
                    rowLabel={rowLabel}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-16 text-surface-400">
            <p className="text-sm">{t('compare.minTwo')}</p>
          </div>
        )}
      </motion.div>
    </>
  );
}

function SectionRows({ section, stocks, lang, sectionLabel, rowLabel }) {
  return (
    <>
      <tr>
        <td
          colSpan={stocks.length + 1}
          className="px-3 py-2 text-xs uppercase font-semibold tracking-wide text-surface-500
                     bg-surface-100/50 dark:bg-surface-900/30"
        >
          {sectionLabel}
        </td>
      </tr>
      {section.rows.map(row => {
        const bestIdx = getBestIndices(stocks, row.raw, row.higher);
        return (
          <tr key={row.key} className="border-b border-surface-200/30 dark:border-surface-800/30 last:border-b-0">
            <td className="px-3 py-2.5 text-sm text-surface-600 dark:text-surface-400 whitespace-nowrap">
              {rowLabel(row)}
            </td>
            {stocks.map((s, i) => {
              const val = row.get(s, lang);
              const isBest = bestIdx.includes(i);
              const colorFn = row.color;
              const customColor = colorFn ? colorFn(s) : '';

              return (
                <td key={s.id} className="px-3 py-2.5 text-center text-sm font-mono">
                  {val != null ? (
                    <span
                      className={
                        isBest
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-semibold rounded px-1.5 py-0.5'
                          : customColor || 'text-surface-700 dark:text-surface-200'
                      }
                    >
                      {val}
                    </span>
                  ) : (
                    <span className="text-surface-400">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
