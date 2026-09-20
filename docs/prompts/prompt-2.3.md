# Prompt 2.3 — Własny wykres SVG + uzupełnienie składu WIG20

## Kontekst

StockView — React 18 + Vite + Tailwind CSS (class-based dark mode `.dark`).

Dane OHLCV w `public/data/history/{ticker_lowercase}.json` — format:
```json
{"ticker":"PKO","yahooSymbol":"PKO.WA","lastUpdated":"2026-04-29","count":1251,
 "data":[{"date":"2021-04-28","open":32.95,"high":33.72,"low":32.87,"close":33.51,"volume":2668363}, ...]}
```
~1250 dni handlowych (5 lat). Pliki istnieją dla tickerów: pko, pkn, kgh, pzu, peo, cdr, mod, dnp, lpp, cps, mbk, jsw, pge, kru, pco, acp, opl, alr, kty, ccc.

Spółki w `src/data/wig20.js` — tablica obiektów z polami: id, ticker, tvSymbol, yahooSymbol, name, shortName, sector, logo, price, change, changePercent, volume, marketCap, sharesOutstanding, financials (annual + quarterly), ratios. Aktualnie 19 spółek — brakuje 5 z obecnego składu WIG20.

Wykresy TradingView (`src/components/TradingViewChart.jsx`) zostają bez zmian — nasz wykres będzie DODATKOWY.

Tłumaczenia: `useLang()` zwraca `{ t, lang }`, `lang` = 'pl' | 'en'.
Motyw: `useTheme()` zwraca `{ dark }`. Tailwind dark mode via class `.dark` na `<html>`.

## Zadania

### A. Dodaj 5 brakujących spółek WIG20 do `src/data/wig20.js`

Dodaj na koniec tablicy `wig20Companies` poniższe 5 obiektów. Dla każdego uzupełnij pola `financials` i `ratios` w tym samym formacie co istniejące spółki — wartości finansowe mogą być null (Yahoo i manual JSON uzupełnią je później). Cenę `price` oblicz jako `marketCap * 1_000_000 / sharesOutstanding`, `change` i `changePercent` ustaw na 0.

1. **Allegro** — id: `'allegro'`, ticker: `'ALE'`, tvSymbol: `'GPW:ALE'`, yahooSymbol: `'ALE.WA'`, name: `'Allegro.eu S.A.'`, shortName: `'Allegro'`, sector: `'retail'`, logo: `'🛒'`, sharesOutstanding: `1_056_905_000`, marketCap: `31900`, volume: `3200000`
2. **Budimex** — id: `'budimex'`, ticker: `'BDX'`, tvSymbol: `'GPW:BDX'`, yahooSymbol: `'BDX.WA'`, name: `'Budimex S.A.'`, shortName: `'Budimex'`, sector: `'construction'`, logo: `'🏗️'`, sharesOutstanding: `25_530_098`, marketCap: `17000`, volume: `120000`
3. **Erste Bank Polska** — id: `'erste'`, ticker: `'EBP'`, tvSymbol: `'GPW:EBP'`, yahooSymbol: `'SPL.WA'`, name: `'Erste Bank Polska S.A.'`, shortName: `'Erste'`, sector: `'banking'`, logo: `'🏦'`, sharesOutstanding: `102_189_314`, marketCap: `63800`, volume: `350000`
4. **Tauron** — id: `'tauron'`, ticker: `'TPE'`, tvSymbol: `'GPW:TPE'`, yahooSymbol: `'TPE.WA'`, name: `'TAURON Polska Energia S.A.'`, shortName: `'Tauron'`, sector: `'energy'`, logo: `'⚡'`, sharesOutstanding: `1_752_549_394`, marketCap: `16300`, volume: `8500000`
5. **Żabka** — id: `'zabka'`, ticker: `'ZAB'`, tvSymbol: `'GPW:ZAB'`, yahooSymbol: `'ZAB.WA'`, name: `'Żabka Group S.A.'`, shortName: `'Żabka'`, sector: `'retail'`, logo: `'🐸'`, sharesOutstanding: `1_000_000_000`, marketCap: `23500`, volume: `2800000`

