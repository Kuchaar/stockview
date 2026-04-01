import { useState } from 'react';
import { useLang } from '../context/LangContext';

const LABELS = {
  pl: {
    // Assets
    cash: 'Gotówka i ekwiwalenty',
    shortTermInvestments: 'Inwestycje krótkoterminowe',
    netReceivables: 'Należności netto',
    inventory: 'Zapasy',
    otherCurrentAssets: 'Pozostałe aktywa obrotowe',
    totalCurrentAssets: 'Aktywa obrotowe ogółem',
    propertyPlantEquipment: 'Rzeczowe aktywa trwałe',
    goodWill: 'Wartość firmy',
    intangibleAssets: 'Wartości niematerialne',
    longTermInvestments: 'Inwestycje długoterminowe',
    otherAssets: 'Pozostałe aktywa',
    totalAssets: 'AKTYWA OGÓŁEM',
    // Liabilities
    accountsPayable: 'Zobowiązania handlowe',
    shortLongTermDebt: 'Zadłużenie krótkoterminowe',
    otherCurrentLiab: 'Pozostałe zob. bieżące',
    totalCurrentLiabilities: 'Zobowiązania bieżące ogółem',
    longTermDebt: 'Zadłużenie długoterminowe',
    otherLiab: 'Pozostałe zobowiązania',
    totalLiab: 'ZOBOWIĄZANIA OGÓŁEM',
    // Equity
    commonStock: 'Kapitał zakładowy',
    retainedEarnings: 'Zyski zatrzymane',
    totalStockholderEquity: 'KAPITAŁ WŁASNY',
  },
  en: {
    cash: 'Cash & Equivalents',
    shortTermInvestments: 'Short-term Investments',
    netReceivables: 'Net Receivables',
    inventory: 'Inventory',
    otherCurrentAssets: 'Other Current Assets',
    totalCurrentAssets: 'Total Current Assets',
    propertyPlantEquipment: 'Property, Plant & Equipment',
    goodWill: 'Goodwill',
    intangibleAssets: 'Intangible Assets',
    longTermInvestments: 'Long-term Investments',
    otherAssets: 'Other Assets',
    totalAssets: 'TOTAL ASSETS',
    accountsPayable: 'Accounts Payable',
    shortLongTermDebt: 'Short-term Debt',
    otherCurrentLiab: 'Other Current Liabilities',
    totalCurrentLiabilities: 'Total Current Liabilities',
    longTermDebt: 'Long-term Debt',
    otherLiab: 'Other Liabilities',
    totalLiab: 'TOTAL LIABILITIES',
    commonStock: 'Common Stock',
    retainedEarnings: 'Retained Earnings',
    totalStockholderEquity: 'TOTAL EQUITY',
  },
};

const SECTIONS = [
  { title: { pl: 'Aktywa', en: 'Assets' }, rows: [
    { key: 'cash', indent: true },
    { key: 'shortTermInvestments', indent: true },
    { key: 'netReceivables', indent: true },
    { key: 'inventory', indent: true },
    { key: 'otherCurrentAssets', indent: true },
    { key: 'totalCurrentAssets', bold: true },
    { key: 'propertyPlantEquipment', indent: true },
    { key: 'goodWill', indent: true },
    { key: 'intangibleAssets', indent: true },
    { key: 'longTermInvestments', indent: true },
    { key: 'otherAssets', indent: true },
    { key: 'totalAssets', bold: true, separator: true },
  ]},
  { title: { pl: 'Zobowiązania', en: 'Liabilities' }, rows: [
    { key: 'accountsPayable', indent: true },
    { key: 'shortLongTermDebt', indent: true },
    { key: 'otherCurrentLiab', indent: true },
    { key: 'totalCurrentLiabilities', bold: true },
    { key: 'longTermDebt', indent: true },
    { key: 'otherLiab', indent: true },
    { key: 'totalLiab', bold: true, separator: true },
  ]},
  { title: { pl: 'Kapitał własny', en: 'Equity' }, rows: [
    { key: 'commonStock', indent: true },
    { key: 'retainedEarnings', indent: true },
    { key: 'totalStockholderEquity', bold: true },
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
            <td className={`py-2.5 pr-4 whitespace-nowrap text-surface-700 dark:text-surface-300
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
