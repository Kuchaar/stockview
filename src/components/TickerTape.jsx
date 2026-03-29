import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function TickerTape() {
  const containerRef = useRef(null);
  const { dark } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'GPW:WIG20', title: 'WIG20' },
        { proName: 'GPW:PKO', title: 'PKO BP' },
        { proName: 'GPW:PKN', title: 'Orlen' },
        { proName: 'GPW:KGH', title: 'KGHM' },
        { proName: 'GPW:PZU', title: 'PZU' },
        { proName: 'GPW:PEO', title: 'Pekao' },
        { proName: 'GPW:CDR', title: 'CD Projekt' },
        { proName: 'GPW:ALE', title: 'Allegro' },
        { proName: 'GPW:DNP', title: 'Dino' },
        { proName: 'GPW:LPP', title: 'LPP' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: dark ? 'dark' : 'light',
      locale: 'pl',
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [dark]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden" />
  );
}
