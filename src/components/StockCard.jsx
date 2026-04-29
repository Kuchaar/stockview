import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { sectors } from '../data/wig20';
import { formatPrice, formatPercent } from '../data/wig20';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import WatchButton from './WatchButton';

function AnimatedPrice({ value }) {
  const safeValue = value ?? 0;
  const spring = useSpring(safeValue, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, v => formatPrice(v));
  const [text, setText] = useState(formatPrice(safeValue));
  const prevValue = useRef(safeValue);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    spring.set(safeValue);
  }, [safeValue, spring]);

  useEffect(() => {
    return display.on('change', v => setText(v));
  }, [display]);

  useEffect(() => {
    if (prevValue.current !== safeValue) {
      setFlash(safeValue > prevValue.current ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 400);
      prevValue.current = safeValue;
      return () => clearTimeout(timer);
    }
  }, [safeValue]);

  return (
    <span className={`transition-colors duration-400 ${
      flash === 'up' ? 'text-up' : flash === 'down' ? 'text-down' : ''
    }`}>
      {text}
    </span>
  );
}

export default function StockCard({ stock, variants }) {
  const { lang, t } = useLang();
  const isUp = stock.changePercent >= 0;
  const sectorName = sectors[lang]?.[stock.sector] || stock.sector;

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={`/stock/${stock.id}`} className="block card-hover group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-surface-100 dark:bg-surface-900
                          flex items-center justify-center text-xl
                          group-hover:scale-110 transition-transform duration-300"
                 aria-hidden="true">
              {stock.logo}
            </div>
            <div>
              <h3 className="font-display font-bold text-base leading-tight">
                {stock.shortName}
              </h3>
              <span className="text-xs text-surface-600 dark:text-surface-400 font-mono">{stock.ticker}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <WatchButton companyId={stock.id} size="sm" />
            <span className={`badge ${isUp ? 'badge-up' : 'badge-down'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercent(stock.changePercent)}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono font-semibold text-lg">
              <AnimatedPrice value={stock.price} /> <span className="text-xs text-surface-600 dark:text-surface-400">PLN</span>
            </div>
            <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">{sectorName}</div>
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
          <span className="text-surface-500 dark:text-surface-400">
            {t('home.marketCap')}: {((stock.marketCap ?? 0) / 1000).toFixed(1)} mld PLN
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-surface-400
                               group-hover:text-brand-500 group-hover:translate-x-0.5
                               transition-all duration-200" />
        </div>
      </Link>
    </motion.div>
  );
}
