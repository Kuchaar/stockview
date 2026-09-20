import { useLang } from '../context/LangContext';
import { Info } from 'lucide-react';

/**
 * Treść wyjaśniająca na dole strony głównej (zadanie S4).
 * Pisana dla czytelnika, nie dla wyszukiwarki — stąd zwykłe akapity i nagłówki,
 * bez list słów kluczowych.
 */
export default function HomeContent() {
  const { t } = useLang();

  const sections = [
    { title: 'homeContent.indexTitle', body: ['homeContent.indexBody1', 'homeContent.indexBody2'] },
    { title: 'homeContent.ratiosTitle', body: ['homeContent.ratiosBody1', 'homeContent.ratiosBody2', 'homeContent.ratiosBody3'] },
    { title: 'homeContent.dataTitle', body: ['homeContent.dataBody'] },
  ];

  return (
    <section className="max-w-3xl mx-auto space-y-10 pt-4">
      {sections.map(({ title, body }) => (
        <div key={title} className="space-y-3">
          <h2 className="font-display font-bold text-xl sm:text-2xl tracking-tight">
            {t(title)}
          </h2>
          {body.map((key) => (
            <p key={key} className="text-surface-600 dark:text-surface-400 leading-relaxed">
              {t(key)}
            </p>
          ))}
        </div>
      ))}

      <div className="card !p-4 flex gap-3">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-surface-400" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-semibold text-sm">{t('homeContent.disclaimerTitle')}</h2>
          <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
            {t('homeContent.disclaimerBody')}
          </p>
        </div>
      </div>
    </section>
  );
}
