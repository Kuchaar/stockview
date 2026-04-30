import { useState } from 'react';
import { getRatioMeta } from '../data/ratioCalculator';
import { HelpCircle } from 'lucide-react';

const CATEGORIES = [
  { key: 'profitability', fields: ['roe', 'roa', 'roic', 'grossMargin', 'operatingMargin', 'netMargin', 'ebitdaMargin'] },
  { key: 'valuation', fields: ['pe', 'forwardPe', 'pb', 'ps', 'evEbitda', 'peg', 'fcfYield'] },
  { key: 'debtAndLiquidity', fields: ['debtToEquity', 'netDebtToEbitda', 'currentRatio', 'quickRatio', 'interestCoverage', 'noc'] },
  { key: 'dividend', fields: ['dividendYield', 'payoutRatio'] },
  { key: 'growth', fields: ['revenueGrowthYoY', 'netIncomeGrowthYoY', 'epsGrowthYoY'] },
];

const TAB_LABELS = {
  profitability: { pl: 'Rentowność', en: 'Profitability' },
  valuation: { pl: 'Wycena', en: 'Valuation' },
  debtAndLiquidity: { pl: 'Zadłużenie', en: 'Debt' },
  dividend: { pl: 'Dywidenda', en: 'Dividend' },
  growth: { pl: 'Wzrost', en: 'Growth' },
};

function formatValue(value, format) {
  if (value == null) return '—';
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'multiple':
      return `${value.toFixed(1)}x`;
    case 'ratio':
      return value.toFixed(2);
    case 'currency':
      if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)} mld`;
      if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(0)} mln`;
      return value.toLocaleString('pl-PL');
    default:
      return String(value);
  }
}

function getValueColor(value, meta) {
  if (value == null || !meta) return '';
  if (meta.higherIsBetter === null) return 'text-blue-500 dark:text-blue-400';
  if (meta.higherIsBetter) {
    return value > 0 ? 'text-up' : 'text-down';
  }
  // Lower is better (debt ratios)
  if (meta.format === 'ratio') {
    return value < 1 ? 'text-up' : value > 2 ? 'text-down' : 'text-warn';
  }
  return '';
}

function MetricCard({ ratioKey, value, lang }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const meta = getRatioMeta(ratioKey);
  if (!meta) return null;

  const label = lang === 'pl' ? meta.label_pl : meta.label_en;
  const tooltip = lang === 'pl' ? meta.tooltip_pl : meta.tooltip_en;
  const colorClass = getValueColor(value, meta);

  return (
    <div className="p-4 rounded-xl bg-surface-50/80 dark:bg-surface-900/50
                     border border-surface-200/40 dark:border-surface-800/30">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="metric-label">{label}</span>
        <div className="relative">
          <button
            type="button"
            className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300
                       transition-colors focus:outline-none"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label={tooltip}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
                            bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900
                            text-xs rounded-lg whitespace-nowrap z-50 pointer-events-none
                            shadow-lg">
              {tooltip}
            </div>
          )}
        </div>
      </div>
      <div className={`font-mono font-semibold text-lg ${colorClass}`}>
        {formatValue(value, meta.format)}
      </div>
    </div>
  );
}

export default function MetricsPanel({ ratios, lang }) {
  const [activeTab, setActiveTab] = useState('profitability');

  if (!ratios) {
    return (
      <div className="text-center py-8 text-surface-400">
        {lang === 'pl' ? 'Ładowanie wskaźników...' : 'Loading metrics...'}
      </div>
    );
  }

  const activeCategory = CATEGORIES.find(c => c.key === activeTab);
  const activeRatios = ratios[activeTab] || {};

  // Filter out null-valued entries that are structurally null (bank-specific fields)
  const visibleFields = activeCategory.fields.filter(f => {
    // Always show the field — even if value is null, to indicate data unavailable
    // But hide fields that are always null for this company type (bank vs non-bank)
    const meta = getRatioMeta(f);
    return meta != null;
  });

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-xl
                       bg-surface-100/80 dark:bg-surface-900/50" role="tablist">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            role="tab"
            aria-selected={activeTab === cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${activeTab === cat.key
                ? 'bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
          >
            {TAB_LABELS[cat.key]?.[lang] || cat.key}
          </button>
        ))}
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" role="tabpanel">
        {visibleFields.map(field => (
          <MetricCard
            key={field}
            ratioKey={field}
            value={activeRatios[field]}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
