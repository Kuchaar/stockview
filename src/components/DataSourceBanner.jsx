import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function DataSourceBanner({ error, source, lastUpdated }) {
  const { lang } = useLang();
  const [visible, setVisible] = useState(true);

  // Auto-hide "live" success banner after 5s
  useEffect(() => {
    if (source === 'live' && !error) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
    setVisible(true);
  }, [source, error]);

  if (!visible) return null;

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          {lang === 'pl'
            ? 'Nie uda\u0142o si\u0119 pobra\u0107 aktualnych kurs\u00f3w. Wy\u015bwietlane dane mog\u0105 by\u0107 nieaktualne.'
            : 'Could not fetch latest prices. Displayed data may be outdated.'}
        </span>
      </div>
    );
  }

  // Static fallback
  if (source === 'static') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-900 border border-surface-200/60 dark:border-surface-800/50 text-xs text-surface-600 dark:text-surface-400">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          {lang === 'pl'
            ? `Dane z sesji: ${lastUpdated || '\u2014'}`
            : `Session data: ${lastUpdated || '\u2014'}`}
        </span>
      </div>
    );
  }

  // Live data
  if (source === 'live') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-700 dark:text-green-400">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{lang === 'pl' ? 'Kursy aktualne' : 'Prices up to date'}</span>
      </div>
    );
  }

  return null;
}
