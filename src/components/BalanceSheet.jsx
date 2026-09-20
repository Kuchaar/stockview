import { useState } from 'react';
import { useLang } from '../context/LangContext';

// Klucze kanoniczne z src/data/financialSchema.js — nie surowe nazwy z Yahoo.
const LABELS = {
  pl: {
    cash: 'Środki pieniężne',
    currentAssets: 'Aktywa obrotowe',
    loans: 'Kredyty i pożyczki udzielone',
    totalAssets: 'AKTYWA OGÓŁEM',
    currentLiabilities: 'Zobowiązania krótkoterminowe',
    deposits: 'Depozyty klientów',
    longTermDebt: 'Dług długoterminowy',
    totalDebt: 'Dług ogółem',
    totalLiabilities: 'ZOBOWIĄZANIA OGÓŁEM',
    totalEquity: 'KAPITAŁ WŁASNY',
  },
  en: {
    cash: 'Cash & Equivalents',
    currentAssets: 'Current Assets',
    loans: 'Loans',
    totalAssets: 'TOTAL ASSETS',
    currentLiabilities: 'Current Liabilities',
    deposits: 'Customer Deposits',
    longTermDebt: 'Long-term Debt',
    totalDebt: 'Total Debt',
    totalLiabilities: 'TOTAL LIABILITIES',
    totalEquity: 'TOTAL EQUITY',
  },
};

const SECTIONS = [
  { title: { pl: 'Aktywa', en: 'Assets' }, rows: [
    { key: 'cash', indent: true },
    { key: 'currentAssets', indent: true },
    { key: 'loans', indent: true },
    { key: 'totalAssets', bold: true, separator: true },
  ]},
  { title: { pl: 'Zobowiązania', en: 'Liabilities' }, rows: [
    { key: 'currentLiabilities', indent: true },
    { key: 'deposits', indent: true },
    { key: 'longTermDebt', indent: true },
    { key: 'totalDebt', indent: true },
    { key: 'totalLiabilities', bold: true, separator: true },
  ]},
  { title: { pl: 'Kapitał własny', en: 'Equity' }, rows: [
    { key: 'totalEquity', bold: true },
  ]},
];

export default function BalanceSheet({ liveData, fallbackFinancials }) {
  const { lang } = useLang();
  const [period, setPeriod] = useState('annual');
  const labels = LABELS[lang] || LABELS.en;

  const statements = liveData?.[period === 'annual' ? 'annual' : 'quarterly'];

  if (!statements || statements.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <p className="text-sm">
          {lang === 'pl'
            ? 'Dane bilansowe niedostępne. Spróbuj ponownie później.'
            : 'Balance sheet data unavailable. Try again later.'}
        </p>
      </div>
    );
  }

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
            {SECTIONS.map((section, si) => (
              <SectionRows
                key={si}
                section={section}
                sorted={sorted}
                labels={labels}
                lang={lang}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionRows({ section, sorted, labels, lang }) {
  return (
    <>
      {/* Section header */}
      <tr>
        <td
          colSpan={sorted.length + 1}
          className="pt-5 pb-2 text-xs font-bold uppercase tracking-wider text-surface-500"
        >
          {section.title[lang] || section.title.en}
        </td>
      </tr>
      {section.rows.map((row, i) => {
        const values = sorted.map(s => s[row.key]);
        if (values.every(v => v == null)) return null;

        return (
          <tr
            key={row.key}
            className={`border-b border-surface-100 dark:border-surface-900
              ${row.separator ? 'border-b-2 border-surface-200 dark:border-surface-800' : ''}
              ${i % 2 === 0 ? '' : 'bg-surface-50/50 dark:bg-surface-950/50'}`}
          >
            <td className={`sticky left-0 z-10 bg-white dark:bg-surface-950 py-2.5 pr-4 whitespace-nowrap text-surface-700 dark:text-surface-300
              ${row.bold ? 'font-semibold' : 'font-medium'}
              ${row.indent ? 'pl-4' : ''}`}>
              {labels[row.key] || row.key}
            </td>
            {values.map((val, idx) => (
              <td key={idx} className={`text-right py-2.5 px-3 font-mono tabular-nums
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
    </>
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
