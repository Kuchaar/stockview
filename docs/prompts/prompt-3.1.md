# Prompt 3.1 — Screener spółek

## Kontekst

StockView — React 18 + Vite + Tailwind CSS (class-based dark mode `.dark`).

24 spółki w `src/data/wig20.js` — tablica `wig20Companies`. Każdy obiekt ma: id, ticker, name, shortName, sector, logo, price, change, changePercent, volume, marketCap, sharesOutstanding, profile, financials, ratios.

Pole `ratios` zawiera: pe, pb, evEbitda, roe, roa, currentRatio, quickRatio, debtToEquity, dividendYield, eps, bookValue, grossMargin, operatingMargin, netMargin.

Pole `profile` zawiera: description, founded, ipoYear, employees, ceo, headquarters, website, isin.

`useStockData()` zwraca `{ companies, loading, error, lastUpdated, source }` — companies to wig20Companies overlaid z live cenami.

Istniejące helpery: `formatPrice`, `formatPercent`, `formatNumber`, `formatRatio` z `wig20.js`. Sektory: `sectors[lang][key]`.

Istniejąca `HomePage` (`src/pages/HomePage.jsx`) ma prostą listę kart z wyszukiwarką tekstową i filtrem sektora. Screener to NOWA, osobna strona z zaawansowanymi filtrami.

Routing: React Router v6 w `src/App.jsx`. Nawigacja w `src/components/Layout.jsx`.

Tłumaczenia: `t('klucz.podklucz')`, lang = `'pl'` | `'en'`, plik `src/data/translations.js`.

## Zadania

### A. Nowa strona: `src/pages/ScreenerPage.jsx`

#### A1. Główny layout

```
┌─────────────────────────────────────────┐
│ Screener spółek / Stock Screener        │
│ Filtruj spółki po wskaźnikach...        │
├─────────────────────────────────────────┤
│ [Filtry — collapsible panel]            │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │ P/E │ │ ROE │ │ Dyw.│ │Sekt.│ ...   │
│ └─────┘ └─────┘ └─────┘ └─────┘       │
│ [Resetuj filtry]  [X aktywnych filtrów] │
├─────────────────────────────────────────┤
│ Wyniki: 18 spółek    [Sortuj: ▼ P/E]   │
├─────────────────────────────────────────┤
│ Tabela wyników (sortowalna)             │
│ Ticker | Nazwa | Cena | Zmiana | P/E    │
│  ...   | ...   | ...  |  ...   | ...    │
└─────────────────────────────────────────┘
```

#### A2. State

```js
const [filters, setFilters] = useState({
  sector: 'all',           // string: sector key or 'all'
  peMin: '',               // string (input value), parsowane do number
  peMax: '',
  pbMin: '',
  pbMax: '',
  roeMin: '',
  dividendYieldMin: '',
  marketCapMin: '',        // w mld PLN
  marketCapMax: '',
  debtToEquityMax: '',
  hasProfit: false,        // boolean: zysk netto > 0
  hasDividend: false,      // boolean: dividendYield > 0
});

const [sortKey, setSortKey] = useState('marketCap');  // klucz sortowania
const [sortDir, setSortDir] = useState('desc');        // 'asc' | 'desc'
const [filtersOpen, setFiltersOpen] = useState(true);  // panel filtrów rozwinięty
```

#### A3. Panel filtrów

Karta `.card` z collapsible content (toggle przyciskiem w nagłówku).

**Nagłówek panelu:** "Filtry" / "Filters" + badge z liczbą aktywnych filtrów + przycisk collapse (chevron).

**Layout filtrów:** Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`

Każdy filtr to mały blok z etykietą i inputem:

1. **Sektor** — `<select>` z opcjami (identyczny jak na HomePage, ale w screenerze)
2. **P/E** — dwa inputy: min / max, typ `number`, placeholder "od" / "do" ("from" / "to")
3. **P/B** — dwa inputy: min / max
4. **ROE (%)** — jeden input: min, placeholder "min %"
5. **Stopa dywidendy (%)** — jeden input: min
6. **Kapitalizacja (mld PLN)** — dwa inputy: min / max
7. **Dług/Kapitał** — jeden input: max
8. **Zysk netto > 0** — checkbox
9. **Wypłaca dywidendę** — checkbox

**Styl inputów:** 
```
className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-900 
           border border-surface-200/60 dark:border-surface-800/50 
           text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30
           placeholder:text-surface-400"
```

**Styl checkboxów:**
```
className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 
           text-green-500 focus:ring-green-500/30"
