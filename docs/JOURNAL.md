# Dziennik StockView

<!-- Najnowszy wpis na górze. Każdy wpis kończy się polem „Następne:". -->

## 2026-10-23 — D9: waluta dochodzi do ekranu, wskaźniki nie mieszają EUR z PLN

Komputer: `MacBook-Pro-Kamil.local`

**Gdzie kwoty Pepco spotykały cenę w złotych.** Przeszedłem wszystkie pięć miejsc, o które
pytał Kamil, zanim cokolwiek zmieniłem.

- **Zakładka Wycena** (`StockPage.jsx:78` → `calculateAllRatios(liveFinancials, stock.price,
  stock.sharesOutstanding)` → `MetricsPanel`) — **jedyne miejsce, gdzie mieszanie dzieje się
  na żywo.** Siedem wskaźników: `pe = cena(PLN)/eps(EUR)`, `pb = cena(PLN)/bvps(EUR)`,
  `ps = kapitalizacja(PLN)/przychód(EUR)`, `ev = kapitalizacja(PLN) + dług(EUR) − gotówka(EUR)`
  — **dodawanie dwóch walut** — `evEbitda`, `fcfYield = fcf(EUR)/kapitalizacja(PLN)`, `peg`
  (pochodna `pe`), plus awaryjna `dividendYield = |dywidendy(EUR)|/kapitalizacja(PLN)`.
  Rząd błędu to kurs EUR/PLN, czyli około ×4,3. Najjaskrawszy przykład: `bookValue` z Yahoo
  dla Pepco to **0,366 EUR**, więc `pb = 18,60/0,366 = 50,8` zamiast około 11,8.
- **Tabele kwot** — pięć miejsc z zaszytym „PLN": `FinancialTable.jsx:55` (Przegląd),
  `IncomeStatement.jsx:99`, `BalanceSheet.jsx:99`, `CashFlowStatement.jsx:98` (Sprawozdania)
  oraz `ValuationMetrics.jsx:11,12,54`, które doklejało „ PLN" do EPS i wartości księgowej.
  Żadne z nich **nie czytało** pola `currency`.
- **Ocena kondycji nie mieszała** — ale z innego powodu, niż zakładałem. Liczy ją
  `calculateHealthScore`/`calculateSubScores` z `wig20.js` na `stock.ratios`, czyli na
  **zaszytych** liczbach poziomu 3. Funkcja `calculateHealthScoreV2` w `ratioCalculator.js:262`,
  która brałaby `pe`, `pb` i `evEbitda` jako blok Wycena o wadze 20%, jest **martwym kodem** —
  `grep` po `src/` pokazuje tylko jej definicję. Gdyby ktoś ją podłączył przed tą poprawką,
  jedna piąta oceny Pepco liczyłaby się z dzielenia PLN przez EUR.
