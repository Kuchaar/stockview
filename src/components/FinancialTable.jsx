import { useState } from 'react';
import { useLang } from '../context/LangContext';
import { formatNumber } from '../data/wig20';

export default function FinancialTable({ financials }) {
  const { lang, t } = useLang();
  const [period, setPeriod] = useState('annual');

  const data = financials[period];
  const headers = period === 'annual' ? data.years : data.quarters;

  const rows = period === 'annual'
    ? [
        { key: 'revenue', label: t('stock.revenue') },
        { key: 'netIncome', label: t('stock.netIncome') },
        { key: 'ebitda', label: 'EBITDA' },
        { key: 'operatingIncome', label: t('stock.operatingIncome') },
        { key: 'totalAssets', label: t('stock.totalAssets') },
        { key: 'totalDebt', label: t('stock.totalDebt') },
        { key: 'equity', label: t('stock.equity') },
        { key: 'freeCashFlow', label: t('stock.freeCashFlow') },
      ]
    : [
        { key: 'revenue', label: t('stock.revenue') },
        { key: 'netIncome', label: t('stock.netIncome') },
      ];

  return (
    <div>
      {/* Period toggle */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setPeriod('annual')}
          className={`tab-button ${period === 'annual' ? 'active' : ''}`}
        >
          {t('stock.annual')}
        </button>
        <button
          onClick={() => setPeriod('quarterly')}
          className={`tab-button ${period === 'quarterly' ? 'active' : ''}`}
        >
          {t('stock.quarterly')}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              <th className="text-left py-3 pr-4 font-medium text-surface-500 text-xs uppercase tracking-wider">
                {lang === 'pl' ? 'mln PLN' : 'M PLN'}
              </th>
              {headers.map(h => (
                <th key={h} className="text-right py-3 px-3 font-mono font-medium text-surface-500 text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const values = data[row.key];
              if (!values) return null;
              const allNull = values.every(v => v === null);
              if (allNull) return null;

              return (
                <tr
                  key={row.key}
                  className={`border-b border-surface-100 dark:border-surface-900
                    ${i % 2 === 0 ? '' : 'bg-surface-50/50 dark:bg-surface-950/50'}`}
                >
                  <td className="py-3 pr-4 font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
                    {row.label}
                  </td>
                  {values.map((val, idx) => (
                    <td key={idx} className="text-right py-3 px-3 font-mono tabular-nums">
                      {val === null ? (
                        <span className="text-surface-400">—</span>
                      ) : (
                        <span className={val < 0 ? 'text-down' : ''}>
                          {formatNumber(val, lang)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