```

**Przycisk "Resetuj filtry" / "Reset filters":**
- Widoczny tylko gdy ≥1 filtr aktywny
- Resetuje `filters` do wartości domyślnych
- Styl: `text-xs text-surface-500 hover:text-red-500 transition-colors`

**Licznik aktywnych filtrów:**
Helper:
```js
function countActiveFilters(filters) {
  let count = 0;
  if (filters.sector !== 'all') count++;
  if (filters.peMin !== '') count++;
  if (filters.peMax !== '') count++;
  if (filters.pbMin !== '') count++;
  if (filters.pbMax !== '') count++;
  if (filters.roeMin !== '') count++;
  if (filters.dividendYieldMin !== '') count++;
  if (filters.marketCapMin !== '') count++;
  if (filters.marketCapMax !== '') count++;
  if (filters.debtToEquityMax !== '') count++;
  if (filters.hasProfit) count++;
  if (filters.hasDividend) count++;
  return count;
}
```

#### A4. Logika filtrowania (useMemo)

```js
const filteredStocks = useMemo(() => {
  return companies.filter(stock => {
    const r = stock.ratios;
    const f = filters;
    
    if (f.sector !== 'all' && stock.sector !== f.sector) return false;
    
    // Range filters — skip when value is null (nie odrzucaj spółki gdy brak danych)
    if (f.peMin !== '' && (r.pe == null || r.pe < parseFloat(f.peMin))) return false;
    if (f.peMax !== '' && (r.pe == null || r.pe > parseFloat(f.peMax))) return false;
    if (f.pbMin !== '' && (r.pb == null || r.pb < parseFloat(f.pbMin))) return false;
    if (f.pbMax !== '' && (r.pb == null || r.pb > parseFloat(f.pbMax))) return false;
    if (f.roeMin !== '' && (r.roe == null || r.roe < parseFloat(f.roeMin))) return false;
    if (f.dividendYieldMin !== '' && (r.dividendYield == null || r.dividendYield < parseFloat(f.dividendYieldMin))) return false;
    if (f.marketCapMin !== '' && (stock.marketCap == null || stock.marketCap / 1000 < parseFloat(f.marketCapMin))) return false;
    if (f.marketCapMax !== '' && (stock.marketCap == null || stock.marketCap / 1000 > parseFloat(f.marketCapMax))) return false;
    if (f.debtToEquityMax !== '' && (r.debtToEquity == null || r.debtToEquity > parseFloat(f.debtToEquityMax))) return false;
    
    // Boolean filters
    if (f.hasProfit) {
      const ni = stock.financials?.annual?.netIncome;
      const lastNI = ni && ni.length > 0 ? ni[ni.length - 1] : null;
      if (lastNI == null || lastNI <= 0) return false;
    }
    if (f.hasDividend && (r.dividendYield == null || r.dividendYield <= 0)) return false;
    
    return true;
  });
}, [companies, filters]);
```

#### A5. Logika sortowania (useMemo)

```js
const SORT_OPTIONS = [
  { key: 'marketCap',      pl: 'Kapitalizacja',   en: 'Market Cap' },
  { key: 'changePercent',  pl: 'Zmiana %',        en: 'Change %' },
  { key: 'pe',             pl: 'P/E',             en: 'P/E' },
  { key: 'pb',             pl: 'P/B',             en: 'P/B' },
  { key: 'roe',            pl: 'ROE',             en: 'ROE' },
  { key: 'dividendYield',  pl: 'Dywidenda',       en: 'Dividend' },
  { key: 'debtToEquity',   pl: 'Dług/Kapitał',    en: 'Debt/Equity' },
  { key: 'price',          pl: 'Cena',            en: 'Price' },
  { key: 'name',           pl: 'Nazwa',           en: 'Name' },
];

