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

**U6 — Yahoo oddaje dziś tylko przychód i zysk netto.** Wyszło przy pierwszym imporcie (D4).
W module `balanceSheetHistory` są wyłącznie `date` i `maxAge`, w `cashflowStatementHistory` sam
`netIncome`, a w rachunku wyników realne są tylko `totalRevenue` i `netIncome` — `costOfRevenue`,
`grossProfit`, `totalOperatingExpenses`, `ebit` i `incomeTaxExpense` przychodzą jako **0**.
Sprawdzone na czterech spółkach z różnych branż: PKO (bank, przychód 29,5 mld, `costOfRevenue: 0`),
CDR (zysk 595 mln, `ebit: 0`), PKN, DNP — wszędzie tak samo.
Skutki: (1) baza po imporcie ma przychód i zysk, i nic więcej; (2) wskaźniki wymagające bilansu
(ROE, P/B, dług/kapitał, płynność) nie mają na poziomie 1 z czego się policzyć i lecą z zaszytych
`ratios`; (3) `isBank()` w `ratioCalculator` rozpoznaje bank po `grossProfit == null`, a dostaje 0,
więc dla poziomu 1 **żadna spółka nie jest rozpoznawana jako bank**.
Importer zer nie zapisuje — w bazie `0` znaczyłoby „zero złotych", a to nieprawda.
Od D4a to samo robi `normalizeFinancials` (lista `YAHOO_ZERO_MEANS_MISSING`), więc strona pokazuje
kreskę zamiast wyzerowanej pozycji, a rozpoznanie banku poszło na sektor ze `src/data/wig20.js`
(`isBankSector`) — stara heurystyka „brak marży brutto = bank" po zmianie uznawałaby za bank
każdą spółkę.

**U7 — EBP wskazywał na martwy symbol.** `TICKER_TO_YAHOO` mapował Erste Bank Polska na `SPL.WA`
(dawny Santander). Yahoo nie zna tego symbolu ani w cenach (`price: null, source: "error"`),
ani w sprawozdaniach (`source: "unavailable"`), więc spółka od dawna leciała po cichu na dane
zaszyte z 2024 r. Naprawione w D4: `EBP.WA` — cena wraca, sprawozdania FY2022–FY2025 też.

## Co z tego wynika dla D2

Wybierany dostawca musi domknąć dwie luki, których U3 nie tyka: **pokrycie 24 spółek GPW** (U2)
i **dane na tyle świeże, żeby poziom 3 przestał być realnym źródłem** (U4). Punktem odniesienia
przy porównaniu jest dzisiejsze Yahoo po poprawce z D1a: 4 roczniki i 4 kwartały na spółkę,
z kompletnymi etykietami okresów.

---

# D2 — skąd brać dane i gdzie je trzymać

Decyzja z **2026-09-20**. To są dwa osobne pytania i warto je rozdzielić:
**gdzie dane mieszkają** (baza) i **czym ją karmimy** (dostawca). Cel: własna baza wyników
finansowych spółek, z której korzysta strona — zamiast wpisywania liczb ręcznie do plików.

## Porównanie dostawców

