import { useMemo } from 'react';
import { wig20Companies, TICKER_TO_YAHOO } from '../data/wig20';
import useStockQuotes from './useStockQuotes';

// Reverse map: 'PKO.WA' -> 'PKO'
const YAHOO_TO_TICKER = Object.fromEntries(
  Object.entries(TICKER_TO_YAHOO).map(([ticker, yahoo]) => [yahoo, ticker])
);

export default function useStockData() {
  const { quotes, loading, error, lastUpdated } = useStockQuotes();

  const companies = useMemo(() => {
    if (!quotes) return wig20Companies;

    return wig20Companies.map((company) => {
      const yahooSymbol = TICKER_TO_YAHOO[company.ticker];
      const liveQuote = yahooSymbol ? quotes[yahooSymbol] : null;

      if (!liveQuote || liveQuote.price == null) return company;

      return {
        ...company,
        price: liveQuote.price,
        change: liveQuote.change ?? company.change,
        changePercent: liveQuote.changePercent ?? company.changePercent,
        volume: liveQuote.volume ?? company.volume,
        marketCap: liveQuote.marketCap
          ? Math.round(liveQuote.marketCap / 1_000_000) // Yahoo returns raw, we store in millions
          : company.marketCap,
        _live: true, // flag to indicate live data
      };
    });
  }, [quotes]);

  return { companies, loading, error, lastUpdated };
}