Dodaj `'construction'` do obiektu `sectors` w wig20.js:
```js
construction: { pl: 'Budownictwo', en: 'Construction' },
```

### B. Nowy hook: `src/hooks/useHistoricalPrices.js`

```js
export default function useHistoricalPrices(ticker)
```

- Argument `ticker` (string, np. `'PKO'`) — może być `null` (wtedy nie fetchuj, zwróć `data: []`).
- Fetch z `/data/history/${ticker.toLowerCase()}.json`.
- Cache w `sessionStorage` z kluczem `sv_ohlcv_v1_${ticker}` i TTL = 1h.
- Zwracaj `{ data, loading, error, lastUpdated }` gdzie `data` to tablica `[{date, open, high, low, close, volume}]`.
- Obsłuż 404 (nowy ticker bez pliku historii) gracefully — zwróć `data: []`, `error: null`.
- Hooksy wywoływane BEZWARUNKOWO (Rules of Hooks) — guardy wewnątrz useEffect.

### C. Nowy komponent: `src/components/StockChart.jsx`

Czysty SVG wykres rysowany w React — BEZ zewnętrznych bibliotek wykresowych (zero nowych zależności npm).

**Props:**
```js
{ ticker, className }
```
Wewnątrz używa `useHistoricalPrices(ticker)`, `useLang()`, `useTheme()`.

Komponent owinięty w `React.memo`.

#### C1. Tryby wykresu — toggle button group na górze:
- `line` — wykres liniowy (close prices), gradient fill pod linią
- `candle` — wykres świecowy (OHLC), zielone/czerwone świece

#### C2. Zakresy czasowe — pill buttons: 1M, 3M, 6M, 1Y, 3Y, MAX
- Filtruj tablicę `data` po dacie (porównanie stringów YYYY-MM-DD). Domyślny zakres: **1Y**.

#### C3. SVG layout:
- `viewBox="0 0 800 450"`, `width="100%"`, `preserveAspectRatio="xMidYMid meet"`
- Obszar wykresu cenowego: x=60..790, y=10..330 (lewy margines na oś Y, prawy 10px, góra 10px)
- Obszar wolumenu: x=60..790, y=350..430
- Oś X labels: y=440

#### C4. Oś Y (ceny):
- 5–7 poziomych linii siatki, równo rozłożonych między min a max ceny
- Wartości po lewej stronie, format: `price.toFixed(2)`
- Siatka: `strokeDasharray="4 4"`, kolor `dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'`

#### C5. Oś X (daty):
- Etykiety co ~100px, format zależny od zakresu:
  - 1M/3M: `"dd.MM"` (np. "15.04")
  - 6M/1Y: `"MMM yy"` (np. "Sty 25" / "Jan 25")
  - 3Y/MAX: `"yyyy"`
- Tekst: `fontSize="10"`, `fill` = `dark ? '#6b7280' : '#9ca3af'`

#### C6. Tryb liniowy:
- `<path>` z punktami (x, y) z close prices
- `stroke="#22c55e"`, `strokeWidth="1.5"`, `fill="none"`
- Osobny `<path>` z `<linearGradient>` fill pod linią: zielony 20% opacity → transparent na dole

#### C7. Tryb świecowy:
- Każda świeca: `<rect>` (body open↔close) + `<line>` (wick high↔low)
- Zielona (close >= open): fill `#22c55e`, stroke `#22c55e`
- Czerwona (close < open): fill `#ef4444`, stroke `#ef4444`
- Szerokość świecy: `Math.max(1, Math.min(8, (chartWidth / dataLength) - 1))`