| Źródło | Pokrycie GPW | Limity | Cena | Uwagi |
|---|---|---|---|---|
| **Yahoo `v10/quoteSummary`** (używane dziś) | działa dla WIG20 — sprawdzone dla PKO, CDR, KGH, ZAB | brak oficjalnych; wymaga crumb + cookie, 401 przy wygaśnięciu | **0 zł** | 4 roczniki + 4 kwartały wstecz. Kształt odpowiedzi potrafi się zmienić bez zapowiedzi (U3 to dokładnie taki przypadek). Brak SLA i brak umowy — to nieoficjalne API. Pola bankowe (`deposits`, `loans`, `netInterestIncome`) często puste |
| **EODHD — Fundamentals Data Feed** | giełda WAR wspierana, 612 aktywnych tickerów; `PKO.WAR` ma dane (Net Revenue 29 138 mln zgadza się z tym, co zwraca Yahoo) | 100 000 zapytań/dobę, 1000/min | **59,99 USD/mc** (~220 zł). Fundamenty spoza USA zaczynają się dopiero od tego planu; plan darmowy to 20 zapytań/dobę i tylko USA | Historia od 2000 r. Tańszy plan EOD (19,99 USD) daje tylko ceny, bez sprawozdań |
| **Financial Modeling Prep** | globalne pokrycie dopiero w planie Ultimate; Premium obejmuje USA, UK i Kanadę — GPW poza zasięgiem tańszych planów | darmowy plan 250 zapytań/dobę | nie udało się potwierdzić (strona cennika odrzuca automaty — HTTP 403) | Odpada już na kryterium pokrycia, bez wchodzenia w cenę |
| **Raporty okresowe (ESPI, strony spółek)** | 100%, dane u samego źródła | — | **0 zł** | Jedyne źródło w pełni zgodne z tym, co spółka faktycznie raportuje. Koszt to praca: 24 spółki × 4 raporty ≈ 96 wpisów rocznie, każdy do przepisania ręcznie |

## Decyzja

1. **Dane mieszkają w Supabase**, w tabeli `financials` — to jest ta „wielka baza".
2. **Karmimy ją z Yahoo** (0 zł) plus ręczne poprawki tam, gdzie Yahoo kłamie albo milczy.
   Płatny dostawca wchodzi dopiero, gdy Yahoo przestanie wystarczać.
3. **Strona nie czyta z Supabase na żywo.** Bot eksportuje bazę do
   `public/data/financials/{companyId}/data.json`, czyli dokładnie na **poziom 2**, który już
   jest w kodzie i czeka pusty od początku (U1).

## Dlaczego tak

- **Baza daje historię, której dostawca nie da.** Yahoo pokazuje 4 ostatnie roczniki i tyle.
  Jeśli co kwartał zapiszemy to, co widzimy, po trzech latach mamy 7 roczników — bez płacenia.
  Tego argumentu nie da się kupić później: historii, której się nie zbierało, nie da się odtworzyć.
- **Ręczne wpisy i import nie gryzą się.** Kolumna `source` mówi, skąd wiersz pochodzi, a flaga
  `verified` chroni go przed nadpisaniem: importer aktualizuje tylko to, czego człowiek nie tknął.
  Dzięki temu ręczne wpisywanie danych, od którego chciałeś zacząć, nie idzie do kosza — staje się
  najwyższą warstwą wiarygodności, a nie jedyną metodą.
- **Statyczny eksport zostawia stronę bez zależności runtime.** Supabase może paść, wyczerpać
  darmowy limit albo uśpić projekt — dane i tak się pokażą, z CDN Cloudflare, za darmo.
- **Zero zmian w kliencie.** `useFinancials` czyta poziom 2 w formacie kanonicznym od samego
  początku. Nie trzeba nowego endpointu ani przepinania UI — wystarczy, że katalogi przestaną
  być puste.
- **60 USD/mc za 24 spółki to ~3000 zł rocznie** na serwisie, który jest darmowy. Yahoo + własna
  baza kosztują 0 zł i dają ten sam efekt, dopóki nie wejdziemy na 400 spółek.

## Kiedy wrócić do płatnego dostawcy

Wyzwalacze, nie terminy:

- rozszerzenie poza WIG20 (mWIG40, sWIG80) — ręcznej korekty 400 spółek nikt nie udźwignie;
- Yahoo znów zmieni kształt odpowiedzi albo zacznie blokować crumb na poważnie;
- potrzeba danych sprzed 2022 r. do wykresów wieloletnich.

Wtedy wchodzi **EODHD Fundamentals (59,99 USD/mc)** — jako **drugi importer do tej samej tabeli**,
a nie jako przebudowa aplikacji. To jest główna korzyść z trzymania bazy u siebie: zmiana dostawcy
to podmiana skryptu, nie migracja.

## Schemat tabeli (wejście do D3)