const sortedStocks = useMemo(() => {
  const sorted = [...filteredStocks].sort((a, b) => {
    let va, vb;
    
    if (sortKey === 'name') {
      va = a.shortName.toLowerCase();
      vb = b.shortName.toLowerCase();
    } else if (['pe', 'pb', 'roe', 'dividendYield', 'debtToEquity'].includes(sortKey)) {
      va = a.ratios[sortKey];
      vb = b.ratios[sortKey];
    } else {
      va = a[sortKey];
      vb = b[sortKey];
    }
    
    // null-e na koniec
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    
    if (sortKey === 'name') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortDir === 'asc' ? va - vb : vb - va;
  });
  return sorted;
}, [filteredStocks, sortKey, sortDir]);
```

#### A6. Tabela wyników

Responsywna tabela w karcie `.card` z `overflow-x-auto`.

**Pasek nad tabelą:**
```
Wyniki: {count} spółek / Results: {count} stocks     [Sortuj: ▼ select]
```

**Nagłówki kolumn (klikalne do sortowania):**

| Kolumna | Wartość | Szerokość |
|---|---|---|
| Spółka / Stock | logo + shortName + ticker | min-w-[180px] |
| Sektor / Sector | sectors[lang][stock.sector] | min-w-[100px] |
| Kurs / Price | formatPrice(stock.price) PLN | min-w-[100px] |
| Zmiana / Change | formatPercent(stock.changePercent) | min-w-[80px] |
| P/E | ratios.pe?.toFixed(1) | min-w-[70px] |
| P/B | ratios.pb?.toFixed(2) | min-w-[70px] |
| ROE | ratios.roe?.toFixed(1)% | min-w-[70px] |
| Dywidenda / Dividend | ratios.dividendYield?.toFixed(1)% | min-w-[90px] |
| Dług/Kap. / D/E | ratios.debtToEquity?.toFixed(2) | min-w-[80px] |
| Kap. / MCap | formatNumber(stock.marketCap, lang) | min-w-[100px] |

**Kliknięcie nagłówka:**
- Jeśli już sortowany po tej kolumnie → odwróć kierunek
- Jeśli inna kolumna → ustaw tę kolumnę, domyślny kierunek (desc, ale asc dla name)
- Pokaż ikonę strzałki (▲/▼) przy aktywnej kolumnie sortowania

**Wiersze tabeli:**
- Cały wiersz klikalny jako `<Link to={/stock/${stock.id}}>` 
- Hover: `hover:bg-surface-100/50 dark:hover:bg-surface-800/30`
- Zmiana: zielona/czerwona jak na StockCard
- Wartości null: "—" w `text-surface-400`
- Kursor: `cursor-pointer`

**Styl tabeli:**
```
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-surface-200/50 dark:border-surface-800/50">
      <th className="text-left py-3 px-3 text-xs font-medium text-surface-500 uppercase tracking-wide cursor-pointer hover:text-surface-700 dark:hover:text-surface-300 select-none">
        ...
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-surface-200/30 dark:divide-surface-800/30">
    ...
  </tbody>
</table>
```

**Puste wyniki:**
```jsx
<div className="text-center py-16 text-surface-400">
  <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
  <p>{lang === 'pl' ? 'Brak spółek spełniających kryteria' : 'No stocks match your criteria'}</p>
  <button onClick={resetFilters} className="text-xs text-green-600 dark:text-green-400 mt-2 hover:underline">
    {lang === 'pl' ? 'Resetuj filtry' : 'Reset filters'}
  </button>
</div>
```

#### A7. Predefiniowane filtry (quick filters)

Pod nagłówkiem strony, przed panelem filtrów — rząd przycisków z gotowymi zestawami filtrów:

```js
const PRESETS = [
  {
    id: 'value',
    pl: 'Wartościowe',
    en: 'Value',
    icon: '💎',
    filters: { peMax: '15', pbMax: '1.5', sector: 'all', peMin: '', pbMin: '', roeMin: '', dividendYieldMin: '', marketCapMin: '', marketCapMax: '', debtToEquityMax: '', hasProfit: true, hasDividend: false },
  },
  {
    id: 'dividend',
    pl: 'Dywidendowe',
    en: 'Dividend',
    icon: '💰',
    filters: { dividendYieldMin: '3', hasDividend: true, sector: 'all', peMin: '', peMax: '', pbMin: '', pbMax: '', roeMin: '', marketCapMin: '', marketCapMax: '', debtToEquityMax: '', hasProfit: false },
  },
  {
    id: 'quality',
    pl: 'Jakościowe',
    en: 'Quality',
    icon: '⭐',
    filters: { roeMin: '12', debtToEquityMax: '1', hasProfit: true, sector: 'all', peMin: '', peMax: '', pbMin: '', pbMax: '', dividendYieldMin: '', marketCapMin: '', marketCapMax: '', hasDividend: false },
  },
  {
    id: 'bluechip',
    pl: 'Blue chips',
    en: 'Blue Chips',
    icon: '🏛️',
    filters: { marketCapMin: '20', sector: 'all', peMin: '', peMax: '', pbMin: '', pbMax: '', roeMin: '', dividendYieldMin: '', marketCapMax: '', debtToEquityMax: '', hasProfit: false, hasDividend: false },
  },
];
```

**Styl preset buttons:**
```
className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium 
  border transition-all duration-200 whitespace-nowrap ${
    isActive
      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      : 'border-surface-200/60 dark:border-surface-800/50 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900'
  }`}
```

Kliknięcie presetu: `setFilters(preset.filters)`. Kliknięcie aktywnego presetu: resetuje filtry do domyślnych.

### B. Routing