#### C8. Wolumen:
- Słupki `<rect>` w strefie y=350..430
- Kolor: close >= open → `rgba(34,197,94,0.3)` / close < open → `rgba(239,68,68,0.3)`
- Wysokość proporcjonalna do max(volume) w widocznym zakresie

#### C9. Crosshair + Tooltip:
- Wrapper `<div style="position:relative">` wokół SVG
- Na `onMouseMove` na wrapping div: oblicz pozycję X, znajdź najbliższy dzień w data
- Narysuj pionową linię przerywaną w SVG (przelicz z mouse X na viewBox X)
- Tooltip jako `<div>` (HTML, NIE SVG) pozycjonowany absolute przy kursorze:
  - Zawartość: Data, O, H, L, C, Vol — z odpowiednimi labelkami z t()
  - Style: `bg-surface-900/95 dark:bg-surface-100/95 text-white dark:text-surface-900 text-xs rounded-lg shadow-xl px-3 py-2 pointer-events-none z-50`
- Na `onMouseLeave`: ukryj crosshair i tooltip
- Na mobile: `onTouchMove` działa jak mouseMove, `onTouchEnd` ukrywa

#### C10. Stany edge-case:
- **Loading**: pulsujący prostokąt skeleton (Tailwind `animate-pulse bg-surface-200 dark:bg-surface-800 rounded-xl`, pełna wysokość)
- **Brak danych** (`data.length === 0`): komunikat `t('chart.noData')`
- **Error**: komunikat + przycisk `t('chart.retry')` wywołujący refetch

### D. Integracja w `src/pages/StockPage.jsx`

W tab `chart`:

1. Dodaj toggle nad wykresami: **"StockView"** | **"TradingView"** — przechowuj w `useState('stockview')`.
2. Styl togglera: identyczny jak sub-tabs w zakładce financials (pill buttons z `bg-green-500/10` dla aktywnego).
3. Gdy `'stockview'`: renderuj `<StockChart ticker={stock.ticker} />`.
4. Gdy `'tradingview'`: renderuj istniejący `<TradingViewChart>` z obecną logiką lazy mount (chartEverVisited ref).
5. TradingView lazy mount: zmień logikę `chartEverVisited` tak żeby ustawiał się na true dopiero gdy user kliknie "TradingView" toggle (nie przy wejściu na tab chart).
6. NIE modyfikuj pliku `TradingViewChart.jsx`.

### E. Tłumaczenia w `src/data/translations.js`

Dodaj do obu języków (zachowaj istniejącą strukturę zagnieżdżoną):

```
chart.stockview: "StockView" / "StockView"
chart.tradingview: "TradingView" / "TradingView"
chart.line: "Liniowy" / "Line"
chart.candle: "Świecowy" / "Candlestick"
chart.noData: "Brak danych historycznych" / "No historical data available"
chart.retry: "Spróbuj ponownie" / "Try again"
chart.1m: "1M" / "1M"
chart.3m: "3M" / "3M"
chart.6m: "6M" / "6M"
chart.1y: "1R" / "1Y"
chart.3y: "3L" / "3Y"
chart.max: "MAX" / "MAX"
chart.open: "Otw." / "Open"
chart.high: "Max" / "High"
chart.low: "Min" / "Low"
chart.close: "Zamk." / "Close"
chart.volume: "Wolumen" / "Volume"
```

## Ważne zasady

- BEZ nowych zależności npm — czysty React + SVG + Tailwind
- Rules of Hooks: hooki wywoływane BEZWARUNKOWO, guardy wewnątrz useEffect/useMemo
- Nie modyfikuj `TradingViewChart.jsx`
- Filtrowanie daty: porównuj stringi `"YYYY-MM-DD"` (dane posortowane chronologicznie)
- Tailwind klasy do stylowania togglerów i przycisków, inline styles tylko w SVG
- Tooltip w HTML (nie SVG) — łatwiejsze pozycjonowanie i stylowanie