```sql
create table public.financials (
  id            bigint generated always as identity primary key,
  company_id    text not null,          -- 'pkobp', zgodne z src/data/wig20.js
  period_type   text not null check (period_type in ('annual', 'quarterly')),
  period_end    date not null,          -- 2025-12-31
  period_label  text not null,          -- 'FY2025' albo 'Q4 2025'
  income        jsonb not null default '{}'::jsonb,
  balance       jsonb not null default '{}'::jsonb,
  cash_flow     jsonb not null default '{}'::jsonb,
  currency      text not null default 'PLN',
  source        text not null,          -- 'yahoo' | 'manual' | 'eodhd'
  verified      boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique (company_id, period_type, period_end)
);
```

Dwie decyzje warte wyjaśnienia:

- **`jsonb` zamiast 40 kolumn.** Zestaw pól już jest opisany w `src/data/financialSchema.js`
  i różni się dla banków (`deposits`, `loans`) i dla reszty (`grossProfit`, `ebitda`). Trzymanie
  go w `jsonb` oznacza, że dodanie pola to zmiana w jednym pliku JS, a nie migracja bazy.
  Cena: baza nie sprawdzi typów za nas — robi to `normalizeFinancials()` przy odczycie.
- **`unique (company_id, period_type, period_end)`** daje `upsert` za darmo: importer wrzuca
  ten sam okres ile razy chce i nie robi duplikatów.

RLS: publiczny `select` (dane i tak lądują w statycznym pliku), `insert`/`update` tylko dla konta
admina — ten sam identyfikator co `ADMIN_ID` w `src/pages/AdminDividendsPage.jsx`.

## Stan po D3 (2026-09-20)

Migracja leży w [`supabase/migrations/20260920120000_financials.sql`](../supabase/migrations/20260920120000_financials.sql)
i jest zastosowana na projekcie `StockView` (region `eu-west-1`). Sprawdzone na działającej bazie:

- `upsert` na ten sam okres nie robi duplikatu (dwa przebiegi → 1 wiersz, nowa wartość);
- trigger `financials_touch_updated_at` podbija `updated_at` przy zmianie w osobnej transakcji;
- `anon` czyta tabelę, `anon` nie może do niej pisać (`42501`);
- doradca bezpieczeństwa nie ma uwag do RLS (jedyny wpis dotyczy wyłączonej ochrony przed
  wyciekłymi hasłami w Auth — do włączenia w panelu, niezwiązane z tą tabelą).

Pozostałe tabele w `public`: **`dividends`** (17 wierszy, kalendarz dywidend) i **`watchlist`**
(2 wiersze). Obie mają włączone RLS i działają — `dividends` czyta się bez logowania,
`watchlist` zwraca tylko wiersze zalogowanego użytkownika.

**Pułapka przy odmrażaniu projektu.** Darmowy projekt zasypia po tygodniu bez ruchu; zastaliśmy go
uśpionego. `restore` wraca etapami: przez kilka minut baza odpowiada, ale jest to stan przejściowy
z pustym schematem `public`, a zapisy zrobione w tym czasie znikają w chwili podmiany na właściwy
snapshot. Pierwsze podejście do tej migracji poszło właśnie tam i wyparowało. **Po odmrożeniu
projektu trzeba najpierw sprawdzić, czy widać znane tabele** (`dividends`, `watchlist`), a dopiero
potem cokolwiek zapisywać.

## Stan po D4 (2026-09-20)

W tabeli jest **189 wierszy z 24 spółek**: 93 roczne i 96 kwartalnych, okresy od `2022-09-30`
do `2026-07-31` (ZAB ma jeden rocznik — krótko po debiucie). Wszystkie mają przychód, 184 mają
zysk netto, **żaden nie ma bilansu ani przepływów** — z powodu U6, nie z powodu importera.

Sprawdzone: drugi przebieg nie tworzy duplikatów (189 → 189, zero powtórzonych kluczy),
a wiersz oznaczony `verified = true` przechodzi przebieg nietknięty (`updated_at` bez zmian,
pozostałe wiersze odświeżone).