- **Screener i Porównywarka nie mieszają na żywo** — oba czytają `stock.ratios` (poziom 3).
  Ale te liczby dla Pepco są zaszyte i nieaktualne: `pe: 23.4`, `eps: 0.79`, `bookValue: 8.61`,
  a 18,60/0,79 = 23,5 i 18,60/8,61 = 2,16, więc ktoś policzył je ceną w złotych przez wartości
  na akcję nieznanego pochodzenia. Dzisiejsze dane mówią `eps: −0,306 EUR`, `bookValue: 0,366 EUR`.
  To nie mieszanie walut w kodzie, a stare ręczne liczby — osobny temat, już w roadmapie
  („koniec z poziomem 3").

**Naprawione.**

- **`financialSchema.js`** — jedno miejsce prawdy o walucie: `QUOTE_CURRENCY = 'PLN'`
  (tak notuje GPW i tak przychodzą ceny), `currencyOfRows`, `statementCurrency` i `amountUnit`.
  `amountUnit(null, lang)` daje **samo „mln"**, nie „mln PLN" — brak waluty nie może udawać
  złotówek, bo to był właśnie ten błąd. `toLegacyTable` przenosi walutę do zakładki Przegląd.
- **Osłona walutowa w `ratioCalculator.js`** — przy `statementCurrency !== QUOTE_CURRENCY`
  wszystkie siedem wskaźników mieszających idzie na `null`, a awaryjne wyliczenie stopy
  dywidendy się nie wykonuje. `forwardPe` zostaje: to gotowa liczba od Yahoo, my w niej nic
  nie mieszamy. Wskaźniki czysto ilorazowe (ROE, ROA, ROIC, marże, dług/kapitał, płynność,
  pokrycie odsetek, `payoutRatio`, wzrosty) **nie są ruszane** — dzielą walutę przez tę samą
  walutę, więc ona się skraca. Funkcja zwraca też `currencyInfo` dla UI.
- **`MetricsPanel`** — nota na zakładkach Wycena i Dywidenda, która mówi, czego brakuje
  i dlaczego. Bez niej użytkownik widzi same „—" i nie wie, czy to brak danych, czy awaria.
  Tekst przez `t()`, z wpisami `pl` i `en`.
- **Cztery tabele i `ValuationMetrics`** — nagłówek i sufiks biorą walutę z danych.
- **Eksport miał dwie przyczyny, nie jedną.** Oprócz `meta = { date, period }`, które gubiło
  `row.currency` (`export-financials.mjs:42`), **`select` w ogóle nie pobierał kolumny
  `currency`** (linia 78). Poprawienie tylko jednego nie dałoby nic — i po pierwszej poprawce
  pliki nadal miały `currency: None`, co złapał dopiero prawdziwy przebieg eksportu.

**Sprawdzone na żywo, oba poziomy danych.** Skryptem przez `normalizeFinancials`
+ `calculateAllRatios`, na prawdziwych odpowiedziach produkcji:

| | Pepco | PKO BP |
|---|---|---|
| `statementCurrency`, poziom 1 | **EUR** | **PLN** |
| `statementCurrency`, poziom 2 | **EUR** | **PLN** |
| nagłówek tabeli (pl / en) | „mln EUR" / „M EUR" | „mln PLN" / „M PLN" |
| `currencyInfo.mismatch` | **true** | **false** |
| `pe`, `pb`, `ps`, `evEbitda`, `peg`, `fcfYield` | wszystkie **null** | liczby (pe 8,42, ps 2,9) |
| ROE, marża netto, dług/kapitał | liczone normalnie | liczone normalnie |

Poziom 2 testowałem na plikach wygenerowanych **prawdziwym** eksportem lokalnie, a potem
przywróciłem `public/data/financials/` przez `git restore` — te pliki commituje bot, nie ja.
`npm run build` przechodzi, oba teksty noty (pl i en) są w zbudowanym bundlu.

**Czego nie sprawdziłem.** Strony w przeglądarce — nie otwierałem jej ani nie oglądałem noty
w obu motywach. Klasy mają jawne warianty `dark:`, a `warn` istnieje w `tailwind.config.js`,
ale to argument, nie dowód. Po merge'u trzeba puścić eksport, żeby pliki na produkcji dostały
`currency` — do tego czasu poziom 2 na produkcji nadal go nie ma.

**Do decyzji Kamila — przeliczanie kursem.** Zapisane w roadmapie, w „Po Bramce P".
Nic nie przeliczam, bo wybór kursu nie jest szczegółem technicznym: kurs z dnia wyceny,
kurs na koniec okresu i kurs średni okresu dają trzy różne C/Z, każdy obronny. Doszłoby
źródło kursów i to, że wskaźnik historyczny wymagałby kursu historycznego — inaczej ruch
na walucie udaje zmianę wyniku spółki.

Następne: po merge'u ręczny przebieg eksportu (żeby produkcja dostała `currency`), sprawdzenie
zakładki Wycena dla Pepco w przeglądarce w obu motywach, i odhaczenie D9 z SHA. Potem P1 —
własny SMTP. Import sprawozdań za III kwartał: początek grudnia.

## 2026-10-23 — P0, P12, P13 i F6 odhaczone; bilans i przepływy są na produkcji

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Sekrety:** `gh secret list` → **dokładnie dwa**, `SUPABASE_URL` i `SUPABASE_ANON_KEY`.
  Kamil usunął `SUPABASE_SERVICE_ROLE_KEY` z Actions po merge'u PR #5; żaden workflow go
  nie używa, żyje tylko w `.env.local` na laptopie.
- **Eksport na `main` przeszedł** — [run 40001596221](https://github.com/Kuchaar/stockview/actions/runs/40001596221), zielony: „Oba sekrety
  na miejscu", „Wierszy w bazie: 243, spółek: 24", „Plików zapisanych: 24", a potem commit bota
  [`388f32f`](https://github.com/Kuchaar/stockview/commit/388f32f) wprost na `main`
  (**+6845/−373** w 24 plikach). Pierwszy przebieg tego workflow, który cokolwiek zmienił.
- **Produkcja oddaje bilans i przepływy.** `https://stockview.org/data/financials/pkobp/data.json`
  → bilans 4 okresy roczne i 5 kwartalnych, przepływy 4/5, `sources: ['yahoo']`. Sprawdzone też
  `cdprojekt`, `pepco` i `zabka` — wszystkie mają oba sprawozdania. Przed dzisiejszym dniem
  **wszystkie 24 pliki miały zero bilansu i zero przepływów**.
- **P0, P12, P13 i F6 odhaczone** w `docs/ROADMAP.md`, każde z SHA i linkiem do przebiegu.
  Przy P12 i P13 dopisane „Jak sprawdzone", żeby odhaczenie dało się później zweryfikować
  bez wiary na słowo. SHA poprawki z recenzji PR #5: **`c477fe2`**.
- **F6 zamknięte z uzasadnieniem.** Decydujący nie jest PR #1 (powstał **razem** z regułami,
  więc trudno nim dowodzić, że reguły działają), a **PR #5**, który je tylko **stosował**:
  poziom ryzyka w opisie, jedna runda `@codex review` z nazwanym celem, jedna uwaga P2,
  poprawka z nowym SHA, ponowne sprawdzenie **dotkniętego** zakresu, wątek zamknięty mutacją,
  nowy SHA w komentarzu, bez proszenia o drugą rundę, merge za zgodą Kamila.

**Warunek P0 poprawiony — miał błędne założenie, nie tylko nieaktualne.** Mówił „bilans
i przepływy, **nowa data**". Data się nie zmieniła i **nie powinna była**: `lastUpdated`
w plikach to **najnowszy `updated_at` z bazy** (`scripts/export-financials.mjs:56`), czyli data,
kiedy zmieniły się **liczby**, a nie kiedy przeszedł bot. Sprawdziłem bazę przez REST: wszystkie
243 wiersze mają `updated_at` z 2026-09-20, najstarszy 14:28, najnowszy 20:07 — cały zestaw,
razem z bilansami, powstał tego jednego dnia. Czyli `2026-09-20` w plikach jest **prawdą**,
a nie zastojem; ruszy się po pierwszym lokalnym imporcie, czyli na początku grudnia. Przeciwny
wzorzec siedzi w `scripts/fetch-stooq.mjs`, który wpisuje dzisiejszą datę przy **każdym**
przebiegu — i właśnie dlatego weekendowy cron produkowałby tam commity-śmieci. Warunek
przepisany na „`lastUpdated` pokazuje datę ostatniego zapisu w bazie", z notką, że to poprawka
błędnego założenia, a nie przykrawanie kryterium pod wynik.

**Znalezione przy okazji — nowe zadanie D9, wzorzec P1, nie z dzisiejszych zmian.**
Waluta nie dochodzi do ekranu. `src/components/FinancialTable.jsx:55` wypisuje nagłówek narożny
jako zaszyte `'mln PLN'` / `'M PLN'` i **nie czyta pola `currency` w ogóle**, więc tabela
sprawozdań **Pepco opisuje kwoty w euro jako „mln PLN"** — na obu poziomach danych. Dodatkowo
`scripts/export-financials.mjs:42` buduje `meta = { date, period }` i gubi `row.currency`,
więc pliki poziomu 2 nie mają tego pola wcale (na produkcji `pepco/data.json` → `currency: None`),
choć baza wie swoje (`currency = 'EUR'` na 7 wierszach Pepco) i poziom 1 z Yahoo walutę oddaje.
D8 zapisało U10 „Pepco raportuje w EUR" — fakt był znany, tylko nikt nie sprawdził, czy UI go
honoruje. Zadanie trafiło do Bramki 1, nie na listę „Później", bo to klasa P1.

**Czego nie sprawdziłem.** Czy któryś **wskaźnik** już dziś dzieli liczbę w EUR przez liczbę
w PLN — `ratioCalculator.js` używa słowa `currency` tylko jako nazwy formatu, więc osłony
walutowej tam nie widziałem, ale całej ścieżki liczb nie przeszedłem. Nie otwierałem też strony
w przeglądarce: wszystko wyżej jest sprawdzone na plikach, przebiegach i zapytaniach REST.

**Jak zobaczyć bilans i przepływy na stronie.** PKO BP → `/stock/pkobp` → zakładka
**Sprawozdania** → podzakładki **Bilans** i **Przepływy pieniężne**. Uwaga: w normalnej
przeglądarce dane przyjdą z **poziomu 1** (`/api/financials`, Yahoo), który bilans i przepływy
oddawał **od zawsze** — więc sam widok nie dowodzi, że eksport zadziałał. Dowodem jest plik
pod `https://stockview.org/data/financials/pkobp/data.json`. Żeby zobaczyć poziom 2 w akcji,
trzeba zablokować `*/api/financials*` w DevTools → Network i odświeżyć stronę.

**`.agents/` dopisane do `.gitignore`** (decyzja Kamila). Katalog wraca sam — generuje go
aplikacja Codex jako **własną kopię** skilli z `.claude/skills/`, w wersji dla siebie
(„wymagana jest osobna sesja **Codex**" tam, gdzie w oryginale stoi „sesja **Claude**"): tyle
samo linii, inna treść. Nie używamy jej, a dwie rozjeżdżające się kopie tych samych instrukcji
to proszenie się o kłopoty. **Katalogu nie usuwam** — niech sobie leży nieśledzony.

Następne: D9 — waluta na ekran (Pepco jako EUR), najpierw `FinancialTable.jsx:55`, potem
`currency` w eksporcie. Lokalny import sprawozdań za III kwartał: początek grudnia.

## 2026-10-23 — P13 i P12: eksport osobno od importu, brak sekretu = błąd

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **`.github/workflows/update-financials.yml` przepisany — robi tylko eksport.** Import
  z Yahoo wyszedł z GitHuba: runner dostaje HTTP 403 z `https://stockview.org/api/financials`,
  bo Cloudflare nie ufa adresom centrów danych. Sprawdzone, że **nie chodzi o nagłówek**:
  z laptopa ten sam adres oddaje HTTP 200 przy pięciu wariantach `User-Agent` (`curl`, `node`,
  `undici`, pusty, przeglądarkowy). Blokowany jest adres IP.
- **Kluczowe odkrycie, które przewróciło zadanie:** dane, których brakowało na stronie,
  **już leżą w Supabase**. Próbny eksport (`npm run export-financials -- --dry-run`, nic nie
  zapisuje — sprawdzone w kodzie, że `DRY_RUN` blokuje i `rmSync`, i zapis) wypisał
  **24 pliki do zapisu, każdy z bilansem i przepływami**, rocznymi i kwartalnymi. Import
  dokłada nowe kwartały; **eksport** jest tym, co przepisuje bazę do plików czytanych przez
  stronę. Jedno nigdy nie powinno wisieć na drugim.
- **P12 w tym samym PR**, bo i tak przepisywałem plik. Kroki „Skip…" pod
  `if: env.SUPABASE_* == ''` **usunięte**; zamiast nich pierwszy krok `Check secrets`
  wypisuje `::error::` z **nazwą** brakującego sekretu i kończy `exit 1`. Workflow nie zna
  już `SUPABASE_SERVICE_ROLE_KEY` — eksportowi wystarcza klucz `anon`.
- **`scripts/import-financials.mjs`** — zero zapisanych wierszy to teraz **błąd** (`exit 1`),
  nie wynik. Dotąd kod wywalał się tylko wtedy, gdy padły **wszystkie 24** spółki
  (`bledy.length === wig20Companies.length`), więc import, w którym wszystkie wiersze były
  chronione flagą `verified`, kończył się sukcesem, nie wnosząc nic.
- **`docs/SETUP.md` → nowa sekcja D „Import sprawozdań — raz na kwartał, z laptopa"**
  (stara D „Czego nie robić" to teraz E): tabela kto-co-kiedy, **terminy ustawowe** publikacji
  raportów (60 dni dla I i III kwartału, 3 miesiące dla półrocza, 4 dla roku) z datą importu
  dla każdego okresu, skąd wziąć klucz `service_role`, dlaczego **bez przedrostka `VITE_`**,
  oraz to, że po imporcie trzeba jeszcze puścić eksport, bo import zmienia bazę, a strona
  czyta pliki.
- **`AGENTS.md`** — opis cotygodniowego zadania poprawiony (robi jedną rzecz: eksport),
  dopisany akapit, dlaczego importu nie ma na GitHubie, i `~189` → `~243` wiersze w tabeli.
  **`.env.example`** — zniknęło nieprawdziwe „na CI w sekretach repozytorium".
- **`docs/ROADMAP.md`** — warunek P13 przepisany zgodnie z decyzją Kamila; warunek P0
  zmniejszony z trzech sekretów do **dwóch**, z notką, że to zmiana i dlaczego.

**Sprawdzone.** `yaml.safe_load` parsuje workflow (kroki w kolejności: Check secrets →
checkout → setup-node → npm ci → export → commit); `bash -n` na wszystkich czterech krokach
`run`; krok `Check secrets` przepuszczony przez `bash -e` w **trzech stanach** — oba sekrety
`exit 0`, brak jednego `exit 1` z jego nazwą, brak obu `exit 1` z dwiema nazwami; importer
w normalnym dry-runie `exit 0` i 231 wierszy, a z nieosiągalnym źródłem (`API_BASE`
na zamknięty port) `exit 0` → **`exit 1`** z komunikatem „import nic nie wniósł do bazy";
`npm run build` przechodzi; `.env.local` jest w `.gitignore` (linia 6); żaden workflow nie
odwołuje się już do `SUPABASE_SERVICE_ROLE_KEY`. Żadnej wartości sekretu nigdzie nie wypisałem.

**Nie sprawdzone.** Prawdziwy przebieg `update-financials.yml` na `main` — można go odpalić
dopiero po merge'u. Czy strona spółki pokaże bilans i przepływy — to widać dopiero po tym
przebiegu. Pułapki `bash -e` z `[ -z ... ] && ...` **nie ma w kodzie** (użyłem formy
`if ...; then`), ale sam fakt, że testy przeszły, nie dowodzi, że GitHub użyje tej samej
powłoki co mój Mac — dowodzi tego dopiero przebieg.

**Jedna rzecz zrobiona inaczej, niż brzmiało polecenie.** Nie dodałem nowej komendy
`npm run import:financials`, bo **`npm run import-financials` już istnieje** w `package.json`
i robi dokładnie to (`node --env-file-if-exists=.env.local scripts/import-financials.mjs`).
Drugi alias na to samo byłby tylko kolejnym miejscem do rozjechania się. SETUP.md opisuje
komendę, która jest.

**Recenzja Codex na `3532415` — jedna uwaga, P2, trafna.** Warunek „gotowe, gdy" przy **P12**
nadal mówił o **trzech** sekretach oraz o imporcie i eksporcie, czyli wymagałby cofnięcia tego,
co P13 właśnie usuwa. Poprawiony na: brak `SUPABASE_URL` albo `SUPABASE_ANON_KEY` → przebieg
czerwony z nazwą sekretu w logu, brak kroków „Skip…" w pliku, przebieg z sekretami eksportuje.

**Przy tej samej okazji — trzy miejsca, których bot nie wskazał**, a mówiły to samo nieprawdziwie:

- **`docs/DATA.md`, sekcja „Sekrety, których potrzebuje bot"** — najgorsze z nich. Twierdziła,
  że `update-prices.yml` robi „ceny → import do Supabase → eksport", wymieniała **trzy** sekrety
  z `SUPABASE_SERVICE_ROLE_KEY` w roli sekretu repozytorium i kończyła się zdaniem „brak sekretu
  pomija krok, a nie wywala całego przebiegu" — czyli opisem dokładnie tego błędu, który P12
  naprawia. Przepisana: dwa sekrety, brak któregokolwiek = przebieg czerwony, `service_role`
  tylko lokalnie w `.env.local` i nigdy pod nazwą `VITE_*`.
- **`docs/ROADMAP.md`, zadanie D5** — „Bot wymaga trzech sekretów w repo" → dwóch.
- **`docs/ROADMAP.md`, zadanie D5** — „wpięty w `update-prices.yml`"; eksportera tam nie ma
  (`grep financials .github/workflows/update-prices.yml` → 0 trafień), siedzi
  w `update-financials.yml`. Poprawione, z adnotacją, gdzie był pierwotnie.

**Czego świadomie nie ruszyłem:** wcześniejszych wpisów w tym dzienniku, które mówią o „trzech
sekretach w Actions". Były prawdziwe w dniu, w którym je pisałem — dziennik jest zapisem tego,
co się stało, nie dokumentem do utrzymywania w aktualności. Przepisywanie go wstecz zabrałoby
jedyny ślad tego, jak ta decyzja powstała.

**Sprawdzone ponownie po poprawkach:** zmiana jest w czterech plikach Markdown i nie dotyka
kodu ani workflow, więc testy z pierwszej rundy zachowują ważność; powtórzyłem natomiast audyt
grepem — `trzy sekrety`/`trzech sekret` nie występuje już w `AGENTS.md`, `ROADMAP.md`,
`SETUP.md` ani `DATA.md`, i żaden z tych plików nie przypisuje już importu cotygodniowemu
workflow. Nowej rundy `@codex review` nie zamawiam — decyzja Kamila, to poprawka dokumentacji.
Jeden commit, bez osobnego commita stemplującego SHA — też jego decyzja; SHA podaję
w komentarzu do PR-a.

Następne: po merge'u ręczny przebieg eksportu i sprawdzenie strony spółki, potem odhaczenie
P0, P12 i P13 z SHA. Po merge'u Kamil może usunąć `SUPABASE_SERVICE_ROLE_KEY` z Actions.

## 2026-10-23 — Bramka P w roadmapie, sekrety sprawdzone w działaniu

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Bramka P w [`docs/ROADMAP.md`](ROADMAP.md)** — przeniesiona z `bramka-p.md` (dokument
  „StockView — prawo, prywatność i bezpieczeństwo" z 22.10.2026), wstawiona **przed Bramką 2**,
  zgodnie z Zasadą 6 z [`VISION.md`](VISION.md). Dwanaście zadań P0–P11 i ich warunki
  „gotowe, gdy" przeniesione **1:1** (sprawdzone skryptem: 12/12 tytułów i 12/12 warunków
  zgodnych po normalizacji cudzysłowów i spacji), do każdego dopisany **poziom ryzyka** wg
  `AGENTS.md` → „Review by risk". „Poza kodem" stało się trzema **zadaniami Kamila**.
  `bramka-p.md` usunięty z katalogu głównego. Przy Bramce 2 nota o pierwszeństwie Bramki P.
- **P8 ma teraz miejsca** — `src/components/HealthScore.jsx:191-192` (`getDescription`)
  i `src/pages/StockPage.jsx:802` (`healthDescription`): **ten sam werdykt zduplikowany
  w dwóch plikach**, w obu językach. Dopisane też dwa trafienia, które mają **zostać**
  (`translations.js:276` „inwestor kupujący", `wig20.js:857` „Kupuje i obsługuje portfele") —
  bez tego warunek „w `src/` nie ma słowa «kupuj»" nie dałby się zamknąć bez dyskusji.
- **Dwa nowe zadania w Bramce P.** **P12** — `update-financials.yml` ma się przerywać
  z `::error::` i `exit 1` przy brakującym sekrecie, zamiast po cichu wykonywać krok „Skip…"
  i kończyć na zielono (wzorzec P1: „operacja zakończona błędem nie może zgłaszać sukcesu").
  **P13** — import z Yahoo nie przechodzi z runnera GitHuba, a jego porażka blokuje eksport;
  **P13 blokuje P0**.

**Sekrety sprawdzone w działaniu.** `gh secret list` → trzy nazwy (`SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`). Wartości nigdzie nie wypisane.

- **`keepalive.yml` na `main` po merge'u PR #3 (`90ffed0`) — zielony.**
  [Run 39983171367](https://github.com/Kuchaar/stockview/actions/runs/39983171367): trzy prawdziwe
  zapytania `select` (`financials`, `dividends`, `financials` po `period_end`), **HTTP 200 ×3**,
  „Keepalive OK", bez klucza w logu. To **dowód, że `SUPABASE_URL` i `SUPABASE_ANON_KEY` są
  poprawne** i że runner GitHuba dobija się do Supabase bez przeszkód.
- **`update-financials.yml` na `main` — czerwony, ale nie z winy sekretów.**
  [Run 39981690212](https://github.com/Kuchaar/stockview/actions/runs/39981690212): krok
  **„Import financials into Supabase" wykonał się** — nie „Skip…" — więc sekrety są widoczne
  dla Actions. Padł na **HTTP 403 na 23 spółkach i „fetch failed" na PZU**, zapisał 0 wierszy
  i wywalił job, przez co **„Export financials to static files" w ogóle się nie uruchomił**.
  Importer woła **nasz własny** `https://stockview.org/api/financials`, nie Supabase; z mojego
  komputera ten adres oddaje HTTP 200. Blokada stoi między runnerem i Cloudflare, nie w bazie.

**Żaden sekret nie jest zły.** `SUPABASE_URL` i `SUPABASE_ANON_KEY` potwierdzone przez keepalive;
`SUPABASE_SERVICE_ROLE_KEY` **nadal niepotwierdzony** — import padł, zanim zdążył cokolwiek
wysłać do bazy, więc o tym kluczu wiem tylko, że istnieje i jest niepusty.
`public/data/financials/` na `main` bez zmian: 24 pliki, po 4 okresy roczne i 4 kwartalne
rachunku wyników, **0 bilansu, 0 przepływów**, data `2026-09-20` (Żabka 1 okres roczny).

**Nie zrobione i dlaczego.** **P0 nie odhaczone.** Cztery warunki z pięciu są spełnione: baza
aktywna, logowanie na stockview.org działa (potwierdził Kamil), trzy sekrety w Actions, codzienny
keepalive na `main` i sprawdzony. Piąty nie: `update-financials.yml` nie odświeża
`public/data/financials/`, bo blokuje go **P13**. Odhaczenie P0 z SHA czeka na P13.

Następne: P13 (rozdzielić eksport od importu — eksport z runnera przechodzi, co pokazał keepalive), potem P12, i wtedy P0 do odhaczenia z SHA.

## 2026-10-23 — Keepalive Supabase (P0) i odkrycie: w repo nie ma ani jednego sekretu

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Nowy workflow `.github/workflows/keepalive.yml`** — **trzy prawdziwe zapytania
  `select`** przez REST (`financials` ×2, `dividends` ×1), kluczem `anon`, raz na dobę,
  **codziennie — także w weekendy** (`cron: '0 7 * * *'`). Żadnego endpointu `health`:
  liczy się aktywność bazy, nie to, że API żyje. **Bez nowych zależności** — `curl`
  z pudełka, bez `checkout` i bez `setup-node`, bo ten job nie czyta repo.
  `permissions: contents: read`, bo niczego nie commituje.
- **Klucz `anon`, nie `service_role`** — `financials` i `dividends` mają politykę
  publicznego odczytu, więcej uprawnień nie trzeba. Klucz idzie **wyłącznie w nagłówkach**,
  nigdy w URL-u, żeby nie wyciekł do logu przez komunikat błędu `curl`-a.
- **Brakujący sekret przerywa przebieg błędem**, nie cichym pominięciem — dokładnie
  odwrotnie niż w `update-financials.yml`, i poniżej jest widać dlaczego.
- **`update-prices.yml` ostatecznie nietknięty.** Pierwsza wersja dokładała krok tam
  (zgodnie z brzmieniem zadania), ale recenzja to wywróciła — patrz „Recenzja" niżej.

**Odkrycia — ważniejsze niż samo zadanie.**

- **Baza żyje.** HTTP 200 w 840 ms. W tabeli `financials` jest **243 wiersze: 218
  z bilansem, 212 z przepływami**, 24 spółki, najnowszy okres `2026-07-31`, 7 wierszy
  w EUR (U10, Pepco). Dane z D8 są na miejscu.
- **`public/data/financials/` ma 93 wiersze roczne przychodów i ZERO bilansu oraz ZERO
  przepływów.** Wszystkie 24 pliki noszą `lastUpdated: 2026-09-20`. Czyli strona od
  miesiąca pokazuje chude dane, choć baza ma komplet.
- **Przyczyna: `gh secret list` zwraca pustą listę — w repo nie ma ani jednego sekretu.**
  Oba realne kroki w `update-financials.yml` są bramkowane na `if: env.SUPABASE_* != ''`,
  więc po cichu się pomijają. Workflow odpalił się **cztery razy od 2026-09-26, każdy raz
  „success" w 16–24 s**, i ani razu nic nie zmienił. Zielony znaczek przy niezrobionej
  pracy — wzorzec, który nasze własne „Code review rules" nazywają P1 („operacja zakończona
  błędem nie może zgłaszać sukcesu").
- **Wniosek praktyczny:** keepalive nie zadziała, dopóki Kamil nie doda `SUPABASE_URL`
  i `SUPABASE_ANON_KEY` do sekretów repo. Dane z bilansem wrócą na stronę po dodaniu
  sekretów i jednym przebiegu `update-financials.yml` — nie wymaga to żadnej zmiany w kodzie.

**Decyzje.**

**Recenzja (ryzyko wysokie → jedna runda `@codex review`).**

Codex zgłosił **jedno ustalenie, P1, i miał rację**: `update-prices.yml` ma
`cron: '0 18 * * 1-5'`, czyli **tylko dni robocze** — w sobotę i niedzielę baza nie
dostałaby ani jednego zapytania, a moje lokalne `HTTP 200` dowodzi jedynie dostępności
REST API, **nie wystarczającej aktywności**. Zielony przebieg przy uśpionej bazie — czyli
dokładnie ten wzorzec, przed którym sam ostrzegałem w tym samym PR-ze.

Przy naprawie sprawdziłem też założenie, które chciałem przyjąć na słowo — że weekendowy
przebieg cen byłby niegroźny, bo „nic się nie zmieniań. **Nieprawda:**
`fetch-stooq.mjs` nadpisuje `lastUpdated` dzisiejszą datą przy każdym przebiegu, więc
sobota i niedziela dałyby **dwa commity tygodniowo na `main` z samą podbitą datą**.
Dlatego keepalive dostał własny plik — decyzją Kamila, bo to wyjście poza literalne
brzmienie zadania („dodaj krok do `update-prices.yml`").

- **Ryzyko tej zmiany: wysokie.** Według `AGENTS.md` → „Review by risk" wysokie ryzyko
  obejmuje **sekrety**, a ten krok wprowadza odwołania do sekretów w workflow, który pisze
  na `main`. Sam klucz `anon` jest publiczny z natury (jedzie w bundlu klienta jako
  `VITE_*`), ale decyduje mechanizm, nie wrażliwość tego konkretnego klucza. Ścieżka
  recenzji: **jedna runda `@codex review` przed merge** — pierwsze prawdziwe użycie tej
  ścieżki. Runda się odbyła, P1 naprawione, kolejnej nie proszę: zgodnie z `AGENTS.md`
  jedna runda wystarcza, a P2 i niższe z dalszych rund i tak nie blokowałyby merge'a.
- **Brakujący sekret ma wywalać przebieg, nie pomijać kroku.** Cena: dopóki sekretów nie
  ma, codzienny przebieg cen będzie czerwony (ceny i tak się zapiszą, bo krok jest
  ostatni). Korzyść: nie powtarzamy miesiąca zielonych przebiegów przy martwej robocie.
  Dlatego **sekrety warto dodać przed merge**, nie po.

**Do sprawdzenia.** Workflow jest wykonywalny, więc go wykonałem, a nie tylko napisałem:
**trzy zapytania → `HTTP 200` ×3, `exit 0`**; gałąź „brak sekretu" → `::error::` i `exit 1`;
gałąź „zły klucz" → `HTTP 401`, `exit 1`, **bez klucza w logu**. YAML parsuje się
(`yaml.safe_load`), skrypt przechodzi `bash -n`, w pliku nie ma `SERVICE_ROLE` ani klucza
w URL-u ani endpointu `health`, `update-prices.yml` nie różni się od `main`,
`package.json` i lockfile bez zmian.

**Logowanie na `stockview.org` — co dało się sprawdzić z terminala:** strona odpowiada
`HTTP 200` w 0,2 s; w produkcyjnym bundlu (`assets/index-C8XNMcgu.js`, 603 kB) są **URL
projektu i klucz `anon`**, czyli `supabase` nie jest `null` i logowanie *może* działać;
`/auth/v1/health` → `HTTP 200`, dostawca `email` włączony, `disable_signup: false`,
`mailer_autoconfirm: false` (czyli mail z linkiem naprawdę się wysyła). **Celowo nie
wywołałem wysłania magic linka** — to mail na skrzynkę Kamila, czyli akcja na zewnątrz. **Niesprawdzone:** przebieg na runnerze GitHuba —
bez sekretów wyjdzie czerwony i to jest zachowanie oczekiwane, nie błąd. Nie odpalałem
`update-prices.yml` ani `update-financials.yml` (punkt 3 zadania czeka na merge).
Logowania na `stockview.org` nie da się sprawdzić z terminala — patrz „Następne:".

**Następne:** **Kamil: dodaj dwa sekrety** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) w
Settings → Secrets and variables → Actions, i **zweryfikuj logowanie** na
https://stockview.org — klik w „Zaloguj", mail z linkiem, powrót na stronę jako zalogowany.
Potem merge PR-a po rundzie `@codex review`, ręczne odpalenie obu workflow i sprawdzenie,
że `public/data/financials/` ma wreszcie bilans i przepływy. **P0 nie da się odhaczyć** —
Bramki P nie ma jeszcze w `docs/ROADMAP.md`, bo czeka na `bramka-p.md`.


## 2026-10-23 — docs/VISION.md jako filtr zadań + rozbieżności z roadmapą

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **`docs/VISION.md`** — dokument kierunku produktu od Kamila, przeniesiony z katalogu
  głównego repo bez zmiany treści (`shasum -a 256` zgodny z kopią w `~/Downloads`).
- **`AGENTS.md`** — wiersz w „Docs map" plus **jedna zasada** w „Ground rules": przed
  zaproponowaniem zadania, przy review i w paczce dla GPT sprawdzam zgodność z `VISION.md`
  i nazywam zasadę, cel albo hipotezę, której zmiana służy; **zadanie sprzeczne z „Zasadami"
  zgłaszam Kamilowi, zamiast je realizować**; **`VISION.md` zmienia tylko Kamil**, z datą
  i powodem w dzienniku. W „Code review rules" jest wskaźnik do tej zasady — nie jej kopia.
- **Porównanie roadmapy z „Zasadami" i „Otwartymi decyzjami"** — dziewięć rozbieżności
  niżej. **W `docs/ROADMAP.md` nic nie zmieniłem**, zgodnie z poleceniem.

**Rozbieżności ROADMAP ↔ VISION.**

*Wprost sprzeczne z „Zasadami":*

1. **Nie ma Bramki P, a Bramka 2 już się dzieje.** Zasada 6 mówi „Bramka P przed Bramką 2".
   ROADMAP ma Bramki 0–4 i **ani jednej Bramki P**, a Bramka 2 jest w połowie: K1
   (logowanie) i K2 (watchlista) odhaczone, K3 następny w kolejce. Zasada jest więc łamana
   już teraz, a najbliższe zaplanowane zadanie to dokładnie to, co ma czekać. „prywatn"
   pojawia się w roadmapie raz — i to w kontekście `noindex`, nie bezpieczeństwa.
2. **„atrakcyjna wycena" w kodzie — zwrot wymieniony w wizji jako zakazany.** Zasada 1
   zabrania „ocen typu «atrakcyjna wycena»", Zasada 2 — „wartości godziwej" konkretnej
   spółki. Dokładnie ten zwrot jest w `src/components/HealthScore.jsx:191-192`
   i `src/pages/StockPage.jsx:802`, w obu językach. ROADMAP nie ma zadania, które by to
   usuwało, ani audytu języka ocen w zakładkach Wycena i Kondycja.

*Luki — wizja wymaga, roadmapa milczy:*

3. **Zero zadań edukacyjnych** („edukac", „lekcj" — 0 trafień), choć Zasady 3 i 4 oraz cały
   „docelowy produkt" na nich stoją. Opcji (A) z Otwartych decyzji nie da się dziś wybrać,
   bo w roadmapie nie istnieje.
4. **DCF jako kalkulator — 0 trafień.** Zasada 2 wprost go dopuszcza, a opcja (B) stawia go
   na trzecim miejscu.
5. **Licencje na dane — 0 trafień.** Wizja sama zauważa, że Yahoo i widgety TradingView
   zabraniają użytku komercyjnego, a dane GPW wymagają licencji. Aplikacja używa dziś obu
   (`TradingViewChart.jsx`, `TickerTape.jsx`, `/api/quote`). Przy pierwszej płatnej funkcji
   to blokada, nie szczegół.
6. **Portfel węższy, niż mówi hipoteza.** K5 liczy wycenę „po cenach z `/api/quote`", czyli
   **tylko 24 spółki WIG20**. ETF-y, obligacje i import z eksportu brokera nie występują
   w roadmapie, a hipoteza mówi, że bez nich portfel pokaże początkującemu ułamek tego,
   co ma — czyli K3–K6 zbudują dokładnie ten portfel, który uznano za mało użyteczny.
7. **„Dane z bazy w każdym widoku, źródło i data przy liczbach" — tylko częściowo.** D7 dał
   `DataFreshness`, ale **wyłącznie w zakładce Sprawozdania**. Poziom 3 `useFinancials` to
   nadal zaszyte dane w `src/data/wig20.js`, skąd `ratios` zasilają inne widoki. Brak
   zadania „źródło i data przy każdej liczbie" oraz „koniec z poziomem 3".
8. **Cel nr 1 nie ma ścieżki.** „10 obcych osób płaci" — w roadmapie zero zadań
   monetyzacyjnych („płatn", „abonament" — 0 trafień), więc Otwarta decyzja 2 nie ma
   odpowiednika nawet w formie przygotowania.

*Rozstrzyga coś, co w wizji jest otwarte:*

9. **Bramka 4 (Redesign) nie występuje w żadnej z dwu opcji.** Otwarta decyzja 1 daje (A)
   albo (B); roadmapa ustawia po Bramce 2 → Bramkę 3 (zrobioną) → **Redesign na 6–8 sesji**,
   którego wizja nie wymienia nigdzie. Kolejność w pliku rozstrzyga więc otwartą decyzję, i to
   na trzecią, nieopisaną opcję.

*Zgodne, dla równowagi:* Zasada 5 (małe kroki) — każde zadanie w roadmapie ma ~40 minut
i warunek „gotowe, gdy". Sekcja „Poza zakresem na teraz" też się trzyma: ani reklam, ani
afiliacji CPA, ani fundamentów całej GPW w roadmapie nie ma.

**Do sprawdzenia.** Zmiana dotyczy dokumentacji i jednej zasady — **nic się nie uruchamia**,
build niczego by tu nie dowiódł. Sprawdzone: zgodność treści `VISION.md` po przeniesieniu
(sha256), odnośniki w „Docs map" i w nowej zasadzie prowadzą do istniejącego pliku, cytowane
numery linii w `HealthScore.jsx` i `StockPage.jsx` potwierdzone grepem. **Nie sprawdzałem,
czy zakładki Wycena i Kondycja mają więcej zwrotów ocennych** niż ten jeden — to byłby
osobny audyt, poza zakresem tego zadania.

**Następne:** rozbieżności 1 i 2 wymagają **decyzji Kamila**, nie mojej: co wchodzi do
Bramki P i czy „atrakcyjna wycena" wypada od razu (to ~20 minut, ale dotyka języka ocen,
więc i tak Twoja decyzja). Dopóki to nie jest rozstrzygnięte, **K3 nie jest dobrym następnym
zadaniem** — wizja każe go odłożyć za Bramkę P.


## 2026-10-23 — Doprecyzowanie modelu recenzji i 4 uwagi do c929f24

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Model recenzji doprecyzowany decyzją Kamila** — wpisane tam, gdzie opisujemy recenzję,
  bez tworzenia drugiego procesu:
  - **bot Codex to nasz „dodatkowy przegląd" dla wysokiego ryzyka.** Automatyczne review
    na każdym PR-ze **wyłączone**; wołamy go komentarzem `@codex review` **tylko przy
    wysokim ryzyku i tylko raz**. W tej roli zastępuje przegląd GPT — ale nadal **nie jest**
    okresowym przeglądem GPT z sekcji handoveru, bo tamten patrzy na nazbierane zmiany,
    architekturę i metodologię finansową;
  - **P1 z tej rundy blokują merge**, a **P2 i niższe z dalszych rund nie blokują** — lądują
    w nowej liście **„Później — uwagi z recenzji"** w `docs/ROADMAP.md` (uwaga, numer PR-a,
    SHA, plik:linia). Powód: bot będzie znajdował P2 tak długo, jak długo się go pyta;
  - **niskie i zwykłe ryzyko bez zmian** — niskie: moje review plus weryfikacja, bez
    drugiego recenzenta i bez czekania; zwykłe: osobna sesja Claude. Ani jedno, ani drugie
    **nigdy nie wysyła `@codex review`**.
- **Cztery uwagi Codexa do `c929f24` naprawione** (wszystkie P2, wszystkie przyjęte):
  1. **Niskie ryzyko czekało na recenzenta** (`/sv-start`) — punkt „niezrecenzowany SHA →
     poproś o recenzję" był bezwarunkowy, a PR niskiego ryzyka po moim własnym review
     z definicji nie ma review na GitHubie. Każdy taki PR zamieniał się w oczekiwanie.
     Teraz ten punkt dotyczy **wyłącznie wysokiego ryzyka**.
  2. **Jajko i kura z SHA w dzienniku** (`/sv-review`) — kazałem wpisać nowy SHA do wpisu
     przed commitem poprawek, a to hash commita, który ten wpis zawiera. Teraz w dwu
     krokach: wpis bez SHA → commit poprawek → **drugi, jednolinijkowy commit `docs:`**,
     który dopisuje konkretny SHA. Ten wpis powstał dokładnie tak.
  3. **„Zrecenzowany" bez sprawdzenia, przez kogo** (`/sv-start`) — liczyło się istnienie
     jakiegokolwiek review, więc przy zwykłym ryzyku komentarz bota zaliczałby się jako
     wymagana osobna sesja Claude. Teraz recenzję kwalifikuję po **ścieżce z poziomu
     ryzyka**, z `author.login`: review z `[bot]` nie zastępuje sesji Claude.
  4. **Commit każdego komentarza osobno** (`/sv-review`) — zapytanie nie pobierało, do
     której wersji odnosi się dana uwaga, a `commit_id` z poziomu review nie mapuje się na
     pojedynczy komentarz. **Potwierdzone na żywo**: REST pokazał osiem komentarzy jako
     zgłoszone do `c929f24`, choć cztery były stare — GitHub przypisuje komentarzom nowszy
     commit, gdy głowa idzie dalej. Dociągam teraz `commit{oid}` i `originalCommit{oid}`.

**SHA poprawek: `6ab937f3aca41b7f0fdd43279932c1f534b60637`.** Ten numer dopisał drugi,
jednolinijkowy commit `docs:` — dokładnie tak, jak każe naprawiona uwaga 2, bo hash commita
z poprawkami zawiera też treść tego wpisu i nie da się go znać wcześniej. Głową gałęzi jest
ten drugi commit.

**Decyzje.** Wszystkie cztery uwagi przyjęte, żadnej spornej. Dwie z nich (1 i 3) to ten sam
błąd w dwu miejscach: **zapisałem warunek na „czy recenzja istnieje", zamiast na „czy odbyła
się ta recenzja, której wymaga poziom ryzyka"**. Trzecia (2) to logiczna niemożliwość,
której nie zauważyłem, bo nigdy nie przeszedłem tej ścieżki do końca.

**Do sprawdzenia.** Odpalone: zmienione zapytanie GraphQL z `commit{oid}`
i `originalCommit{oid}` — wszystkie cztery uwagi mają oba `oid` równe `c929f24`, czyli są
rzeczywiście nowe. **Niesprawdzone:** ścieżka 👍 (bot za każdym razem miał uwagi), promocja
`wip/*` z `git push origin --delete`, `--force-with-lease`, krok 7 z podglądem Cloudflare
i cała ścieżka wysokiego ryzyka — w tym nowa reguła jednej rundy `@codex review`, bo ten PR
ma ryzyko **niskie** i celowo o recenzję nie prosiłem. Lista „Później" jest pusta: wszystkie
uwagi z PR #1 naprawiliśmy w jego trakcie. Build nie uruchamiany — zmiana nie dotyka `src/`.

**Następne:** merge PR #1 — ryzyko niskie, review własne wykonane, cztery rundy Codexa
zamknięte, 26/26 wątków rozwiązanych. To domyka **F6**. Potem **K3 — schemat portfela
w Supabase** (`portfolio` i `transactions` z RLS ograniczonym do właściciela): **pierwsza
zmiana wysokiego ryzyka**, czyli pierwszy prawdziwy test jednej rundy `@codex review`
przed merge.


## 2026-10-23 — /sv-review na PR #1: 14 ustaleń P2 z dwóch recenzji

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.** Dwie recenzje Codex (`a185621` i `1f85327`) dały 14 ustaleń, wszystkie P2,
wszystkie w skillach i wszystkie prawdziwe. Przyjąłem wszystkie — żadnego spornego,
żadnego poza zakresem.

- **Zakleszczenie przy wysokim ryzyku naprawione** (`/sv-start`) — najważniejsze
  ustalenie. PR wysokiego ryzyka czekający na recenzenta z definicji ma niezrecenzowany
  `headRefOid`, więc wpadał w punkt „niezrecenzowany SHA", dostawał `/sv-review`, a ten
  zatrzymywał się na „recenzji nie ma". Punkt „weź niezależne zadanie o niższym ryzyku"
  nigdy się nie wykonywał — instrukcja robiła dokładnie to, czemu miała zapobiec.
  Kolejność pierwszeństwa ma teraz pięć pozycji, od góry: **czerwone CI** → **PR wysokiego
  ryzyka czekający na recenzenta (nie `/sv-review`, weź inne zadanie)** → **nierozwiązane
  wątki albo `CHANGES_REQUESTED` na aktualnym SHA → `/sv-review`** → **niezrecenzowany SHA
  → poproś o recenzję, nie wołaj `/sv-review`** → **zadanie z roadmapy**.
- **Samo wskazanie SHA nie uruchamia recenzji** (`/sv-review`) — druga połowa tego samego
  zakleszczenia. Krok 5 wysyła teraz `gh pr comment --body "@codex review"`, a przy wysokim
  ryzyku zagóbi wskazanego recenzenta.
- **Reakcja 👍 nigdzie nie była pobierana** (`/sv-start`) — Codex przy braku uwag nie pisze
  komentarza, tylko reaguje. `gh pr view --comments` tego nie oddaje, więc recenzja bez
  uwag wyglądałaby jak brak recenzji i PR krążyłby w kółko. Zapytanie dostało
  `reactionGroups` i `submittedAt`.
- **`CHANGES_REQUESTED` bez komentarza do linii** (`/sv-start`) — review z uwagami w samej
  treści dawało zero wątków i przechodziło jako „brak uwag". Teraz liczy się `state`
  ostatniego review dla aktualnego SHA.
- **`UNKNOWN` to nie konflikt** (`/sv-koniec`, `AGENTS.md`) — GitHub liczy zdolność
  scalenia asynchronicznie; mój wczorajszy warunek „rebase, gdy PR przestał być
  `MERGEABLE`" rebase'owałby na stanie przejściowym. Trafiłem na `UNKNOWN` w tej samej
  sesji i musiałem odpytać ponownie, a mimo to zapisałem regułę źle. Teraz: rebase tylko
  na `CONFLICTING`/`DIRTY`, na `UNKNOWN` ponowne zapytanie.
- **Skille to nie proza** (`/sv-koniec`) — wiersz „wyłącznie dokumentacja lub instrukcje →
  nic się nie uruchamia" rozbity na dwa: pasywna dokumentacja (nic) i `.claude/skills/`
  (**przejdź dotkniętą ścieżkę — każdą zmienioną komendę gita i każde zmienione wywołanie
  API odpal raz**). Zmiana samych `.md` nie dostaje runu CI, więc literówka dojeżdżała
  nietknięta do następnej sesji.
- **Ukończona praca z `wip/*`** (`/sv-koniec`) — reguła „`wip/*` nie dostaje PR-a" była
  bezwarunkowa, więc skończona praca podjęta z `wip/` nigdy nie wchodziła do obiegu.
  Teraz: rozstrzygnij warunek „gotowe, gdy…", a jeśli spełniony — `git branch -m` na
  docelowy prefiks i PR.
- **CI sprawdzane dla starego SHA** (`/sv-review`) — jedyne `gh pr checks` było w kroku 2,
  przed pushem, a raport podawał to jako status nowego SHA. Dodane ponowne odpytanie po
  pushu.
- **Brak wpisu do dziennika przy sesji z samym `/sv-review`** — ten wpis istnieje dzięki
  temu ustaleniu.
- **Czerwone CI przegrywało z roadmapą** (`/sv-start`) — zepsuty PR nie trafiał do żadnego
  punktu pierwszeństwa. Jest teraz na szczycie.
- **Praca na recenzowanej gałęzi** (`/sv-start`) — po `/sv-koniec` checkout zostaje na
  gałęzi PR-a, więc nowe zadanie commitowałoby się na PR w recenzji. Dodane przejście na
  świeży `main`.
- **Podgląd Cloudflare** (`/sv-koniec`, nowy krok 7) — przy zmianie w UI wszystkie
  sprawdzenia odbywały się przed istnieniem PR-a, a deployment podglądowy powstaje razem
  z PR-em. Jeśli oględzin nie da się zrobić, merge jest zablokowany i trzeba to powiedzieć.
- **Brak daty przeglądu GPT** (`AGENTS.md`) — próg „raz w tygodniu" nie miał od czego
  liczyć: data commita to nie data przeglądu. Linia handoveru ma teraz SHA **i datę**, obie
  `nieustalony`.

**Decyzje.** Wszystkie 14 ustaleń przyjęte bez sporu. Trzy z nich (zakleszczenie, `UNKNOWN`,
„skille to nie proza") to błędy w regułach, które sam napisałem dzień wcześniej, i wszystkie
trzy dotyczą tego samego: **zapisałem regułę, zamiast sprawdzić, jak zachowuje się
narzędzie.** Dlatego ustalenie o weryfikacji skilli uznaję za najważniejsze z całej trójki
recenzji — zmienia sposób pracy, nie tylko treść pliku.

**Do sprawdzenia.** Odpalone na żywo: nowe zapytanie GraphQL z `reactionGroups`
i `submittedAt`, `gh pr view` z `mergeable`/`mergeStateStatus`/`reactionGroups`,
`gh pr list --state merged` (0 scalonych PR-ów), `git branch -m` na gałęzi-atrapie.
**Niesprawdzone:** ścieżka 👍 — Codex za każdym razem miał uwagi, więc reakcji nigdy nie
było (pole zwraca pustą listę, zapytanie działa); `git push origin --delete` z promocji
`wip/*`; `--force-with-lease`; ścieżka „wysokie ryzyko bez recenzenta"; krok 7 z podglądem
Cloudflare. Build nie uruchamiany — zmiana nie dotyka `src/`.

**Następne:** poprosić Codex o recenzję nowego SHA i zobaczyć, czy czwarte przejście
zamyka temat. **Merge PR #1 dopiero po recenzji bez uwag albo po świadomej decyzji Kamila,
że dalsze rundy nie wnoszą** — trzy recenzje z rzędu znalazły po kilka ustaleń, więc warto
sprawdzić, czy to się zbiega. Potem **K3 — schemat portfela w Supabase** (wysokie ryzyko:
RLS i uprawnienia).


## 2026-10-22 — Nowy model współpracy i recenzja Codex na PR #1

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Przebudowany podział odpowiedzialności w `AGENTS.md`** — trzy osoby zamiast czterech
  ról z promptem GPT w pętli: **Kamil** (cele biznesowe, priorytety, kompromisy, zgoda na
  merge), **Claude Code** (bieżąca praca wg roadmapy, propozycje zadań, implementacja,
  testy, dokumentacja, PR-y — **bez promptu od GPT do każdego zadania**), **GPT**
  (okresowe przeglądy, trudne problemy, architektura, metodologia finansowa, kierunek
  produktu — **nie jest obowiązkowym recenzentem każdego PR-a**). Powód: dostępność GPT
  przestała blokować projekt.
- **Nowe `### Review by risk`** — recenzja dobierana do tego, co zmiana może zepsuć:
  **niskie** (dokumentacja, drobny wygląd, teksty bez znaczenia finansowego i prawnego)
  → review Claude plus właściwa weryfikacja; **zwykłe** (zmiana funkcjonalna) → review
  w osobnej sesji Claude, testy pod zachowanie i sprawdzenie przez Kamila; **wysokie**
  (RLS, uprawnienia, logowanie, sekrety, migracje, import nadpisujący dane, wzory
  finansowe, waluty, okresy, źródła) → dodatkowy przegląd przed merge i wdrożeniem,
  najlepiej GPT. Gdy recenzenta nie ma — PR zostaje otwarty, a praca idzie na niezależne
  zadanie o niższym ryzyku. Wprost zapisane, że **osobna sesja Claude to świeży kontekst,
  a nie niezależna recenzja innego modelu**.
- **Nowa sekcja `## GPT review handover`** — kadencja orientacyjnie 3–5 małych PR-ów albo
  raz w tygodniu, sześć punktów przekazania i jedna linia ze stanem: **ostatni SHA
  faktycznie zrecenzowany przez GPT — `nieustalony`**. Dwa zakazy: omówienie raportu nie
  jest przeglądem kodu i nie przesuwa tej linii; przegląd po merge to **audyt**, nie
  zatwierdzenie przed wdrożeniem.
- **Raport z zadania skrócony do pięciu krótkich punktów** (co i dlaczego, co sprawdzone
  i czego nie, jedna lekcja programistyczna, finanse tylko gdy dotyczą, link do PR-a
  i następny krok). Dopisane: **zielony build jest dowodem o buildzie, nie o poprawności
  instrukcji**.
- **F6 w roadmapie poprawione** — warunek „gotowe, gdy" wymagał recenzji *z uwagami*
  i poprawki, czyli znalezienia błędu. Teraz obieg zalicza też **review zakończone bez
  uwag**, byle wskazało sprawdzony SHA i ograniczenia weryfikacji.
- **Osiem ustaleń z recenzji Codex na PR #1 naprawione** (5× P1, 3× P2) — wszystkie
  w instrukcjach, które sam wczoraj napisałem:
  1. **P1 `gh api *` w `allowed-tools`** — wildcard przyznawał bezpytaniowy dostęp do
     każdego uwierzytelnionego wywołania `gh api`, a ono potrafi pisać (`--method`, pola
     przełączają je na POST). Usunięty z `/sv-start` i `/sv-review`.
  2. **P1 push po rebase bez lease** — `/sv-review` robił `git rebase origin/main` i potem
     zwykły `git push`, który na już opublikowanej gałęzi leci jako non-fast-forward
     i jest odrzucany. Teraz: rebase tylko gdy PR przestał być `MERGEABLE`, push
     z `--force-with-lease`, nigdy `--force`.
  3. **P1 build przed rebase** — `/sv-koniec` budował w kroku 2, a rebase'ował w kroku 4,
     więc do PR-a szła wersja, której nikt nie sprawdził. Rebase przeniesiony **przed**
     sprawdzenia, z nakazem powtórzenia ich, jeśli gałąź ruszyła później.
  4. **P1 stary SHA na drugim komputerze** — `git fetch` + `git switch` wchodzi na
     **lokalną** gałąź, która może być starsza od PR-a. Teraz: czyste drzewo,
     `git merge --ff-only`, i jawne `HEAD == headRefOid` przed edycją.
  5. **P1 commit kasował `CHANGES_REQUESTED`** — w `/sv-start` warunek „review nowsze niż
     ostatni commit" powodował, że **dorzucenie commita** zamykało uwagi i skill mógł
     zaproponować nowe zadanie. Teraz liczy się to, czy **aktualny `headRefOid`** został
     zrecenzowany.
  6. **P2 odpowiedź nie zamyka wątku** — REST nie oddaje stanu rozwiązania; stan siedzi
     w GraphQL (`reviewThreads.isResolved`), a zamyka go mutacja `resolveReviewThread`.
     Oba skille dostały zapytanie i mutację.
  7. **P2 brak stanu „trwa"** — słownik odpowiedzi `/sv-start` miał tylko zielone,
     czerwone i brak runu, co kazało pendingów nazywać czerwonymi. Dodane „trwa".
  8. **P2 błędna zapowiedź CI w dzienniku** — to samo, co poprawiłem sam w `613d85e`.

- **Krok „rebase" w `/sv-koniec` naprawiony na warunkowy** — instrukcja, którą napisałem
  godzinę wcześniej, kazała rebase'ować bezwarunkowo przed sprawdzeniami. Na własnym PR-ze
  wyszło, czym to grozi: `origin/main` ruszył o jeden commit bota (`02250cd`, same pliki
  w `public/data/`), PR był `MERGEABLE`/`CLEAN`, a rytualny rebase przepisałby cztery
  opublikowane commity, wymusił `--force-with-lease` i **unieważnił zrecenzowany SHA wraz
  z ośmioma pozamykanymi wątkami** — żeby wciągnąć pliki cen, które z niczym nie kolidują.
  Teraz rebase jest obowiązkowy tylko dla gałęzi jeszcze niewypchniętej albo gdy PR
  przestał być `MERGEABLE`. Ta sama reguła dopisana do `AGENTS.md` → „Workflow", żeby oba
  dokumenty nie mówiły czegoś innego.

**Decyzje.**

- **Botom zostaje wyjątek od reguły „wszystko przez PR"** — `update-prices.yml`
  i `update-financials.yml` nadal commitują `public/data/` prosto na `main`. Uzasadnienie
  w `AGENTS.md`: pliki są generowane maszynowo, nikt nie recenzuje szeregu cen wzrokiem,
  a te dwa workflow są tam jedynymi piszącymi. Żaden agent nie merguje bez zgody Kamila.
- **Codex zostaje jako bot wpięty w repo, nie jako CLI.** Komentuje PR przy otwarciu
  i to się sprawdziło — 8 ustaleń na pierwszym PR-ze. **Nie jest** okresowym przeglądem
  GPT ani zatwierdzeniem. CLI nieinstalowane i niepotrzebne.
- **Jeden proces, nie dwa.** Zmiany weszły do istniejących sekcji i skilli; żadnego
  nowego pliku ani równoległego obiegu.

**Do sprawdzenia.** **Treść reguł jest niesprawdzalna buildem** — zmieniły się tylko
`.md` i `.claude/`. Zweryfikowałem za to **działanie dwu rzeczy, które wpisałem
do skilli**: zapytanie GraphQL o `reviewThreads` zwraca stan 8 wątków (wszystkie
`isResolved: false`, w tym ten, którego uwagę już naprawiłem — dowód, że poprawka sama
wątku nie zamyka), a `gh pr checks` oddaje stany `pass`/`pending`. **Żaden skill nie
został odpalony od początku do końca** — `/sv-start` tak, `/sv-koniec` i `/sv-review`
nie. **`resolveReviewThread` sprawdzona** — zamknęła wszystkie 8 wątków
(`isResolved: true`). Nie sprawdzone: `--force-with-lease` (nie było rebase'u,
`origin/main` stał na `cfe0aed`) i ścieżka „wysokie ryzyko bez dostępnego recenzenta"
— nie było takiego PR-a.

**Drobna lekcja z narzędzia.** `gh api graphql ... --jq '...$id...'` wywala się na
„variable not defined: $id" — to błąd **jq**, nie GraphQL-a: `$id` jest podstawiane przez
`-F` do zapytania, ale w filtrze `--jq` to niezdefiniowana zmienna jq. Komunikat wygląda
jak odrzucenie mutacji, a mutacja była w porządku.

Stan na koniec sesji: PR #1 stoi na `a185621`, CI zielone, 0/8 wątków otwartych,
`mergeStateStatus: CLEAN`. **Aktualnego SHA nie zrecenzował jeszcze nikt** — Codex patrzył
na `361d3ea`, a po nim weszły `613d85e`, `e5dd3ca` i `a185621`. Według zasad z tego PR-a to
„czeka na recenzję aktualnego SHA", nie „bez uwag"; drugie przejście odpala komentarz
`@codex review`. Linia „ostatni SHA zrecenzowany przez GPT" nadal `nieustalony`.

**Druga recenzja Codex, już po napisaniu tego wpisu** — na `a185621`, **6 ustaleń, wszystkie
P2**, wszystkie w skillach i wszystkie prawdziwe. Jedno jest poważne, bo przewraca regułę,
którą w tej sesji wprowadzaliśmy:

1. **Zakleszczenie przy wysokim ryzyku** (`/sv-start`) — PR wysokiego ryzyka czekający na
   recenzenta **z definicji** ma niezrecenzowany `headRefOid`, więc zawsze wpada w punkt 1
   mojego pierwszeństwa i dostaje `/sv-review`, a ten skill przy braku recenzji się
   zatrzymuje. Punkt 2 — „weź niezależne zadanie o niższym ryzyku" — nigdy się nie
   wykona. Czyli instrukcja robi dokładnie to, czemu miała zapobiec: **brak recenzenta
   blokuje dalszą pracę.** Kolejność trzeba odwrócić.
2. **Reakcja 👍 nieodczytywana** (`/sv-start`) — sam opisałem, że Codex przy braku uwag
   zostawia reakcję, ale żadne z moich zapytań jej nie pobiera (`reactionGroups` jest
   osobno od `--comments`). Recenzja bez uwag byłaby raportowana jako „brak recenzji".
3. **`CHANGES_REQUESTED` bez wątku** (`/sv-start`) — review w samej treści, bez komentarza
   do linii, przechodzi mój warunek (review istnieje, 0 otwartych wątków) i skill
   zaproponowałby nowe zadanie. Trzeba sprawdzać **stan** review, nie samo istnienie.
4. **`mergeable` niepobierane** (`/sv-review`) — krok 5 każe rebase'ować „tylko gdy PR nie
   jest `MERGEABLE`", a krok 1 tego pola nie czyta. Poprawki wejdą, PR zostanie
   skonfliktowany.
5. **Ukończona praca z `wip/*`** (`/sv-koniec`) — reguła „`wip/*` nie dostaje PR-a" jest
   bezwarunkowa, więc praca podjęta z `wip/` i **skończona** nigdy nie trafi do obiegu
   recenzji. Trzeba ją przemianować na docelowy prefiks.
6. **Skille to nie proza** (`/sv-koniec`) — mój wiersz w tabeli „wyłącznie dokumentacja lub
   instrukcje → nic się nie uruchamia" dotyczy plików, które **wykonują** polecenia gita
   i API. A skoro zmiana samych `.md` nie dostaje też runu CI, błąd w komendzie dojedzie
   nietknięty do następnej sesji. W tej sesji wpadłem w to dwa razy — oba razy
   „nic nie uruchamiam, bo to dokumentacja".

Ustalenia 1 i 6 są w praktyce najważniejsze: pierwsze wprost przeczy wymaganiu
„brak recenzenta nie blokuje pracy", drugie podważa sposób, w jaki weryfikowałem
całą tę sesję.

**Następne:** **`/sv-review` na PR #1** — sześć otwartych ustaleń P2 z drugiej recenzji
Codex, zaczynając od zakleszczenia przy wysokim ryzyku (punkt 1 wyżej), bo ono przeczy
zasadzie, którą ten PR wprowadza. **Merge dopiero po tym** — zatwierdzanie reguł
z zakleszczeniem w środku nie ma sensu. Potem **K3 — schemat portfela w Supabase**: tabele
`portfolio` i `transactions` z RLS ograniczonym do właściciela. K3 to **wysokie ryzyko**
(RLS i uprawnienia), więc jego PR czeka na dodatkowy przegląd przed merge — i to będzie
pierwszy prawdziwy test tej ścieżki.


## 2026-10-22 — Jednolity obieg PR i recenzji

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Role zapisane w `AGENTS.md`** — nowa sekcja „Collaboration": ChatGPT przygotowuje
  zadanie i metodologię, Claude Code implementuje, Codex recenzuje, Kamil zatwierdza merge
  konkretnego PR-a. Pod tabelą siedem zasad: wszystko przez PR (instrukcje agentów też),
  zadanie ma cel + zakres + kryteria akceptacji + sposób weryfikacji, w trakcie review autor
  nie dotyka gałęzi, review celuje w konkretny SHA, po poprawce ponowne sprawdzenie
  odpowiedniego zakresu, cisza recenzenta to „nierecenzowane", merge decyzją Kamila.
- **`Code review rules`** — priorytety według skutku błędu. **P1** (blokuje merge): izolacja
  danych i sekrety, poprawność walut/jednostek/okresów/źródeł, brak danych nie udaje zera
  ani pozytywnej oceny (klasa D4a), prognoza odróżniona od raportu, operacja zakończona
  błędem nie raportuje sukcesu. **P2**: tłumaczenia, dark mode, `SITE_URL`, zależności,
  bash 3.2, `noindex` w dwóch miejscach, migracja bez noty w `DATA.md` — wprost napisane,
  że naruszenie konwencji **nie jest automatycznie P1**. **P3**: uwagi, autor może odrzucić
  z uzasadnieniem. Poza zakresem review: metodologia i suwaki DCF nie są potwierdzeniem
  zgodności prawnej w żadną stronę — KNF i doradztwo idą do Kamila jako pytanie.
- **`Workflow` przepisany** — każda ręczna zmiana przez gałąź i PR, na `main` pisze wyłącznie
  bot, nazwy gałęzi niosą typ commita, rebase na `origin/main` przed pushem jako reguła.
- **`Finishing a task`** — pięciopunktowy raport z zadania (co i dlaczego, wynik sprawdzeń
  wraz z ograniczeniami, wyjaśnienie programistyczne, wyjaśnienie finansowe gdy dotyczy,
  jedna rzecz do sprawdzenia przez Kamila).
- **Skille przestawione na PR-y.** `/sv-start` pokazuje otwarte PR-y, status CI i nierozwiązane
  uwagi; `/sv-koniec` kończy na PR-ze i ma zakaz `gh pr merge`; nowy **`/sv-review`** zbiera
  wszystkie trzy rodzaje uwag (ogólne, `reviews`, komentarze do linii), dzieli je na
  potwierdzone w zakresie → poprawia bez pytania, sporne → uzasadnia, poza zakresem →
  oddaje Kamilowi, a na koniec uruchamia sprawdzenia dopasowane do zmiany i wskazuje nowy SHA.
- **`.claude/settings.json`** — do `allow` dopisane **tylko odczytowe** komendy `gh`
  (`pr list/view/diff/checks`, `run list/view`, `auth status`) plus `git rebase` i
  `git rev-parse`. `gh pr create` został na pytanie za każdym razem.
  ⚠️ **Sprostowanie (wpis z 2026-10-22, sesja 2):** napisałem tu, że `gh api` też pyta
  za każdym razem — to było nieprawdą. Nie było go w `settings.json`, ale wstawiłem
  `Bash(gh api *)` do `allowed-tools` w `/sv-start` i `/sv-review`, a to przyznaje dostęp
  bez pytania. Codex zgłosił to jako P1; wildcard usunięty z oby dwu skilli.
- **Roadmapa** — nowe **F6** w Bramce 0, „gotowe, gdy" na pierwszy pełny obieg PR-a; domyka
  to też nieprzetestowany warunek z F5 (ścieżka `pull_request` w `ci.yml`).

**Decyzje.**

- **Codex CLI nie jest instalowany** — nie ma go na Macu (sprawdzone `PATH`, `npm ls -g`,
  brew formuły i kaski, `~/.codex`, `~/.config/codex`). Pakiet `@openai/codex` istnieje
  (0.163.0), ale instalacja wymaga zgody i `codex login`. Do tego czasu rolę recenzenta
  obsługuje Codex w przeglądarce na diffie z PR-a — `/sv-review` działa niezależnie, bo
  czyta komentarze przez `gh`, nie przez Codex. **Lokalnego review nie uruchomiono.**
- **Brak runu CI to brak sprawdzenia, nie zaliczenie.** Oba skille mają obowiązek
  rozróżniać „zielone / czerwone / brak runu". Przy okazji poprawka mojej własnej
  pomyłki: zapowiedziałem, że ten PR nie dostanie runu, a dostał i jest zielony.
  `paths-ignore` pomija build tylko wtedy, gdy **wszystkie** zmienione pliki pasują do
  wzorca — a tu zmienił się też `.claude/settings.json`, który nie jest `.md`. Zasada
  w `AGENTS.md` została doprecyzowana.

**Sprawdzone na żywo.** **PR #1 — pierwszy w tym repo** (`gh pr list --state all` był
pusty). Ścieżka `pull_request` w `ci.yml` **działa**: oba runy (`push` i `pull_request`)
zielone, 47 s i 33 s. Poza CI odezwały się dwa sprawdzenia, o których nie wiedziałem, że są
na repo wpięte: **Cloudflare Pages** (deployment podglądowy, `pass`) i **GitGuardian Security
Checks** (`pass`). `npm run build` lokalnie przeszedł (`28 URLs`, chunk 602,67 kB).

**Do sprawdzenia.** Druga połowa warunku z F5 — że PR z zepsutym importem dostaje czerwony
status — nadal **nieprzetestowana**; zielone CI na zmianie dokumentacyjnej tego nie dowodzi.
Recenzji na PR #1 nie ma (0 `reviews`, 0 komentarzy do linii), czyli obieg jest przejechany
w połowie: gałąź → PR → CI. Brakuje recenzji, poprawek i merge'a. Żaden skill nie został
odpalony — kroki wykonałem ręcznie, więc sama treść `/sv-start` i `/sv-review` jest
niesprawdzona w boju.

**Następne:** przejść ten obieg po raz pierwszy na prawdziwym zadaniu — recenzja tego PR-a
przez Codex, poprawki przez `/sv-review`, merge decyzją Kamila; przy okazji potwierdzi się
F6 i warunek z F5. Potem z dziennika D8: UI pod nowe dane — `BalanceSheet.jsx`
i `CashFlowStatement.jsx` pod nowe pola (`inventory`, `netPPE`, `retainedEarnings`,
`currentDebt`) i podpis jednostki (U10: Pepco w EUR).


## 2026-09-20 — D8: bilans i przepływy jednak są, tylko pod innym endpointem

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Endpoint przepisany na `fundamentals-timeseries`** (`5263274`). Moduły `*History`
  w `v10/quoteSummary` są wypatroszone — stąd fałszywy obraz z U6. Timeseries oddaje
  komplet i **nie wymaga crumba ani cookie**, wystarczy `User-Agent`. Crumb został
  wyłącznie dla `keyStats` i jest teraz pobierany „w miarę możliwości": gdy padnie,
  sprawozdania i tak wracają.
- **Kontrakt odpowiedzi bez zmian** — klucze wierszy te same, więc `useFinancials`
  i importer działają bez przeróbek. Kanoniczny schemat dostał pola, dla których nie
  było miejsca: `currentDebt`, `inventory`, `retainedEarnings`, `netPPE`,
  `sharesOutstanding` i walutę wiersza.
- **Import do Supabase**: 189 → **243 wiersze**, 218 z bilansem, 212 z przepływami,
  wszystkie 24 spółki. Najnowszy okres przesunął się z `2026-03-31` na `2026-07-31`.
- **Ochrona `verified` sprawdzona na żywo**: zaznaczony PKO FY2024 został pominięty
  („Pominiętych jako verified: 1") i jako jedyny nie dostał bilansu, dopóki nie zdjąłem
  flagi. Drugi przebieg bez duplikatów (243 → 243).
- **Importer**: waluta z danych zamiast wpisanej na sztywno, 300 ms przerwy między
  spółkami.
- **Dokumentacja** (`eaf1c36`) — U6 oznaczone jako nieaktualne z odesłaniem do U9,
  nowe U9 i U10, decyzja D8 z kosztem, D8 odhaczone w roadmapie.

**Decyzje.**

- **Źródłem bilansu i przepływów jest Yahoo `fundamentals-timeseries`, koszt 0 zł.**
  EODHD (59,99 USD/mc) odrzucone — nie ma za co płacić, dopóki to działa; zostaje jako
  plan awaryjny. Import z ESPI odłożony (PDF-y i XML-e w niejednolitych formatach,
  parser byłby projektem samym w sobie). Panel `/admin/financials` zostaje do korekt,
  nie jako podstawowe źródło.
- **Założenie z D2 obroniło się w całości** — brakowało nie danych, tylko właściwego
  endpointu. U6 zostaje w dokumencie jako zapis błędnej diagnozy, bo z niej wzięły się
  D4a i część decyzji z D2.

**Do sprawdzenia.** **U10: Pepco raportuje w EUR** (5,6 mld przychodu), a tabele na
stronie spółki są podpisane „mln PLN" — dane mają walutę w bazie, UI jej nie używa.
Pliki w `public/data/financials/` mają nadal stare, chude dane — odświeży je sobotni
`update-financials.yml` albo `npm run export-financials`. Nic nie oglądane w przeglądarce
(Chrome nie łączy się z localhostem).

**Następne:** UI pod nowe dane — zakładki Bilans i Przepływy wreszcie mają co pokazywać,
więc warto przejrzeć `BalanceSheet.jsx` i `CashFlowStatement.jsx` pod kątem nowych pól
(`inventory`, `netPPE`, `retainedEarnings`, `currentDebt`) i podpisu jednostki (U10).
Potem Bramka 4 — redesign, od R0, po review przez coworka.


## 2026-09-20 — Poprawki po przeglądzie: wydajność, CI, SEO

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **Zera w imporcie** (`ea76e46`) — `stripMeta()` wyrzucało każde zero, a klient robi to
  tylko dla pól z `YAHOO_ZERO_MEANS_MISSING`. Stała jest teraz eksportowana i używana po
  obu stronach, więc prawdziwe zero (np. zerowy dług) przestanie znikać z bazy.
- **Leniwe trasy** (`0de684b`) — `React.lazy` dla wszystkich stron poza `HomePage`,
  `Suspense` z zastępnikiem bez własnego tła. Główny chunk 744,0 → 602,9 kB, wydzieliło
  się 10 plików (największy `StockPage`, 85,3 kB).
- **Liczby w panelu** (`8612758`) — `Number("12,5")` dawało `NaN` i wpisana wartość cicho
  ginęła. Nowe `parseNumber()` radzi sobie z przecinkiem i spacjami (też niełamliwą
  i wąską, jakie wkleja Excel); błędne pole dostaje czerwoną ramkę i blokuje zapis.
  Input musiał przejść z `type="number"` na `type="text"` + `inputMode="decimal"`.
- **noindex nagłówkiem** (`59edcba`) — `X-Robots-Tag` dla `/watchlist` i `/admin/*`
  w `public/_headers`; meta z `App.jsx` zostaje jako druga warstwa.
- **Rozdzielone workflow** (`87df15a`) — sprawozdania mają własny tygodniowy
  `update-financials.yml` (sobota 06:00 UTC), `update-prices.yml` wrócił do samych
  notowań, bez `npm ci`.
- **Dane strukturalne** (`27c20ab`) — `url` w `Corporation` to teraz strona spółki,
  podstronę wskazuje `mainEntityOfPage`, `sameAs` usunięte jako duplikat.
- **Dokumentacja** (`d0d0834`) — D8 w roadmapie, trzy fakty w `AGENTS.md`.

**Decyzje.**

- **Sprawozdania raz w tygodniu, nie codziennie** — zmieniają się kwartalnie, a codzienny
  przebieg to tylko ryzyko dla danych i zużycie limitów.
- **`noindex` w dwóch miejscach celowo** — nagłówek dla robotów bez JS, meta jako
  zabezpieczenie. W `AGENTS.md` jest notatka, żeby zmieniać oba albo żaden.

**Do sprawdzenia.** Główny chunk ma 602,9 kB, czyli powyżej progu 537 kB z promptu — ta
liczba pochodziła ze starszego stanu repo. Zejście niżej wymaga `manualChunks` albo
dociągania klienta Supabase dopiero przy logowaniu; czeka na decyzję. Wzrokowo nadal nic
nie sprawdzone (Chrome nie łączy się z localhostem): spinner `Suspense` i czerwona ramka
w panelu, oba motywy.

**Następne:** **D8 — skąd wziąć bilans i przepływy**: wybrać między płatnym dostawcą
(EODHD 59,99 USD/mc), importem z ESPI a ręcznym wpisywaniem przez `/admin/financials`.
Potem Bramka 4 — redesign, od R0, po review przez coworka.


## 2026-09-20 — Bramka 1 (Dane) i Bramka 3 (SEO) domknięte

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **S1** (`047dc95`) — `stockview.org` jedyną domeną kanoniczną. Nowy `src/config/site.js`
  z `SITE_URL`, poprawione canonical/OG, sitemapa, `robots.txt`, CSP i CORS.
  DNS `www` + 301 skonfigurowane ręcznie w Cloudflare, zweryfikowane `curl`-em.
- **D1** (`b5e0533`) — audyt źródeł w nowym `docs/DATA.md`: tabela „pole → źródło →
  częstotliwość → kto aktualizuje" plus ustalenia U1–U8.
- **D1a** (`fd0b82f`) — Yahoo podaje `endDate` raz jako `{raw, fmt}`, raz jako liczbę;
  przez to `date`/`period` były `null`, a `latest()` liczyło wskaźniki z **najstarszego**
  rocznika (PKO: 2022 zamiast 2025).
- **D2** (`3e0e0b9`) — porównane Yahoo (0 zł), EODHD (59,99 USD/mc), FMP (GPW dopiero
  w Ultimate) i ręczne przepisywanie z ESPI.
- **D3–D7** (`9cd41e6`, `59abea1`, `e89738f`, `b54de11`, `a07dce8`) — tabela `financials`
  w Supabase z RLS, importer z Yahoo (189 wierszy, 24 spółki), eksport na poziom 2,
  panel `/admin/financials`, sygnalizacja świeżości. Bot robi teraz ceny → import →
  eksport → commit.
- **D4a** (`83350b1`) i **`55f1f2c`** — koniec z zerami udającymi dane; trzy komponenty
  sprawozdań przepięte na kanoniczny kształt (szukały `totalRevenue`, dostawały `revenue`),
  a zakładka Przegląd wisiała na sztywno na `wig20.js` i pokazywała 2024E.
- **U2** (`00578c2`) — lista w `fetch-stooq.mjs` wyprowadzona z `TICKER_TO_YAHOO`;
  ALE, BDX, EBP, TPE i ZAB dostały historię, 24/24.
- **S2–S4** (`bb5228d`, `6169270`, `871178c`) — unikalne tytuły wszystkich stron
  (30/30) i `noindex` dla prywatnych, JSON-LD `Corporation` + `FinancialProduct` +
  `BreadcrumbList`, 433 słowa treści na stronie głównej. Sitemapa 25 → 28 URL-i.

**Decyzje.**

- **Dane mieszkają w Supabase, strona czyta pliki statyczne.** Baza zbiera historię,
  której dostawca nie da (Yahoo pokazuje 4 roczniki), a eksport na poziom 2 zostawia
  stronę bez zależności runtime. Klient nie wymagał żadnej zmiany — `useFinancials`
  czytał ten poziom od początku, katalogi były tylko puste.
- **Yahoo zostaje, EODHD w odwodzie** — 60 USD/mc za 24 spółki to ~3000 zł rocznie na
  darmowy serwis. Wyzwalacze zmiany zapisane w `docs/DATA.md`.
- **`verified = true` chroni ręczne poprawki** przed importerem — dzięki temu ręczne
  wpisywanie danych jest warstwą wiarygodności, a nie jedyną metodą.

**Do sprawdzenia.** Nic nie oglądałem w przeglądarce — Chrome w tej sesji nie łączył
się z localhostem. Do review: zakładka Sprawozdania (PKO, Orlen), panel
`/admin/financials` po zalogowaniu, pasek świeżości w obu motywach, wygląd
`HomeContent` na telefonie. JSON-LD do potwierdzenia w Rich Results Test.

**Następne:** Bramka 4 — redesign, zaczynając od **R0 (zamrożenie zakresu)** po review
przez coworka; wcześniej można zrobić **R1** (inwentaryzacja klas z `@layer components`
w `src/index.css`), bo to analiza kodu, nie wygląd. Otwarte z audytu: **U6** — Yahoo
nie daje bilansu ani przepływów, więc te tabele są puste do czasu wpisów przez D6.


## 2026-09-20 — Domknięcie testu synchronizacji Mac ↔ PC

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- `npm run sync` ściągnął z `origin/main` 2 commity z PC (`8452384..e92c7a9`), w tym
  `docs/SYNC-TEST.md` — wymiana Mac ↔ PC przez GitHub potwierdzona, test zamknięty.
- Usunięty `docs/SYNC-TEST.md` (`git rm`).
- `npm run build` zielony, sitemapa 25 URL-i.

**Do sprawdzenia przy okazji.** Warunek akceptacji F5 (PR z zepsutym importem → czerwony
status CI) nadal nieprzetestowany.

**Następne:** D1 — audyt źródeł (Bramka 1). Wyjść od `normalizeFinancials()` w
`src/data/financialSchema.js` i trzech poziomów `useFinancials`, spisać do nowego
`docs/DATA.md` tabelę „pole → źródło → częstotliwość → kto aktualizuje".


## 2026-09-20 — Test synchronizacji Mac ↔ PC

Komputer: `KamilAMD`

**Zrobione.**

- Start sesji: `npm run sync` przeszedł bez ostrzeżeń, `main` zgodna z `origin/main`, brak gałęzi `wip/*`.
- Dodany `docs/SYNC-TEST.md` (commit `f9b9ed8`, wypchnięty na `main`) — plik testowy do sprawdzenia
  wymiany przez GitHub między PC a Makiem.
- `npm run build` zielony, sitemapa 25 URL-i.

**Do sprawdzenia przy okazji.** Na Macu `npm run sync` powinien ściągnąć `docs/SYNC-TEST.md`
i `git log --oneline -1` pokazać `f9b9ed8`. Po potwierdzeniu usunąć plik (`git rm docs/SYNC-TEST.md`).
Warunek akceptacji F5 (PR z zepsutym importem → czerwony status) nadal nieprzetestowany.

**Następne:** D1 — audyt źródeł (Bramka 1). Wyjść od `normalizeFinancials()` w
`src/data/financialSchema.js` i trzech poziomów `useFinancials`, spisać do nowego
`docs/DATA.md` tabelę „pole → źródło → częstotliwość → kto aktualizuje". Na Macu najpierw
potwierdzić test synchronizacji i usunąć `docs/SYNC-TEST.md`.

## 2026-09-20 — Foundation domknięta: rytuał sesji, AGENTS.md, CI

Komputer: `MacBook-Pro-Kamil.local`

**Zrobione.**

- **F3 — rytuał sesji.** `scripts/sync.sh` (`npm run sync`): fetch --prune, pull --rebase
  --autostash, warunkowe `npm ci`, kontrola wersji Node, przypomnienie z dziennika i
  roadmapy. Do tego skille `/sv-start` i `/sv-koniec` w `.claude/skills/`. Commit
  [`719f1ec`](https://github.com/Kuchaar/stockview/commit/719f1ec).
- **F4 — AGENTS.md.** Wspólny kontekst dla Codeksa i Claude Code: architektura, trasy,
  trzypoziomowy przepływ danych, konwencje, workflow. `CLAUDE.md` importuje go przez
  `@AGENTS.md` i dokłada tylko notatki specyficzne dla Claude'a, bez duplikacji treści.
  Commit [`6fe18ec`](https://github.com/Kuchaar/stockview/commit/6fe18ec).
- **F5 — CI.** Nowy `.github/workflows/ci.yml`: `npm ci` + `npm run build` na każdy push
  i PR, `paths-ignore` na `public/data/**`, `docs/**`, `**/*.md`, `concurrency` z
  `cancel-in-progress`, `node-version-file: .nvmrc`, `cache: npm`, `permissions: contents: read`.
  W obu workflow `checkout` i `setup-node` podbite z v4 na v7. Badge CI w README.
  Commit [`5821d2a`](https://github.com/Kuchaar/stockview/commit/5821d2a).
  Weryfikacja: run 35503133576 zielony w 24 s na `node v22.23.2`; ręczny dispatch bota
  (run 35503165573) zielony w 25 s, też na v22.23.2, commit `e6aa953` wypchnięty.
  Commit bota z `public/data/**` **nie** odpalił CI — `paths-ignore` działa.
- **Sprzątanie gałęzi.** Usunięte `claude/xenodochial-elgamal` i `rescue/pc`; na GitHubie
  została sama `main`.
- **README.** Wiersz o `AGENTS.md` obiecywał plik „w F4", a ten istnieje — zamieniony na
  link. Commit [`0f3afdd`](https://github.com/Kuchaar/stockview/commit/0f3afdd).

**Decyzje.**

- F3 zrealizowany jako skrypt + skille zamiast zapowiadanego `docs/SESSION.md`. Instrukcja
  do czytania starzeje się w ciszy; `npm run sync` albo przechodzi, albo krzyczy. Warunek
  „gotowe, gdy" w roadmapie poprawiony pod to, co faktycznie powstało.
- Akcje podbite od razu na v7 (checkout v7.0.1, setup-node v7.0.0), nie na v5. Przejrzałem
  changelogi majorów po drodze: v5 przenosi runner na Node 24, checkout v6 trzyma
  credentiale w osobnym pliku, setup-node v5/v6 zmienia automatyczne cache'owanie. Żadna
  z tych zmian nas nie dotyczy — push bota działa, `cache: npm` ustawiamy jawnie.
- CI ma `permissions: contents: read`. Build niczego nie zapisuje, a workflow odpala się
  też z PR-ów.

**Do sprawdzenia przy okazji.** Warunek akceptacji F5 — PR z celowo zepsutym importem
dostaje czerwony status — nie został przetestowany. Ścieżka `pull_request` jest w
workflow, ale pierwszy PR pokaże, czy faktycznie blokuje merge.

**Następne:** D1 — audyt źródeł (Bramka 1). Wyjść od `normalizeFinancials()` w
`src/data/financialSchema.js` i trzech poziomów `useFinancials`, spisać do nowego
`docs/DATA.md` tabelę „pole → źródło → częstotliwość → kto aktualizuje".

## 2026-09-20 — Foundation: spójne środowisko Mac/PC + pamięć projektu

Komputer: `MacBook-Pro-Kamil.local` (macOS, zsh)

**F1 — środowisko.** Projekt budował się różnie na Macu, na PC i na Cloudflare, bo nic nie
pinowało wersji Node ani końców linii. Domknięte:

- `.nvmrc` → `22` i `"engines": { "node": ">=22" }` w `package.json`.
- `.github/workflows/update-prices.yml` czyta teraz `node-version-file: '.nvmrc'` zamiast
  pinować Node 20 (EOL 30.04.2026) — CI, Cloudflare i oba komputery mają jedno źródło prawdy.
- `.gitattributes` (`* text=auto eol=lf` + binaria) i `.editorconfig`. `git add --renormalize .`
  nie zmienił ani jednego pliku — repo i tak było całe na LF.
- `.gitignore`: `.claude/settings.local.json`, `.claude/worktrees/`, `CLAUDE.local.md`, `*.log`,
  `.vscode/*` z wyjątkiem `extensions.json`, oraz `* 2.*` na duplikaty od iCloud/Findera.
- `.claude/settings.local.json` wypadł ze śledzenia (`git rm --cached`, plik został na dysku),
  a wspólny `.claude/settings.json` wszedł do repo — plugin `frontend-design` plus allowlista
  poleceń. Bez `git push`, `git reset`, `npm install` i `curl` — te mają dalej pytać o zgodę.
- Lockfile przeliczony: zniknęło martwe drzewo po `react-snap` (puppeteer, express, cheerio…),
  **−1678 linii**. To był realny błąd, nie kosmetyka: root lockfile wciąż trzymał `react-snap`
  w devDependencies, którego nie ma w `package.json`, więc **`npm ci` padało**. Teraz przechodzi.
- Usunięty Homebrew `node` 25.8.2 z `/usr/local/bin`. Był liściem, nic od niego nie zależało,
  a wygrywał wszędzie tam, gdzie nie wykonuje się `.zshrc` — w skryptach `sh`, cronie i
  narzędziach odpalanych z GUI. fnm jest teraz jedynym źródłem Node na Macu.

Commit: [`1f55db9`](https://github.com/Kuchaar/stockview/commit/1f55db9)

**F2 — pamięć projektu.** Wszystko, czego potrzeba, żeby wrócić do pracy na dowolnym
komputerze, wjechało do repo: ten dziennik, `docs/ROADMAP.md`, `docs/SETUP.md`,
archiwum promptów w `docs/prompts/` i mockup w `docs/design/`.

Przy okazji wyszła rzecz do naprawy: cała aplikacja — canonical, OG, CSP w `public/_headers`,
`BASE_URL` w `scripts/generate-sitemap.mjs` — wskazuje na `stockview.pages.dev`, a docelowa
domena to `stockview.org`. Dopóki się to nie zgadza, Google indeksuje domenę techniczną.
Zadanie wylądowało w Bramce 3.

**Następne:** F3 — rytuał sesji (jak zaczynać i kończyć pracę na dowolnym z dwóch komputerów,
żeby dziennik i roadmapa nie rozjeżdżały się z kodem).

---

## 2026-04-29 … 2026-05-01 — Wpis historyczny: od stabilizacji do screenera

Spisane wstecz z `git log`, żeby dziennik nie zaczynał się w próżni.

**29.04 — gaszenie pożaru.** `react-snap` wywalał build w Cloudflare Pages i blokował
wszystkie deploye przez 21 dni — wyleciał z builda ([`f077c4f`](https://github.com/Kuchaar/stockview/commit/f077c4f)).
Tego samego dnia error boundaries, zabezpieczenia przed `null`, baner ze źródłem danych
i porządki wokół Supabase ([`718520d`](https://github.com/Kuchaar/stockview/commit/718520d)).
Ogon po tym usuwaniu — osierocone wpisy w `package-lock.json` — domknęliśmy dopiero w F1.

**30.04 — dane.** Pipeline danych finansowych z trzypoziomowym fallbackiem, kanonicznym
formatem i konwerterem CSV ([`08833f1`](https://github.com/Kuchaar/stockview/commit/08833f1)),
a na nim silnik wskaźników z panelem `MetricsPanel` ([`6044b92`](https://github.com/Kuchaar/stockview/commit/6044b92)).

**01.05 — cztery funkcje w jeden dzień.** Własny wykres SVG zamiast widgetu TradingView
plus 5 brakujących spółek → 24 ([`ce948bf`](https://github.com/Kuchaar/stockview/commit/ce948bf)),
wskaźniki AT na tym wykresie: SMA, EMA, RSI, MACD, Bollinger ([`8fb631d`](https://github.com/Kuchaar/stockview/commit/8fb631d)),
profile spółek z zakładką „O spółce" ([`66de261`](https://github.com/Kuchaar/stockview/commit/66de261)),
porównywarka ([`346bf2d`](https://github.com/Kuchaar/stockview/commit/346bf2d))
i screener z filtrami, presetami i sortowalną tabelą ([`3166385`](https://github.com/Kuchaar/stockview/commit/3166385)).

Prompty do tych zadań: [`docs/prompts/`](prompts/README.md).

**Następne:** kolejne funkcje analityczne — tak to wtedy wyglądało. W praktyce przez cztery
miesiące repo dostawało wyłącznie automatyczne commity z cenami, stąd F1 i F2: powrót do pracy
nie ma się zaczynać od odtwarzania kontekstu.
