import { useMemo } from 'react';
import { wig20Companies } from '../data/wig20';
import useLatestPrices from './useLatestPrices';

export default function useStockData() {
  const { prices, loading, error, lastUpdated } = useLatestPrices();

  const companies = useMemo(() => {
    if (!prices) return wig20Companies;

    return wig20Companies.map((company) => {
      const livePrice = prices[company.ticker];
      if (!livePrice || livePrice.close == null) return company;

      return {
        ...company,
        price: livePrice.close,
        change: livePrice.change ?? company.change,
        changePercent: livePrice.changePercent ?? company.changePercent,
        volume: livePrice.volume ?? company.volume,
        _priceDate: livePrice.date,
      };
    });
  }, [prices]);

  return { companies, loading, error, lastUpdated };
}
