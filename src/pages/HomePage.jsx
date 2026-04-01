import { useState, useMemo } from 'react';
import { useLang } from '../context/LangContext';
import { formatPercent } from '../data/wig20';
import useStockData from '../hooks/useStockData';
import StockCard from '../components/StockCard';
import TradingViewChart from '../components/TradingViewChart';
import TickerTape from '../components/TickerTape';
import { Search, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { t, lang } = useLang();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');

  const { companies, loading, lastUpdated } = useStockData();

  const sorted = useMemo(() =>
    [...companies].sort((a, b) => b.changePercent - a.changePercent),
    [companies]
  );

  const topGainers = sorted.filter(s => s.changePercent > 0).slice(0, 3);
  const topLosers = [...sorted].reverse().filter(s => s.changePercent < 0).slice(0, 3);

  const filteredStocks = useMemo(() => {
    let list = companies;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q)
      );
    }
    if (sectorFilter !== 'all') {
      list = list.filter(s => s.sector === sectorFilter);
    }
    return list;
  }, [companies, search, sectorFilter]);

  const uniqueSectors = [...new Set(companies.map(s => s.sector))];

  const sectorLabels = {
    pl: { all: 'Wszystkie', banking: 'Banki', energy: 'Energetyka', mining: 'Górnictwo',
          insurance: 'Ubezpieczenia', gaming: 'Gry', ecommerce: 'E-commerce',
          retail: 'Handel', telecom: 'Telekom', it: 'IT', industrial: 'Przemysł', finance: 'Finanse' },
    en: { all: 'All', banking: 'Banks', energy: 'Energy', mining: 'Mining',
          insurance: 'Insurance', gaming: 'Gaming', ecommerce: 'E-commerce',
          retail: 'Retail', telecom: 'Telecom', it: 'IT', industrial: 'Industrial', finance: 'Finance' },
  };

  // Index stats
  const avgChange = (companies.reduce((s, c) => s + c.changePercent, 0) / companies.length);
  const totalMarketCap = companies.reduce((s, c) => s + c.marketCap, 0);
  const advancers = companies.filter(s => s.changePercent > 0).length;
  const decliners = companies.filter(s => s.changePercent < 0).length;

  const lastUpdateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-10">
      {/* Ticker tape */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <TickerTape />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-6"
      >
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-3">
          {t('home.hero').split(' ')[0]}{' '}
          <span className="text-gradient">{t('home.hero').split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-surface-500 text-lg max-w-xl mx-auto">
          {t('home.heroSub')}
        </p>
      </motion.div>

      {/* Index stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox
            icon={<Activity className="w-4 h-4" />}
            label={lang === 'pl' ? 'Sr. zmiana' : 'Avg. Change'}
            value={formatPercent(avgChange)}
            valueColor={avgChange >= 0 ? 'text-up' : 'text-down'}
          />
          <StatBox
            icon={<BarChart3 className="w-4 h-4" />}
            label={t('home.marketCap')}
            value={`${(totalMarketCap / 1000).toFixed(0)} mld PLN`}
          />
          <StatBox
            icon={<TrendingUp className="w-4 h-4" />}
            label={lang === 'pl' ? 'Wzrosty' : 'Advancers'}
            value={advancers}
            valueColor="text-up"
          />
          <StatBox
            icon={<TrendingDown className="w-4 h-4" />}
            label={lang === 'pl' ? 'Spadki' : 'Decliners'}
            value={decliners}
            valueColor="text-down"
          />
        </div>

        {/* Data date indicator */}
        {lastUpdated && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-surface-400">
            <span>
              {lang === 'pl' ? 'Kursy zamknięcia z sesji:' : 'Closing prices from session:'} {lastUpdated}
            </span>
          </div>
        )}
      </motion.div>

      {/* WIG20 Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <h2 className="section-title mb-4">{t('home.indexOverview')}</h2>
        <TradingViewChart symbol="GPW:WIG20" variant="compact" />
      </motion.div>

      {/* Gainers / Losers */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="section-title mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-up" />
            {t('home.topGainers')}
          </h2>
          <div className="space-y-3">
            {topGainers.map((s, i) => (
              <MoverRow key={s.id} stock={s} rank={i + 1} type="up" />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className="section-title mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-down" />
            {t('home.topLosers')}
          </h2>
          <div className="space-y-3">
            {topLosers.map((s, i) => (
              <MoverRow key={s.id} stock={s} rank={i + 1} type="down" />
            ))}
          </div>
        </motion.div>
      </div>

      {/* All stocks */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="section-title">{t('home.allStocks')}</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('home.search')}
                className="pl-9 pr-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-900
                         border border-surface-200/60 dark:border-surface-800/50
                         text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-500/30
                         placeholder:text-surface-400 w-full sm:w-56
                         transition-all duration-200"
              />
            </div>

            {/* Sector filter */}
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-900
                       border border-surface-200/60 dark:border-surface-800/50
                       text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-500/30
                       appearance-none cursor-pointer transition-all duration-200"
            >
              {['all', ...uniqueSectors].map(s => (
                <option key={s} value={s}>
                  {sectorLabels[lang]?.[s] || s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.map((stock, i) => (
            <StockCard key={stock.id} stock={stock} index={i} />
          ))}
        </div>

        {filteredStocks.length === 0 && (
          <div className="text-center py-16 text-surface-500">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>{lang === 'pl' ? 'Nie znaleziono spolek' : 'No stocks found'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, valueColor = '' }) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center gap-2 text-surface-400">
        {icon}
        <span className="metric-label">{label}</span>
      </div>
      <span className={`font-mono font-bold text-xl ${valueColor}`}>{value}</span>
    </div>
  );
}

function MoverRow({ stock, rank, type }) {
  return (
    <a
      href={`/stock/${stock.id}`}
      className="card-hover flex items-center gap-4 !p-4"
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
        ${type === 'up' ? 'bg-up/10 text-up' : 'bg-down/10 text-down'}`}>
        {rank}
      </span>
      <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-900
                    flex items-center justify-center text-lg">
        {stock.logo}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-sm truncate">{stock.shortName}</div>
        <div className="text-xs text-surface-500 font-mono">{stock.ticker}</div>
      </div>
      <div className="text-right">
        <div className="font-mono font-medium text-sm">
          {stock.price.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
        </div>
        <span className={`text-xs font-mono font-medium ${type === 'up' ? 'text-up' : 'text-down'}`}>
          {formatPercent(stock.changePercent)}
        </span>
      </div>
    </a>
  );
}
