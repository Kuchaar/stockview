# DATA.md — skąd StockView bierze dane

Audyt źródeł z **2026-09-20** (zadanie D1 z [ROADMAP.md](ROADMAP.md), Bramka 1).
Opisuje stan faktyczny, nie docelowy. Po zmianie dostawcy (D2–D4) ten plik trzeba zaktualizować.

## Zasada trzech poziomów

Każdy blok danych ma ten sam wzorzec: **API na żywo → plik statyczny w repo → wartość zaszyta
w kodzie**. Niższy poziom włącza się dopiero, gdy wyższy zawiedzie, a aplikacja nigdy nie zostaje
bez kompletnego obiektu spółki.

```
poziom 1  /api/*            Cloudflare Pages Function → Yahoo Finance (fallback Stooq)
poziom 2  public/data/*     pliki JSON w repo, commitowane przez bota lub ręcznie
poziom 3  src/data/wig20.js wartości wpisane ręcznie, aktualizowane tylko przez człowieka
```

## Tabela: pole → źródło → częstotliwość → kto aktualizuje

### Ceny bieżące (`useLatestPrices` → `useStockData`)

| Pole | Źródło | Częstotliwość | Kto aktualizuje |
|---|---|---|---|
| `price`, `change`, `changePercent`, `volume` | 1. `/api/quote` → Yahoo `v8/finance/chart` (mirrory `query1`/`query2`), per symbol fallback na CSV ze Stooq | co 60 s w przeglądarce, cache na krawędzi 90 s, `sessionStorage` 60 s, timeout 5 s | automat |
| to samo, gdy API padnie | 2. `public/data/latest-prices.json` | dni robocze 18:00 UTC | bot `update-prices.yml` |
| to samo, gdy i to padnie | 3. `price`/`change`/`changePercent`/`volume` w `src/data/wig20.js` | nigdy — wartości z przełomu 2024/2025 | człowiek |
| `lastUpdated`, baner o źródle | `source` z `useLatestPrices` (`'live'` / `'static'`) | przy każdym pobraniu | automat |

### Historia OHLCV (`useHistoricalPrices`, `useHistoricalData`, `StockChart`)

| Pole | Źródło | Częstotliwość | Kto aktualizuje |
|---|---|---|---|
| `date`, `open`, `high`, `low`, `close`, `volume` (ok. 1250 sesji = 5 lat) | `public/data/history/{ticker małymi literami}.json`, generowane przez `scripts/fetch-stooq.mjs` (mimo nazwy pobiera z Yahoo `v8/chart?range=5y`) | dni robocze 18:00 UTC, cache w `sessionStorage` 1 h | bot `update-prices.yml` |
| wskaźniki techniczne (SMA, EMA, RSI, MACD, Bollinger) | liczone lokalnie w `src/utils/technicalIndicators.js` z powyższych świec | przy każdym renderze | — (kod) |

**Brak fallbacku.** 404 daje pustą tablicę i pusty wykres — patrz ustalenie **U2**.

### Sprawozdania finansowe (`useFinancials` → `normalizeFinancials`)

| Pole | Źródło | Częstotliwość | Kto aktualizuje |
|---|---|---|---|
| rachunek wyników: `revenue`, `costOfRevenue`, `grossProfit`, `operatingExpenses`, `operatingIncome`, `ebitda`, `interestExpense`, `netIncome`, `eps` + bankowe `netInterestIncome`, `netFeeIncome`, `provisionForCreditLosses` | 1. `/api/financials` → Yahoo `v10/quoteSummary` (crumb + cookie), `source: 'yahoo'` | kwartalnie u źródła; cache odpowiedzi na krawędzi 1 h, crumb 30 min, `sessionStorage` 1 h | automat |
| bilans: `totalAssets`, `currentAssets`, `cash`, `totalLiabilities`, `currentLiabilities`, `longTermDebt`, `totalDebt`, `totalEquity`, `bookValuePerShare` + bankowe `deposits`, `loans` | jw. | jw. | automat |
| przepływy: `operatingCashFlow`, `capitalExpenditure`, `freeCashFlow`, `investingCashFlow`, `financingCashFlow`, `dividendsPaid` | jw. | jw. | automat |
| te same pola, gdy Yahoo zwróci `source: 'unavailable'` | 2. `public/data/financials/{companyId}/data.json`, `source: 'manual'` — format już kanoniczny, wzór w `TEMPLATE.json` | ręcznie, po publikacji raportu | człowiek |
| te same pola, ostatnia linia obrony | 3. `financials` w `src/data/wig20.js`, `source: 'hardcoded'` — **wartości w mln PLN**, `normalizeFinancials` mnoży ×1 000 000; tylko roczne `revenue`/`netIncome`/`ebitda`/`operatingIncome`/`totalAssets`/`totalDebt`/`equity`/`freeCashFlow` + kwartalne `revenue`/`netIncome` | nigdy — kolumny kończą się na „2024E" | człowiek |

Poziom 3 celowo **nie trafia do cache'u**, żeby przy następnym wejściu znowu spróbować poziomów 1–2.

### Wskaźniki (`ratios`, `keyStats`)

