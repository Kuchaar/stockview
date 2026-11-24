import { useLang } from '../context/LangContext';
import { HEALTH_CRITERIA, getRatioMeta } from '../data/ratioCalculator';
import { ChevronDown } from 'lucide-react';

// Opis metodologii oceny kondycji (P8+D10e). Każda ocena na stronie spółki prowadzi tutaj:
// komponent stoi pod oceną na Przeglądzie i pod oceną w zakładce Kondycja.
//
// Progi **nie są** przepisane do tłumaczeń — tabela buduje się z `HEALTH_CRITERIA`, czyli
// z tego samego obiektu, którym liczy się ocena. Inaczej opis i liczba rozjechałyby się przy
// pierwszej zmianie progu, a opis metodologii niezgodny z metodologią jest gorszy niż brak
// opisu: wygląda na sprawdzony.

function fmtNumber(value, lang) {
  const text = String(value);
  return lang === 'pl' ? text.replace('.', ',') : text;
}

function fmtThreshold(value, format, lang) {
  const text = fmtNumber(value, lang);
  return format === 'percent' ? `${text}%` : text;
}

/** „≥ 15% / ≥ 10% / ≥ 5%" albo, przy wskaźniku „im mniej, tym lepiej", „≤ 0,3 / ≤ 0,7 / ≤ 1,5" */
function thresholdText(metric, format, lang) {
  const parts = metric.invert
    ? [metric.low, metric.mid, metric.high].map(v => `≤ ${fmtThreshold(v, format, lang)}`)
    : [metric.high, metric.mid, metric.low].map(v => `≥ ${fmtThreshold(v, format, lang)}`);
  return parts.join(' / ');
}

export default function HealthMethodology() {
  const { t, lang } = useLang();

  const areas = Object.entries(HEALTH_CRITERIA).map(([name, def]) => ({
    name,
    label: t(`stock.${name === 'growth' ? 'growthScore' : name}`),
    weight: def.weight,
    metrics: def.metrics.map(m => {
      const meta = getRatioMeta(m.key);
      return {
        key: m.key,
        label: lang === 'pl' ? meta?.label_pl : meta?.label_en,
        thresholds: thresholdText(m, meta?.format, lang),
      };
    }),
  }));

  return (
    <details className="group mt-4 rounded-2xl border border-surface-200/60 dark:border-surface-800/60 bg-surface-50/60 dark:bg-surface-900/40">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-3.5 text-sm font-medium text-surface-700 dark:text-surface-300">
        {t('stock.methodology.summary')}
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 text-surface-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="px-5 pb-5 space-y-3 text-xs leading-relaxed text-surface-600 dark:text-surface-400">
        <p>{t('stock.methodology.intro')}</p>
        <p>{t('stock.methodology.convention')}</p>
        <p>{t('stock.methodology.noValuation')}</p>
        <p>{t('stock.methodology.missing')}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-surface-500 dark:text-surface-500">
                <th scope="col" className="py-2 pr-3 font-medium">{t('stock.methodology.tableArea')}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t('stock.methodology.tableWeight')}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t('stock.methodology.tableMetric')}</th>
                <th scope="col" className="py-2 font-medium">{t('stock.methodology.tableThresholds')}</th>
              </tr>
            </thead>
            <tbody>
              {areas.map(area =>
                area.metrics.map((m, i) => (
                  <tr key={`${area.name}-${m.key}`} className="border-t border-surface-200/50 dark:border-surface-800/50">
                    {i === 0 && (
                      <>
                        <th
                          scope="row"
                          rowSpan={area.metrics.length}
                          className="py-2 pr-3 align-top font-medium text-surface-700 dark:text-surface-300"
                        >
                          {area.label}
                        </th>
                        <td rowSpan={area.metrics.length} className="py-2 pr-3 align-top font-mono">
                          {area.weight}%
                        </td>
                      </>
                    )}
                    <td className="py-2 pr-3">{m.label}</td>
                    <td className="py-2 font-mono whitespace-nowrap">{m.thresholds}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>

        <p>{t('stock.methodology.roicNote')}</p>

        <div>
          <div className="font-medium text-surface-700 dark:text-surface-300 mb-1">
            {t('stock.methodology.bandsTitle')}
          </div>
          <p>{t('stock.methodology.bandsBody')}</p>
        </div>
      </div>
    </details>
  );
}
