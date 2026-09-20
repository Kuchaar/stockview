// Dane strukturalne (JSON-LD) dla strony spółki — zadanie S3.
// Trzymane osobno od komponentu, żeby dało się je sprawdzić skryptem bez renderowania.

import { SITE_URL } from '../config/site.js';

/** Usuwa puste gałęzie — w JSON-LD lepiej pominąć pole niż wstawić null. */
function prune(value) {
  if (Array.isArray(value)) {
    const arr = value.map(prune).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = prune(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    const keys = Object.keys(out);
    if (!keys.length) return undefined;
    // sam `@type` bez treści nic nie wnosi; `@id`, `@graph` i `@context` zostają
    if (keys.length === 1 && keys[0] === '@type') return undefined;
    return out;
  }
  if (value === null || value === '' || Number.isNaN(value)) return undefined;
  return value;
}

/**
 * Buduje graf JSON-LD dla strony spółki: sama spółka (Corporation),
 * jej akcje jako produkt finansowy (FinancialProduct) i okruszki nawigacji.
 *
 * @param {object} stock - wpis z wig20Companies
 * @param {object} opts  - { lang: 'pl' | 'en' }
 */
export function buildStockJsonLd(stock, { lang = 'pl' } = {}) {
  if (!stock) return null;

  const pageUrl = `${SITE_URL}/stock/${stock.id}`;
  const companyId = `${pageUrl}#company`;
  const profile = stock.profile || {};

  const corporation = {
    '@type': 'Corporation',
    '@id': companyId,
    name: stock.name,
    alternateName: stock.shortName,
    description: profile.description?.[lang],
    tickerSymbol: stock.ticker,
    url: pageUrl,
    sameAs: profile.website,
    foundingDate: profile.founded ? String(profile.founded) : undefined,
    numberOfEmployees: profile.employees
      ? { '@type': 'QuantitativeValue', value: profile.employees }
      : undefined,
    address: profile.headquarters?.[lang]
      ? {
          '@type': 'PostalAddress',
          addressLocality: profile.headquarters[lang],
          addressCountry: 'PL',
        }
      : undefined,
    identifier: profile.isin
      ? { '@type': 'PropertyValue', propertyID: 'ISIN', value: profile.isin }
      : undefined,
  };

  const financialProduct = {
    '@type': 'FinancialProduct',
    name: lang === 'pl' ? `Akcje ${stock.name} (${stock.ticker})` : `${stock.name} (${stock.ticker}) shares`,
    description: lang === 'pl'
      ? `Akcje spółki ${stock.name} notowane na Giełdzie Papierów Wartościowych w Warszawie w indeksie WIG20.`
      : `Shares of ${stock.name} listed on the Warsaw Stock Exchange in the WIG20 index.`,
    category: lang === 'pl' ? 'Akcje' : 'Stocks',
    url: pageUrl,
    provider: { '@id': companyId },
  };

  // Bez poziomu sektora: Google wymaga `item` dla każdej pozycji poza ostatnią,
  // a filtr sektorów na stronie głównej nie ma własnego adresu.
  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'WIG20', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `${stock.name} (${stock.ticker})`, item: pageUrl },
    ],
  };

  return prune({
    '@context': 'https://schema.org',
    '@graph': [corporation, financialProduct, breadcrumbs],
  });
}
