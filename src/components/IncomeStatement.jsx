import { useState } from 'react';
import { useLang } from '../context/LangContext';

const LABELS = {
  pl: {
    totalRevenue: 'Przychody',
    costOfRevenue: 'Koszt sprzedaży',
    grossProfit: 'Zysk brutto',
    sellingGeneralAdministrative: 'Koszty SG&A',
    researchDevelopment: 'Badania i rozwój (R&D)',
    totalOperatingExpenses: 'Koszty operacyjne ogółem',
    operatingIncome: 'Zysk operacyjny (EBIT)',
    interestExpense: 'Koszty odsetkowe',
    incomeBeforeTax: 'Zysk przed opodatkowaniem',
    incomeTaxExpense: 'Podatek dochodowy',
    netIncome: 'Zysk netto',
    ebitda: 'EBITDA',
  },
  en: {
    totalRevenue: 'Revenue',
    costOfRevenue: 'Cost of Revenue',
    grossProfit: 'Gross Profit',
    sellingGeneralAdministrative: 'SG&A Expenses',
    researchDevelopment: 'R&D Expenses',
    totalOperatingExpenses: 'Total Operating Expenses',
    operatingIncome: 'Operating Income (EBIT)',
    interestExpense: 'Interest Expense',
    incomeBeforeTax: 'Income Before Tax',
    incomeTaxExpense: 'Income Tax',
    netIncome: 'Net Income',
    ebitda: 'EBITDA',
  },
};

const ROW_CONFIG = [
  { key: 'totalRevenue', bold: true },
  { key: 'costOfRevenue', indent: true },
  { key: 'grossProfit', bold: true, separator: true },
  { key: 'sellingGeneralAdministrative', indent: true },
  { key: 'researchDevelopment', indent: true },
  { key: 'totalOperatingExpenses' },
  { key: 'operatingIncome', bold: true, separator: true },
  { key: 'interestExpense', indent: true },
  { key: 'incomeBeforeTax' },
  { key: 'incomeTaxExpense', indent: true },
  { key: 'netIncome', bold: true, separator: true },
  { key: 'ebitda', bold: true },
];

export default function IncomeStatement({ liveData, fallbackFinancials }) {
  const { lang } = useLang();
  const [period, setPeriod] = useState('annual');
  const labels = LABELS[lang] || LABELS.en;

  const statements = liveData?.[period === 'annual' ? 'annual' : 'quarterly'];

  if (!statements || statements.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <p className="text-sm">
          {lang === 'pl'
            ? 'Dane rachunku zysków i strat niedostępne. Spróbuj ponownie później.'
            : 'Income statement data unavailable. Try again later.'}
        </p>
      </div>
    );
  }

  // Sort by date descending (newest first) and take up to 4
  const sorted = [...statements].sort((a, b) => (b.dateRaw || 0) - (a.dateRaw || 0)).slice(0, 4);
  const headers = sorted.map(s => s.date || '—');

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setPeriod('annual')}
          className={`tab-button ${period === 'annual' ? 'active' : ''}`}
        >
          {lang === 'pl' ? 'Roczne' : 'Annual'}
        </button>
        <button
          onClick={() => setPeriod('quarterly')}
          className={`tab-button ${period === 'quarterly' ? 'active' : ''}`}
        >
          {lang === 'pl' ? 'Kwartalne' : 'Quarterly'}
        </button>
      </div>

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
            {ROW_CONFIG.map((row, i) => {
              const values = sorted.map(s => s[row.key]);
              if (values.every(v => v == null)) return null;

              return (
                <tr
                  key={row.key}
                  className={`border-b border-surface-100 dark:border-surface-900
                    ${row.separator ? 'border-b-2 border-surface-200 dark:border-surface-800' : ''}
                    ${i % 2 === 0 ? '' : 'bg-surface-50/50 dark:bg-surface-950/50'}`}
                >
                  <td className={`py-3 pr-4 whitespace-nowrap text-surface-700 dark:text-surface-300
                    ${row.bold ? 'font-semibold' : 'font-medium'}
                    ${row.indent ? 'pl-4' : ''}`}>
                    {labels[row.key] || row.key}
                  </td>
                  {values.map((val, idx) => (
                    <td key={idx} className={`text-right py-3 px-3 font-mono tabular-nums
                      ${row.bold ? 'font-semibold' : ''}`}>
                      {val == null ? (
                        <span className="text-surface-400">—</span>
                      ) : (
                        <span className={val < 0 ? 'text-down' : ''}>
                          {formatMillions(val, lang)}
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

function formatMillions(n, lang) {
  if (n == null) return '—';
  const millions = n / 1_000_000;
  if (Math.abs(millions) >= 1000) {
    return lang === 'pl'
      ? `${(millions / 1000).toFixed(1).replace('.', ',')} mld`
      : `${(millions / 1000).toFixed(1)}B`;
  }
  const formatted = Math.round(millions).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US');
  return formatted;
}
