import { useLang } from '../context/LangContext';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

// Kwartał z zapasem: spółka raportująca co kwartał nie powinna milczeć dłużej.
const STALE_AFTER_DAYS = 92;

/** Najnowsza data okresu w całym komplecie sprawozdań (roczne i kwartalne). */
export function newestPeriod(data) {
  if (!data) return null;
  const blocks = [data.incomeStatement, data.balanceSheet, data.cashFlow];
  let best = null;
  for (const block of blocks) {
    for (const rows of [block?.annual, block?.quarterly]) {
      for (const row of rows || []) {
        if (!row?.date) continue;
        if (!best || row.date > best.date) best = { date: row.date, period: row.period };
      }
    }
  }
  return best;
}

export function daysSince(dateStr, now = new Date()) {
  const then = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((now - then) / 86_400_000);
}

/**
 * Pasek świeżości danych finansowych: za jaki okres są liczby, skąd pochodzą
 * i czy nie są starsze niż kwartał.
 */
export default function DataFreshness({ data, source }) {
  const { t, lang } = useLang();

  const newest = newestPeriod(data);
  if (!newest) return null;

  const age = daysSince(newest.date);
  const stale = age == null || age > STALE_AFTER_DAYS;

  const formattedDate = new Date(`${newest.date}T00:00:00Z`).toLocaleDateString(
    lang === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' },
  );

  const sourceLabel = t(`stock.freshness.source_${source || 'unknown'}`);
  const Icon = stale ? AlertTriangle : CheckCircle;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 mb-4 rounded-lg border text-xs ${
        stale
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
          : 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
      }`}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        {t('stock.freshness.latest')}: {newest.period || formattedDate}
      </span>

      <span className="text-surface-600 dark:text-surface-400">
        {t('stock.freshness.periodEnd')}: {formattedDate}
      </span>

      <span className="text-surface-600 dark:text-surface-400 inline-flex items-center gap-1">
        <Info className="w-3 h-3 flex-shrink-0" />
        {sourceLabel}
      </span>

      {stale && (
        <span className="font-medium">
          {t('stock.freshness.stale')}
          {age != null && ` (${age} ${t('stock.freshness.days')})`}
        </span>
      )}
    </div>
  );
}