W `src/App.jsx` dodaj:
```jsx
import ScreenerPage from './pages/ScreenerPage';

// W Routes:
<Route path="/screener" element={<ErrorBoundary><ScreenerPage /></ErrorBoundary>} />
```

### C. Nawigacja

W `src/components/Layout.jsx`, dodaj link do nawigacji:
```js
import { ..., SlidersHorizontal } from 'lucide-react';

// W navItems, po linku do /compare:
{ to: '/screener', label: t('nav.screener'), icon: SlidersHorizontal }
```

### D. Link z HomePage

Na `HomePage`, w sekcji "Wszystkie spółki WIG20" (id="stock-list"), obok nagłówka dodaj link do screenera:

```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
  <h2 className="section-title">{t('home.allStocks')}</h2>
  <div className="flex items-center gap-3">
    <Link 
      to="/screener" 
      className="inline-flex items-center gap-1.5 text-xs text-surface-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
    >
      <SlidersHorizontal className="w-3.5 h-3.5" />
      {lang === 'pl' ? 'Zaawansowane filtry' : 'Advanced filters'}
    </Link>
    {/* istniejące search + sector filter */}
  </div>
</div>
```

Wymaga importu `SlidersHorizontal` z lucide-react i `Link` (już importowany).

### E. Tłumaczenia

Dodaj do `src/data/translations.js`:

**W obiekcie `nav`:**
```
screener: "Screener" / "Screener"
```

**Nowy obiekt `screener`:**
```
screener.title: "Screener spółek" / "Stock Screener"
screener.subtitle: "Filtruj spółki po wskaźnikach finansowych" / "Filter stocks by financial metrics"
screener.filters: "Filtry" / "Filters"
screener.results: "Wyniki" / "Results"
screener.stocks: "spółek" / "stocks"
screener.stock: "spółka" / "stock"
screener.sortBy: "Sortuj" / "Sort by"
screener.reset: "Resetuj filtry" / "Reset filters"
screener.activeFilters: "aktywnych filtrów" / "active filters"
screener.noResults: "Brak spółek spełniających kryteria" / "No stocks match your criteria"
screener.from: "od" / "from"
screener.to: "do" / "to"
screener.min: "min" / "min"
screener.max: "max" / "max"
screener.sector: "Sektor" / "Sector"
screener.hasProfit: "Zysk netto > 0" / "Net profit > 0"
screener.hasDividend: "Wypłaca dywidendę" / "Pays dividend"
screener.presets: "Szybkie filtry" / "Quick filters"
screener.value: "Wartościowe" / "Value"
screener.dividend: "Dywidendowe" / "Dividend"
screener.quality: "Jakościowe" / "Quality"
screener.bluechip: "Blue chips" / "Blue Chips"
screener.marketCap: "Kapitalizacja" / "Market Cap"
screener.debtToEquity: "Dług/Kapitał" / "Debt/Equity"
```

### F. SEO — Helmet

```jsx
<Helmet>
  <title>{lang === 'pl' ? 'Screener spółek WIG20 | StockView' : 'WIG20 Stock Screener | StockView'}</title>
  <meta name="description" content={lang === 'pl'
    ? 'Filtruj spółki WIG20 po P/E, ROE, stopie dywidendy, kapitalizacji i innych wskaźnikach. Znajdź spółki wartościowe, dywidendowe i jakościowe.'
    : 'Filter WIG20 stocks by P/E, ROE, dividend yield, market cap and other metrics. Find value, dividend, and quality stocks.'
  } />
</Helmet>
```

## Ważne zasady

- BEZ nowych zależności npm
- Dane wyłącznie z `useStockData()` — NIE fetchuj dodatkowych danych
- Filtry działają na wartościach z `stock.ratios` i `stock.marketCap` (statyczne/live)
- Inputy range: typ `number`, `step="0.1"`, `min="0"` (oprócz peMin/peMax które mogą być ujemne)
- Sortowanie: null-e zawsze na końcu (niezależnie od kierunku)
- Tabela: wiersz klikalny → nawigacja do `/stock/{id}`
- Responsywność: tabela z `overflow-x-auto`, filtry się zawijają w grid
- Na mobile: panel filtrów domyślnie złożony (`filtersOpen: false` gdy `window.innerWidth < 640` — sprawdź raz w useState initializer)
- Predefiniowane filtry: podświetl aktywny preset (porównaj czy bieżące filtry === preset.filters)
- Ikona `SlidersHorizontal` — jeśli nie istnieje w zainstalowanej wersji lucide-react, użyj `Filter`
- Zachowaj spójny styl z resztą aplikacji (`.card`, `.section-title`, kolory green-500/600)