| Pole | Źródło | Częstotliwość | Kto aktualizuje |
|---|---|---|---|
| wskaźniki pokazywane na stronie spółki (rentowność, wycena, zadłużenie, płynność, dywidenda, wzrost) | liczone lokalnie: `calculateAllRatios(liveFinancials, stock.price, stock.sharesOutstanding)` w `src/data/ratioCalculator.js` — sprawozdania z poziomu 1–3 **plus cena z `/api/quote`** | przy każdym wejściu na zakładkę | — (kod) |
| `keyStats`: `pe`, `forwardPe`, `pb`, `evEbitda`, `roe`, `roa`, `currentRatio`, `quickRatio`, `debtToEquity`, `dividendYield`, `eps`, `bookValue`, marże, `marketCap`, `totalRevenue`, `revenueGrowth` | `extractKeyStats()` w `functions/api/financials.js` z modułów `defaultKeyStatistics` + `financialData` | jw. | automat |
| `ratios` używane przez listę, screener, porównywarkę i `calculateHealthScore` | `ratios` w `src/data/wig20.js` (wartości zaszyte) | nigdy | człowiek |

Uwaga: **lista spółek, screener i porównywarka nie widzą danych z Yahoo** — korzystają z `ratios`
zaszytych w `wig20.js`. Tylko strona spółki liczy wskaźniki ze świeżych sprawozdań.

### Profil i metadane spółki

| Pole | Źródło | Częstotliwość | Kto aktualizuje |
|---|---|---|---|
| `id`, `ticker`, `tvSymbol`, `yahooSymbol`, `name`, `shortName`, `sector`, `logo` (emoji) | `src/data/wig20.js` | przy zmianie składu WIG20 | człowiek |
| `profile`: opis PL/EN, `founded`, `ipoYear`, `employees`, `ceo`, `headquarters`, `website`, `isin` | `src/data/wig20.js` | nigdy automatycznie | człowiek |
| `sharesOutstanding`, `marketCap` (w mln PLN) | `src/data/wig20.js` — `sharesOutstanding` wchodzi do **każdego** wskaźnika na akcję | nigdy automatycznie | człowiek |
| `TICKER_TO_YAHOO` (24 pozycje) | `src/data/wig20.js` | przy zmianie składu WIG20 | człowiek |

### Dywidendy i dane użytkownika

| Pole | Źródło | Częstotliwość | Kto aktualizuje |
|---|---|---|---|
| kalendarz dywidend (`ticker`, `dividend_per_share`, `dividend_yield`, `ex_date`, `payment_date`, `status`, `year`, `note`) | tabela `dividends` w Supabase, CRUD przez `/admin/dividends` | ręcznie, gdy spółka ogłosi dywidendę | człowiek (konto admina) |
| obserwowane spółki | tabela `watchlist` w Supabase, per użytkownik | na bieżąco | użytkownik |

Bez `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` `src/lib/supabase.js` eksportuje `null`
i oba bloki po prostu znikają — reszta aplikacji działa.

## Ustalenia audytu

**U1 — poziom 2 nie istnieje w praktyce.** Wszystkie 24 katalogi `public/data/financials/*`
zawierają wyłącznie `.gitkeep`; nie ma ani jednego `data.json`. Gdy Yahoo zwróci
`source: 'unavailable'`, aplikacja **spada od razu na poziom 3**, czyli na liczby z przełomu
2024/2025 z kolumną prognozy „2024E". Środkowy poziom jest zaimplementowany i przetestowany,
ale pusty.

**U2 — 5 spółek bez historii cen.** `STOCKS` w `scripts/fetch-stooq.mjs` ma 19 pozycji, a WIG20
liczy 24. Bez pliku w `public/data/history/` zostają: **ALE, BDX, EBP, TPE, ZAB** — na ich
stronach wykres jest pusty (404 → `[]`, bez komunikatu). Dodatkowo leży tam osierocony
`ccc.json` — CCC nie ma już w `TICKER_TO_YAHOO`.

**U3 — sprawozdania z poziomu 1 nie miały dat.** ✅ **naprawione 2026-09-20 (D1a).**
Yahoo zwraca `endDate` raz jako `{ raw, fmt }`, raz jako samą liczbę unix; `transformStatements()`
łapało to wcześniejszą gałęzią `'raw' in val`, więc `date` i `period` były `null` w każdym wierszu.
Konsekwencja była poważniejsza niż puste etykiety: `latest()` w `src/data/ratioCalculator.js`
przy samych `null`-ach zwracało **ostatni** element tablicy, a Yahoo sortuje od najnowszego —
więc wskaźniki liczyły się z **najstarszego** rocznika (dla PKO: przychód 16,8 mld z 2022 zamiast
29,5 mld z 2025) i były zestawiane z dzisiejszą ceną.
Teraz `endDate` idzie przez `toIsoDate()` przed gałęzią `raw`, a `latest()` przy braku dat
zostaje przy pierwszym wierszu zamiast brać ostatni.

**U4 — dane awaryjne cicho się starzeją.** Nagłówek `wig20.js` mówi wprost: „Financial data
approximate as of late 2024 / early 2025". To jednocześnie ostatnia linia obrony dla cen,
sprawozdań i wszystkich `ratios` na liście, w screenerze i w porównywarce. Nic nie przypomina
o odświeżeniu i nic tego nie waliduje.

**U5 — dwie jednostki obok siebie.** `marketCap` w `wig20.js` jest w mln PLN, a w `keyStats`
z Yahoo w PLN; `financials` w `wig20.js` są w mln, kanoniczny format — w PLN. Dziś pilnuje tego
`normalizeFinancials`, ale przy nowym dostawcy to pierwsze miejsce, gdzie łatwo o błąd rzędu 10⁶.

## Co z tego wynika dla D2

Wybierany dostawca musi domknąć dwie luki, których U3 nie tyka: **pokrycie 24 spółek GPW** (U2)
i **dane na tyle świeże, żeby poziom 3 przestał być realnym źródłem** (U4). Punktem odniesienia
przy porównaniu jest dzisiejsze Yahoo po poprawce z D1a: 4 roczniki i 4 kwartały na spółkę,
z kompletnymi etykietami okresów.
