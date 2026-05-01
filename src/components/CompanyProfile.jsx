import { useLang } from '../context/LangContext';
import { sectors, formatNumber } from '../data/wig20';
import { Building2, Calendar, Users, Globe, ExternalLink } from 'lucide-react';

export default function CompanyProfile({ stock, lang }) {
  const { t } = useLang();
  const profile = stock.profile;

  if (!profile) {
    return (
      <div className="card text-center py-12 text-surface-500 dark:text-surface-400">
        {lang === 'pl' ? 'Brak danych o spółce.' : 'No company data available.'}
      </div>
    );
  }

  const sectorName = sectors[lang]?.[stock.sector] || stock.sector;

  const infoItems = [
    { label: t('company.sector'), value: sectorName },
    { label: t('company.headquarters'), value: profile.headquarters?.[lang] },
    { label: t('company.founded'), value: profile.founded },
    { label: t('company.ipoYear'), value: profile.ipoYear },
    {
      label: t('company.employees'),
      value: profile.employees != null
        ? profile.employees.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US')
        : null,
    },
    { label: t('company.ceo'), value: profile.ceo },
    { label: t('company.isin'), value: profile.isin, mono: true },
  ];

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="card">
        <h2 className="section-title mb-3">{t('company.about')}</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          {profile.description?.[lang]}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Info grid */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">{t('company.info')}</h3>
          <dl className="space-y-3">
            {infoItems.map(item => {
              if (item.value == null) return null;
              return (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <dt className="text-surface-500 dark:text-surface-400">{item.label}</dt>
                  <dd className={`font-medium text-surface-700 dark:text-surface-200 ${item.mono ? 'font-mono text-xs' : ''}`}>
                    {item.value}
                  </dd>
                </div>
              );
            })}
            {profile.website && (
              <div className="flex items-center justify-between text-sm">
                <dt className="text-surface-500 dark:text-surface-400">{t('company.website')}</dt>
                <dd>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline text-xs font-medium"
                  >
                    {profile.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Market data */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">{t('company.marketData')}</h3>
          <dl className="space-y-3">
            <MarketItem
              label={t('home.marketCap')}
              value={formatNumber(stock.marketCap, lang)}
            />
            {stock.sharesOutstanding != null && (
              <MarketItem
                label={t('company.shares')}
                value={stock.sharesOutstanding.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US')}
              />
            )}
            {stock.ratios.pe != null && (
              <MarketItem label="P/E" value={stock.ratios.pe.toFixed(1)} />
            )}
            {stock.ratios.pb != null && (
              <MarketItem label="P/B" value={stock.ratios.pb.toFixed(2)} />
            )}
            {stock.ratios.dividendYield != null && stock.ratios.dividendYield > 0 && (
              <MarketItem
                label={t('stock.dividendYield')}
                value={`${stock.ratios.dividendYield.toFixed(1)}%`}
              />
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

function MarketItem({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-surface-500 dark:text-surface-400">{label}</dt>
      <dd className="font-mono font-medium text-surface-700 dark:text-surface-200">{value}</dd>
    </div>
  );
}
