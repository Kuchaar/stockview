import { useEffect, useRef, useState, memo } from 'react';
import { useTheme } from '../context/ThemeContext';

const VARIANTS = {
  compact: 'aspect-[16/7] min-h-[380px]', // HomePage — wider, shorter
  full: 'aspect-video min-h-[450px]',       // StockPage — standard 16:9
};

function TradingViewChart({ symbol = 'GPW:WIG20', variant = 'full' }) {
  const containerRef = useRef(null);
  const mountedRef  = useRef(false); // true once widget was injected
  const rebuildRef  = useRef(false); // true while rebuilding for theme change
  const { dark } = useTheme();

  // Track symbol so debounced theme handler can read it
  const symbolRef = useRef(symbol);
  useEffect(() => { symbolRef.current = symbol; }, [symbol]);

  // Skeleton shown until widget enters viewport for the first time
  const [visible, setVisible]  = useState(false);
  // Skeleton shown during theme-change rebuild
  const [rebuilding, setRebuilding] = useState(false);

  // ----- IntersectionObserver: lazy-load when container enters viewport -----
  useEffect(() => {
    if (!containerRef.current) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  // ----- Inject / re-inject the widget -----
  useEffect(() => {
    if (!visible || !containerRef.current) return;

    // On first injection mount immediately.
    // On theme change: show skeleton briefly so there's no blank flash.
    if (mountedRef.current) {
      // Theme changed after first mount → debounce rebuild
      setRebuilding(true);
      rebuildRef.current = true;
      const timer = setTimeout(() => {
        rebuildRef.current = false;
        inject();
        setRebuilding(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    inject();

    function inject() {
      if (!containerRef.current) return;
      mountedRef.current = true;
      containerRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: symbolRef.current,
        interval: 'D',
        timezone: 'Europe/Warsaw',
        theme: dark ? 'dark' : 'light',
        style: '1',
        locale: 'pl',
        backgroundColor: dark ? 'rgba(11, 14, 23, 0)' : 'rgba(255, 255, 255, 0)',
        gridColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        hide_volume: false,
        support_host: 'https://www.tradingview.com',
        studies: [],
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'tradingview-widget-container__widget';
      wrapper.style.height = '100%';
      wrapper.style.width = '100%';

      containerRef.current.appendChild(wrapper);
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      mountedRef.current = false;
    };
    // Re-run when theme flips (debounced above) or symbol changes
  }, [visible, dark, symbol]);

  const sizeClass = VARIANTS[variant] || VARIANTS.full;

  return (
    <div className="rounded-2xl overflow-hidden border border-surface-200/60 dark:border-surface-800/50">
      <div className={`tradingview-widget-container relative ${sizeClass}`} ref={containerRef}>
        {/* Skeleton: shown before IntersectionObserver fires OR during theme rebuild */}
        {(!visible || rebuilding) && (
          <div className="w-full h-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center absolute inset-0">
            <span className="text-slate-400 text-sm">Ładowanie wykresu…</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TradingViewChart);
