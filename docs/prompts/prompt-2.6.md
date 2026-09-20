# Prompt 2.6 — Porównywarka spółek + integracja + edge cases

## Kontekst

StockView — React 18 + Vite + Tailwind CSS (class-based dark mode `.dark`).

Projekt ma 24 spółek w `src/data/wig20.js`. Każda ma: ticker, name, shortName, sector, price, change, changePercent, volume, marketCap, sharesOutstanding, financials, ratios, profile.

Istniejące strony:
- `/` → `HomePage` — lista spółek z filtrami
- `/stock/:id` → `StockPage` — 6 tabów: overview, about, chart, financials, valuation, health

Routing: `src/App.jsx` — React Router v6, `AnimatedRoutes` z Framer Motion. ErrorBoundary opakowuje każdą stronę.

Tłumaczenia: `t('klucz.podklucz')`, lang = `'pl'` | `'en'`, plik `src/data/translations.js`.

Istniejące helpers: `formatPrice`, `formatPercent`, `formatNumber`, `formatRatio` z `wig20.js`.

Istniejące hooki: `useStockData()`, `useFinancials(yahooSymbol, companyId)`, `useHistoricalPrices(ticker)`.

Istniejące style: `.card`, `.card-hover`, `.glass`, `.section-title`, `.btn-primary`, `.tab-button` w `src/index.css`.

## Zadania

### A. Nowa strona: Porównywarka spółek `/compare`

#### A1. Nowy plik: `src/pages/ComparePage.jsx`

Strona pozwala użytkownikowi wybrać 2–4 spółki i porównać je obok siebie w tabeli.

**Główny layout:**

1. **Nagłówek strony:**
   ```
   Porównaj spółki / Compare Stocks
   Podtytuł: "Wybierz 2-4 spółki do porównania" / "Select 2-4 stocks to compare"
   ```

2. **Selektor spółek** — rząd z dropdownami/przyciskami:
   - Pokazuj 2 sloty domyślnie, przycisk "+" aby dodać 3. i 4. slot (max 4)
   - Każdy slot: `<select>` z opcjami `{stock.shortName} ({stock.ticker})`, posortowane alfabetycznie po shortName
   - Przycisk "×" do usunięcia slotu (nie pokazuj na pierwszych 2 slotach)
   - Zapobiegnij duplikatom — wybrany ticker disabled w pozostałych selectach

3. **Tabela porównawcza** — renderuje się gdy ≥2 spółki wybrane:

   Kolumny: etykieta po lewej + po jednej kolumnie na każdą spółkę.
   
   **Nagłówek tabeli:**
   - Ticker + shortName
   - Logo (emoji z `stock.logo`)
   - Sektor
   
   **Sekcja: Cena i kapitalizacja**
   | Etykieta PL | EN | Źródło |
   |---|---|---|
   | Kurs | Price | `formatPrice(stock.price)` + " PLN" |
   | Zmiana | Change | `formatPercent(stock.changePercent)` — zielony/czerwony |
   | Kapitalizacja | Market Cap | `formatNumber(stock.marketCap, lang)` |

   **Sekcja: Wycena**
   | Etykieta | Źródło |
   |---|---|
   | P/E | `stock.ratios.pe?.toFixed(1)` |
   | P/B | `stock.ratios.pb?.toFixed(2)` |
   | EV/EBITDA | `stock.ratios.evEbitda?.toFixed(1)` |
   | Stopa dywidendy / Dividend Yield | `stock.ratios.dividendYield?.toFixed(1)%` |

   **Sekcja: Rentowność**
   | Etykieta | Źródło |
   |---|---|
   | ROE | `stock.ratios.roe?.toFixed(1)%` |
   | ROA | `stock.ratios.roa?.toFixed(1)%` |
   | Marża operacyjna / Operating Margin | `stock.ratios.operatingMargin?.toFixed(1)%` |
   | Marża netto / Net Margin | `stock.ratios.netMargin?.toFixed(1)%` |

   **Sekcja: Bilans**
   | Etykieta | Źródło |
   |---|---|
   | Dług/Kapitał / Debt/Equity | `stock.ratios.debtToEquity?.toFixed(2)` |
   | Current Ratio | `stock.ratios.currentRatio?.toFixed(2)` |
   | EPS | `stock.ratios.eps?.toFixed(2)` |

   **Sekcja: Informacje**
   | Etykieta | Źródło |
   |---|---|
   | Pracownicy / Employees | `stock.profile?.employees?.toLocaleString(...)` |
   | Rok założenia / Founded | `stock.profile?.founded` |
   | Debiut GPW / IPO Year | `stock.profile?.ipoYear` |

