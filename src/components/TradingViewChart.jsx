import { useEffect, useRef, memo } from 'react';
import { useTheme } from '../context/ThemeContext';

function TradingViewChart({ symbol = 'GPW:WIG20', height = 500 }) {
  const containerRef = useRef(null);
  const { dark } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
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

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, dark]);

  return (
    <div className="rounded-2xl overflow-hidden border border-surface-200/60 dark:border-surface-800/50">
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: `${height}px`, width: '100%' }}
      />
    </div>
  );
}

export default memo(TradingViewChart);
