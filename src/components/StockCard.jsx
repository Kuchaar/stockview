import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { sectors } from '../data/wig20';
import { formatPrice, formatPercent } from '../data/wig20';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StockCard({ stock, index = 0 }) {
  const { lang, t } = useLang();
  const isUp = stock.changePercent >= 0;
  const sectorName = sectors[lang]?.[stock.sector] || stock.sector;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
    >
      <Link to={`/stock/${stock.id}`} className="block card-hover group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-surface-100 dark:bg-surface-900
                          flex items-center justify-center text-xl
                          group-hover:scale-110 transition-transform duration-300">
              {stock.logo}
            </div>
            <div>
              <h3 className="font-display font-bold text-base leading-tight">
                {stock.shortName}
              </h3>
              <span className="text-xs text-surface-500 font-mono">{stock.ticker}</span>
            </div>
          </div>
          <span className={`badge ${isUp ? 'badge-up' : 'badge-down'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(stock.changePercent)}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono font-semibold text-lg">
              {formatPrice(stock.price)} <span className="text-xs text-surface-500">PLN</span>
            </div>
            <div className="text-xs text-surface-400 mt-1">{sectorName}</div>
          </div>
          <div className="text-right">
            <div className="metric-label">{t('home.pe')}</div>
            <div className="font-mono text-sm font-medium">
              {stock.ratios.pe !== null ? stock.ratios.pe.toFixed(1) : '—'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-surface-200/50 dark:border-surface-800/50
                      flex items-center justify-between text-xs">
          <span className="text-surface-400">
            {t('home.marketCap')}: {(stock.marketCap / 1000).toFixed(1)} mld PLN
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-surface-400
                               group-hover:text-brand-500 group-hover:translate-x-0.5
                               transition-all duration-200" />
        </div>
      </Link>
    </motion.div>
  );
}