4. **Kolorowanie najlepszej wartości:**
   - W każdym wierszu porównawczym, podświetl najlepszą wartość (np. `bg-green-500/10 text-green-600 dark:text-green-400 font-semibold rounded px-1`)
   - "Najlepsza" zależy od metryki:
     - **Wyższe = lepsze**: ROE, ROA, marże, dividendYield, currentRatio, EPS, employees
     - **Niższe = lepsze**: PE, PB, evEbitda, debtToEquity
     - **Bez kolorowania**: cena, zmiana (informacyjne), founded, ipoYear, marketCap
   - Gdy wartość = null, pomiń w porównaniu (ale pokaż "—")
   - Gdy remis — koloruj oba

**State:**
```js
const [selected, setSelected] = useState([null, null]); // tablica stock.id lub null
```

**Styl:**
- Tabela: klasa `.card`, `overflow-x-auto` na mobile
- Nagłówki sekcji: tło `bg-surface-100/50 dark:bg-surface-900/30`, tekst `text-xs uppercase font-semibold tracking-wide text-surface-500`
- Wartości null: "—" w kolorze `text-surface-400`
- Tabela: `border-collapse`, borders `border-surface-200/50 dark:border-surface-800/50`
- Responsywność: na mobile (< 640px) tabela scrollowana horyzontalnie, min-width kolumny spółki = 140px

#### A2. Routing

W `src/App.jsx` dodaj:
```jsx
import ComparePage from './pages/ComparePage';

// W Routes:
<Route path="/compare" element={<ErrorBoundary><ComparePage /></ErrorBoundary>} />
```

#### A3. Nawigacja

W `src/components/Layout.jsx`, dodaj link do nawigacji:
```js
{ to: '/compare', label: t('nav.compare'), icon: BarChart3 }
```
Umieść po linku do dividends, przed watchlist/calendar.

Potrzebny import ikony — użyj `GitCompareArrows` z lucide-react zamiast BarChart3:
```js
import { ..., GitCompareArrows } from 'lucide-react';
// ...
{ to: '/compare', label: t('nav.compare'), icon: GitCompareArrows }
```

#### A4. Link z StockPage

Na stronie spółki, w headerze (obok badge WIG20), dodaj mały link:
```jsx
<Link
  to={`/compare?stock=${stock.id}`}
  className="text-xs text-surface-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
>
  {lang === 'pl' ? 'Porównaj ↗' : 'Compare ↗'}
</Link>
```

Na ComparePage: odczytaj `?stock=` z URL i ustaw jako pierwszy wybrany slot:
```js
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const preselected = searchParams.get('stock');

// W useEffect (raz przy mount):
useEffect(() => {
  if (preselected && wig20Companies.some(c => c.id === preselected)) {
    setSelected(prev => [preselected, prev[1]]);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

### B. Tłumaczenia

Dodaj do `src/data/translations.js`:

**W obiekcie `nav`:**
```
compare: "Porównaj" / "Compare"
```

**Nowy obiekt `compare`:**
```
compare.title: "Porównaj spółki" / "Compare Stocks"
compare.subtitle: "Wybierz 2-4 spółki do porównania" / "Select 2-4 stocks to compare"
compare.selectStock: "Wybierz spółkę..." / "Select stock..."
compare.addStock: "Dodaj spółkę" / "Add stock"
compare.removeStock: "Usuń" / "Remove"
compare.price: "Cena" / "Price"
compare.change: "Zmiana" / "Change"
compare.marketCap: "Kapitalizacja" / "Market Cap"
compare.valuation: "Wycena" / "Valuation"
compare.profitability: "Rentowność" / "Profitability"
compare.balance: "Bilans" / "Balance Sheet"
compare.info: "Informacje" / "Information"
compare.dividendYield: "Stopa dywidendy" / "Dividend Yield"
compare.operatingMargin: "Marża operacyjna" / "Operating Margin"
compare.netMargin: "Marża netto" / "Net Margin"
compare.debtToEquity: "Dług/Kapitał" / "Debt/Equity"
compare.employees: "Pracownicy" / "Employees"
compare.founded: "Rok założenia" / "Founded"
compare.ipoYear: "Debiut GPW" / "IPO Year"
compare.minTwo: "Wybierz co najmniej 2 spółki" / "Select at least 2 stocks"
```

### C. SEO — Helmet na ComparePage

```jsx
<Helmet>
  <title>{lang === 'pl' ? 'Porównywarka spółek WIG20 | StockView' : 'Compare WIG20 Stocks | StockView'}</title>
  <meta name="description" content={lang === 'pl'
    ? 'Porównaj wskaźniki finansowe spółek WIG20 — P/E, ROE, marże, dywidenda i więcej.'
    : 'Compare financial metrics of WIG20 stocks — P/E, ROE, margins, dividend and more.'
  } />