**Co z tego wynika dla decyzji z D2.** Założenie „Yahoo wystarczy, płatny dostawca później"
trzyma się wyłącznie dla przychodu i zysku netto. Bilans i przepływy trzeba wziąć skądinąd:
albo z EODHD (59,99 USD/mc), albo wpisać ręcznie przez panel z D6 — czyli dokładnie tak, jak
planowałeś na początku, tyle że raz, do bazy, zamiast w kółko do plików.

## Stan po D5 (2026-09-20)

`scripts/export-financials.mjs` przepisuje tabelę do `public/data/financials/{companyId}/data.json`
(24 pliki, 108 kB) w formacie kanonicznym — czyli na **poziom 2**, który `useFinancials` czyta
od początku. Po stronie klienta nie trzeba było zmieniać ani linijki.

Sprawdzone na serwerze dev, gdzie `/api/*` nie istnieje: PKO, CDR i ZAB schodzą na
`source: 'manual'` z okresami FY2025–FY2022 i przychodem zgodnym z bazą — zamiast lądować
na zaszytych danych z 2024 r. Eksport czyta przez klucz publiczny (`anon`), bo tabela ma
politykę publicznego odczytu; sekret jest potrzebny wyłącznie do importu.

**Pliki w `public/data/financials/` są generowane** — ręczna edycja przepada przy najbliższym
przebiegu bota. Poprawki wprowadza się w bazie i oznacza `verified = true`.

### Sekrety, których potrzebuje bot

`.github/workflows/update-prices.yml` robi teraz: ceny → import do Supabase → eksport na poziom 2
→ commit. W ustawieniach repozytorium (Settings → Secrets and variables → Actions) muszą być:

| Sekret | Do czego | Jeśli go nie ma |
|---|---|---|
| `SUPABASE_URL` | import i eksport | oba kroki się nie wykonają |
| `SUPABASE_SERVICE_ROLE_KEY` | import (omija RLS) | import pominięty, eksport i ceny działają |
| `SUPABASE_ANON_KEY` | eksport (klucz publiczny) | eksport pominięty |

Kroki są warunkowe, więc brak sekretu pomija krok, a nie wywala całego przebiegu.

## Stan po D6 (2026-09-20)

`/admin/financials` (gated na to samo konto co `/admin/dividends`) pozwala wybrać spółkę,
typ okresu i konkretny okres, a potem wpisać wartości w trzech sekcjach: rachunek wyników,
bilans, przepływy. Pozycje bankowe (`deposits`, `loans`, wynik odsetkowy i prowizyjny)
pokazują się tylko dla sektorów `banking` i `insurance` — panel pyta o to `isBankSector()`,
tę samą funkcję, której używa kalkulator wskaźników.

Zapis ustawia `source = 'manual'` i domyślnie `verified = true`, więc importer omija ten okres.
Puste pole nie trafia do bazy — `null` znaczy „brak danych", zero znaczyłoby „zero złotych".
Lista pól pochodzi z `CANONICAL_FIELDS` w `financialSchema.js`, żeby formularz nie rozjechał się
ze schematem.

Sprawdzony przepływ: wiersz zapisany jak z panelu (`source: manual`, `verified: true`, uzupełniony
bilans) → `npm run import-financials` (188 zapisanych, **1 pominięty jako verified**, wartość
nietknięta) → `npm run export-financials` → plik `public/data/financials/pkobp/data.json`
z bilansem i `sources: ["manual", "yahoo"]`. Czyli ręczna poprawka dochodzi do strony
i przeżywa bota.

Dwie rzeczy do zapamiętania na D7:

- **Importer nie może używać klucza `anon`** — RLS go zablokuje. Skrypt w GitHub Actions
  będzie potrzebował klucza `service_role` w sekrecie repozytorium (nigdy w repo, nigdy w `.env`
  commitowanym do gita).
- **Projekt Supabase na darmowym planie zasypia** po tygodniu bez ruchu, a wtedy logowanie,
  watchlist i dywidendy na produkcji nie działają. Codzienny przebieg importera przy okazji
  utrzyma projekt przy życiu — to argument za codzienną częstotliwością, nie kwartalną.
