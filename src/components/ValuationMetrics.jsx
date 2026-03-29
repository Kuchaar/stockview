import { useLang } from '../context/LangContext';
import { formatRatio } from '../data/wig20';

export default function ValuationMetrics({ ratios }) {
  const { t } = useLang();

  const metrics = [
    { label: t('stock.peRatio'), value: ratios.pe, format: 'x', benchmark: '< 15 ✓' },
    { label: t('stock.pbRatio'), value: ratios.pb, format: 'x', benchmark: '< 1.5 ✓' },
    { label: t('stock.evEbitda'), value: ratios.evEbitda, format: 'x', benchmark: '< 10 ✓' },
    { label: t('stock.eps'), value: ratios.eps, format: 'PLN' },
    { label: t('stock.bookValue'), value: ratios.bookValue, format: 'PLN' },
    { label: t('stock.dividendYield'), value: ratios.dividendYield, format: '%' },
    { label: t('stock.roe'), value: ratios.roe, format: '%', benchmark: '> 15% ✓' },
    { label: t('stock.roa'), value: ratios.roa, format: '%', benchmark: '> 5% ✓' },
    { label: t('stock.grossMargin'), value: ratios.grossMargin, format: '%' },
    { label: t('stock.operatingMargin'), value: ratios.operatingMargin, format: '%' },
    { label: t('stock.netMargin'), value: ratios.netMargin, format: '%' },
    { label: t('stock.currentRatio'), value: ratios.currentRatio, format: 'x', benchmark: '> 1.5 ✓' },
    { label: t('stock.quickRatio'), value: ratios.quickRatio, format: 'x' },
    { label: t('stock.debtToEquity'), value: ratios.debtToEquity, format: 'x', benchmark: '< 0.5 ✓' },
  ];

  const getColor = (m) => {
    if (m.value === null || m.value === undefined) return '';
    if (!m.benchmark) return '';
    if (m.label.includes('P/E') || m.label.includes('C/Z')) {
      return m.value < 15 ? 'text-up' : m.value > 30 ? 'text-down' : 'text-warn';
    }
    if (m.label.includes('P/B') || m.label.includes('C/WK')) {
      return m.value < 1.5 ? 'text-up' : m.value > 4 ? 'text-down' : 'text-warn';
    }
    if (m.label.includes('EV/EBITDA')) {
      return m.value < 10 ? 'text-up' : m.value > 20 ? 'text-down' : 'text-warn';
    }
    if (m.label.includes('ROE')) {
      return m.value > 15 ? 'text-up' : m.value > 8 ? 'text-warn' : 'text-down';
    }
    if (m.label.includes('ROA')) {
      return m.value > 5 ? 'text-up' : m.value > 2 ? 'text-warn' : 'text-down';
    }
    if (m.label.includes('Current') || m.label.includes('bieżącej')) {
      return m.value > 1.5 ? 'text-up' : m.value > 1.0 ? 'text-warn' : 'text-down';
    }
    if (m.label.includes('Debt') || m.label.includes('Zadłużenie')) {
      return m.value < 0.5 ? 'text-up' : m.value < 1.0 ? 'text-warn' : 'text-down';
    }
    return '';
  };

  const formatValue = (m) => {
    if (m.value === null || m.value === undefined) return '—';
    if (m.format === '%') return `${m.value.toFixed(1)}%`;
    if (m.format === 'PLN') return `${formatRatio(m.value)} PLN`;
    return formatRatio(m.value);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="p-4 rounded-xl bg-surface-50/80 dark:bg-surface-900/50
                   border border-surface-200/40 dark:border-surface-800/30"
        >
          <div className="metric-label mb-2">{m.label}</div>
          <div className={`font-mono font-semibold text-lg ${getColor(m)}`}>
            {formatValue(m)}
          </div>
          {m.benchmark && (
            <div className="text-[10px] text-surface-400 mt-1 font-mono">
              {m.benchmark}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