</Helmet>
```

### D. Edge cases i poprawki w istniejącym kodzie

#### D1. `StockPage.jsx` — zabezpiecz financials tab

W tabule financials (linia ok. 275-332), `FinancialTable` dostaje `stock.financials`, ale nie ma gwarancji że `stock.financials.annual.years` istnieje. Dodaj prosty guard:

```jsx
{financialSubTab === 'overview' && stock.financials?.annual?.years?.length > 0 && (
  <FinancialTable financials={stock.financials} />
)}
{financialSubTab === 'overview' && (!stock.financials?.annual?.years?.length) && (
  <div className="text-sm text-surface-400 text-center py-8">
    {lang === 'pl' ? 'Brak danych finansowych.' : 'No financial data available.'}
  </div>
)}
```

Analogicznie dla income, balance, cashflow — dodaj fallback gdy `liveFinancials` i `stock.financials` oba puste.

#### D2. `StockPage.jsx` — zabezpiecz ratios w overview

W `KeyRatiosSection` (linia ok. 544-644), `financials.annual.revenue.filter(...)` crashuje jeśli `revenue` jest undefined. Dodaj guard:

```js
const annualRevenue = (financials?.annual?.revenue || []).filter(v => v != null);
```

Analogicznie dla `netIncome`:
```js
const annualNI = (financials?.annual?.netIncome || []).map(v => (v == null || v < 0 ? 0 : v));
```

#### D3. `StockPage.jsx` — OverviewTab revenue growth guard

W `OverviewTab` → `HealthGrid` (linia ok. 396-400):
```js
const rev = stock.financials?.annual?.revenue || [];
```

#### D4. `HomePage.jsx` — guard na sektory

W `uniqueSectors` (linia ok. 59), dodaj filtr:
```js
const uniqueSectors = [...new Set(companies.map(s => s.sector).filter(Boolean))];
```

#### D5. Helmet — dodaj `<html lang>` attribute

W `Layout.jsx`, dodaj useEffect który ustawia `lang` na `<html>`:
```js
useEffect(() => {
  document.documentElement.lang = lang;
}, [lang]);
```

### E. Opcjonalne drobne usprawnienia

#### E1. `CompanyProfile.jsx` — brakujące tłumaczenie ISIN

W linii 31 etykieta ISIN jest hardcoded jako `'ISIN'`. Zmień na `t('company.isin')` — ale upewnij się że klucz istnieje w translations.js. Jeśli nie ma, dodaj:
```
company.isin: "ISIN" / "ISIN"
```

#### E2. `CompanyProfile.jsx` — brakujące tłumaczenia

Sprawdź czy `company.founded` istnieje w translations.js. Prompt 2.5 kazał dodać `company.founded: "Rok założenia" / "Founded"`. Jeśli klucz się nazywa inaczej (np. `Założona` / `Founded`), wyrównaj z tym co jest w CompanyProfile.

Dodaj brakujące klucze jeśli trzeba:
```
company.marketCap: "Kapitalizacja" / "Market Cap"
company.description: "O spółce" / "About Company"  
```

#### E3. `StockPage.jsx` — `stock.about` tab label

Tab "about" w tablicy TABS ma hardcoded `pl: 'O spółce', en: 'About'`. To OK (inne taby też mają hardcoded), ale sprawdź spójność.

## Ważne zasady

- BEZ nowych zależności npm
- Porównywarka używa wyłącznie danych z `wig20.js` (statycznych + overlaid przez useStockData) — NIE fetchuje Yahoo/manual financials
- Tabela porównawcza musi być responsywna — na mobile scrollowalna horyzontalnie
- Kolorowanie "najlepszej wartości" — subtelne, nie przytłaczające
- Selecty spółek: dostępne (aria-label), sortowane, bez duplikatów
- Guard'y w D1-D5: minimalne, defensywne, nie zmieniające logiki — tylko zapobiegające crash'om
- Nie psuj istniejącej funkcjonalności — to są poprawki addytywne
- `GitCompareArrows` może nie istnieć w danej wersji lucide-react — jeśli build się wysypie, zamień na `ArrowLeftRight` albo `BarChart3`
- Dodaj `<Helmet>` z meta title/description do ComparePage
