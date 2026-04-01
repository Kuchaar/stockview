import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getUpcomingDividends, getRecentDividends } from '../data/dividends';
import { CalendarDays, Banknote, Info, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'upcoming', key: 'upcoming' },
  { id: 'paid', key: 'paid' },
];

function formatDatePL(dateStr) {
  const months = [
    'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
    'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
  ];
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function formatDateEN(dateStr) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const [y, m, d] = dateStr.split('-');
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

export default function DividendsPage() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState('upcoming');

  const upcoming = useMemo(() => getUpcomingDividends(), []);
  const paid = useMemo(() => getRecentDividends(), []);

  const items = tab === 'upcoming' ? upcoming : paid;
  const formatDate = lang === 'pl' ? formatDatePL : formatDateEN;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-4"
      >
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mb-2">
          {t('dividends.title')}
        </h1>
        <p className="text-surface-500 text-lg">
          {t('dividends.subtitle')}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-surface-200 dark:border-surface-800 -mx-1 px-1">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
              tab === tabItem.id
                ? 'text-green-600 dark:text-green-400 border-green-500 dark:border-green-400'
                : 'text-surface-500 border-transparent hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            {t(`dividends.${tabItem.key}`)}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-start gap-2 px-4 py-3 rounded-xl bg-surface-100/60 dark:bg-surface-900/60
                 border border-surface-200/50 dark:border-surface-800/50 text-xs text-surface-500"
      >
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{t('dividends.disclaimer')}</span>
      </motion.div>

      {/* Cards grid */}
      {items.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((div, i) => (
            <DividendCard
              key={div.id}
              dividend={div}
              index={i}
              lang={lang}
              t={t}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-surface-500"
        >
          <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>{t('dividends.empty')}</p>
        </motion.div>
      )}
    </div>
  );
}

function DividendCard({ dividend, index, lang, t, formatDate }) {
  const statusStyles = {
    confirmed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    estimated: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    paid: 'bg-surface-200/60 dark:bg-surface-800/60 text-surface-500 border-surface-300/30 dark:border-surface-700/30',
  };

  const statusLabels = {
    confirmed: t('dividends.confirmed'),
    estimated: t('dividends.estimated'),
    paid: t('dividends.paid'),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/stock/${dividend.companyId}`}
        className="card-hover block !p-5 space-y-4"
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-900
                          flex items-center justify-center text-xl">
              {dividend.logo}
            </span>
            <div>
              <div className="font-display font-bold text-sm">{dividend.shortName}</div>
              <div className="text-xs text-surface-500 font-mono">{dividend.ticker}</div>
            </div>
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border ${statusStyles[dividend.status]}`}>
            {statusLabels[dividend.status]}
          </span>
        </div>

        {/* Dividend amount */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-mono font-bold text-2xl">
              {dividend.dividendPerShare.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-surface-400 ml-1.5">{t('dividends.perShare')}</span>
          </div>
          <span className={`font-mono font-semibold text-sm ${dividend.dividendYield >= 3 ? 'text-up' : 'text-surface-500'}`}>
            {dividend.dividendYield.toFixed(1)}%
          </span>
        </div>

        {/* Dates */}
        <div className="space-y-1.5 text-sm text-surface-500">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t('dividends.exDate')}:</span>
            <span className="font-medium text-surface-600 dark:text-surface-300 ml-auto">
              {formatDate(dividend.exDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t('dividends.paymentDate')}:</span>
            <span className="font-medium text-surface-600 dark:text-surface-300 ml-auto">
              {formatDate(dividend.paymentDate)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
