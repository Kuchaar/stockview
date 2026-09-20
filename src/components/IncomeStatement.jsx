import { useState } from 'react';
import { useLang } from '../context/LangContext';

// Klucze kanoniczne z src/data/financialSchema.js — nie surowe nazwy z Yahoo.
const LABELS = {
  pl: {
    revenue: 'Przychody',
    costOfRevenue: 'Koszt własny sprzedaży',
    grossProfit: 'Zysk brutto ze sprzedaży',
    operatingExpenses: 'Koszty operacyjne',
    operatingIncome: 'Zysk operacyjny (EBIT)',
    interestExpense: 'Koszty odsetkowe',
    netInterestIncome: 'Wynik odsetkowy',
    netFeeIncome: 'Wynik prowizyjny',
    provisionForCreditLosses: 'Odpisy na ryzyko kredytowe',
    netIncome: 'Zysk netto',
    ebitda: 'EBITDA',
  },
  en: {
    revenue: 'Revenue',
    costOfRevenue: 'Cost of Revenue',
    grossProfit: 'Gross Profit',
    operatingExpenses: 'Operating Expenses',
    operatingIncome: 'Operating Income (EBIT)',
    interestExpense: 'Interest Expense',
    netInterestIncome: 'Net Interest Income',
    netFeeIncome: 'Net Fee Income',
    provisionForCreditLosses: 'Provision for Credit Losses',
    netIncome: 'Net Income',
    ebitda: 'EBITDA',
  },
};

// Wiersze bez danych znikają same (patrz `values.every(v => v == null)` niżej),
// więc pozycje bankowe mogą tu stać obok zwykłych.
const ROW_CONFIG = [
  { key: 'revenue', bold: true },
  { key: 'costOfRevenue', indent: true },
  { key: 'grossProfit', bold: true, separator: true },
  { key: 'netInterestIncome', indent: true },
  { key: 'netFeeIncome', indent: true },
  { key: 'provisionForCreditLosses', indent: true },
  { key: 'operatingExpenses', indent: true },
  { key: 'operatingIncome', bold: true, separator: true },
  { key: 'interestExpense', indent: true },
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
  // kanoniczny wiersz ma `date` jako 'YYYY-MM-DD' — sortowanie leksykalne działa
  const sorted = [...statements].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4);
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

      <p className="md:hidden text-xs text-surface-400 mb-2 italic">
        {lang === 'pl' ? '← Przesuń tabelę, aby zobaczyć więcej' : '← Scroll table to see more'}
      </p>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              <th className="sticky left-0 z-10 bg-white dark:bg-surface-950 text-left py-3 pr-4 font-medium text-surface-500 text-xs uppercase tracking-wider">
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
                  <td className={`sticky left-0 z-10 bg-white dark:bg-surface-950 py-3 pr-4 whitespace-nowrap text-surface-700 dark:text-surface-300
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
