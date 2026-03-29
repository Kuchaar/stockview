import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../data/translations';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sv-lang') || 'pl';
    }
    return 'pl';
  });

  const toggle = useCallback(() => {
    setLang(l => {
      const next = l === 'pl' ? 'en' : 'pl';
      localStorage.setItem('sv-lang', next);
      return next;
    });
  }, []);

  const t = useCallback((path) => {
    const keys = path.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || path;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
