# Roadmapa StockView

Bramka = spójny kawałek produktu, który da się wypuścić. Zadania pocięte na ~40 minut —
tyle, ile realnie trwa jedna sesja z Claude Code. Każde zadanie ma warunek „gotowe, gdy…",
żeby dało się je zamknąć bez dyskusji.

Legenda: `[x]` zrobione · `[ ]` do zrobienia

---

## Bramka 0 — Foundation

Fundament pracy na dwóch komputerach. Nie dodaje funkcji, ale bez niego każda sesja
zaczyna się od odtwarzania kontekstu.

- [x] **F1 — spójne środowisko Mac/PC** · [`1f55db9`](https://github.com/Kuchaar/stockview/commit/1f55db9)
  Node 22 przez `.nvmrc` + `engines`, LF przez `.gitattributes`, `.editorconfig`,
  wspólne `.claude/settings.json`, lockfile bez `react-snap`.
  *Gotowe, gdy:* `npm ci && npm run build` przechodzi na obu komputerach, a `node -v`
  w katalogu projektu daje v22.x.
- [x] **F2 — pamięć projektu w repo**
  Dziennik, roadmapa, instrukcja setupu, archiwum promptów, mockup w `docs/design/`.
  *Gotowe, gdy:* na świeżym komputerze da się postawić projekt wyłącznie z `docs/SETUP.md`.
- [x] **F3 — rytuał sesji** · [`719f1ec`](https://github.com/Kuchaar/stockview/commit/719f1ec)
  Rytuał jest wykonywalny, nie do czytania: `scripts/sync.sh` (`npm run sync`) plus skille
  `/sv-start` i `/sv-koniec`. Zamiast zapowiadanego `docs/SESSION.md` — instrukcja do
  czytania starzeje się w ciszy, skrypt albo przechodzi, albo krzyczy.
  *Gotowe, gdy:* `npm run sync` przechodzi na obu komputerach, a `/sv-start` i `/sv-koniec`
  są w `.claude/skills/`.
- [x] **F4 — `AGENTS.md`** · [`6fe18ec`](https://github.com/Kuchaar/stockview/commit/6fe18ec)
  Instrukcja dla Claude Code i innych agentów: konwencje, czego nie ruszać, jak testować.
  *Gotowe, gdy:* `AGENTS.md` w katalogu głównym, a `CLAUDE.md` nie duplikuje jego treści —
  importuje go przez `@AGENTS.md`.
- [x] **F5 — CI na każdy push i PR** · [`5821d2a`](https://github.com/Kuchaar/stockview/commit/5821d2a)
  `.github/workflows/ci.yml` odpala `npm ci && npm run build` na Node z `.nvmrc`, z
  `paths-ignore` na commity bota i dokumentację. Akcje w obu workflow podbite v4 → v7.
  *Gotowe, gdy:* push daje zielony run w Actions — ✅ run 35503133576 na `node v22.23.2`.
  ⚠️ Pierwotny warunek (PR z zepsutym importem dostaje czerwony status) **nieprzetestowany**
  — ścieżka `pull_request` jest w workflow, zweryfikuje ją pierwszy prawdziwy PR.

- [x] **F6 — jednolity obieg PR i recenzji** (~40 min)
  · [`bd40d3a`](https://github.com/Kuchaar/stockview/commit/bd40d3a) (PR #1) · [`877e46b`](https://github.com/Kuchaar/stockview/commit/877e46b) (PR #5)
  Podział odpowiedzialności (Kamil — cele i zgoda na merge; Claude Code — bieżąca praca,
  propozycje zadań, implementacja, testy, PR-y; GPT — okresowe przeglądy, architektura
  i metodologia finansowa), **dobór recenzji do ryzyka**, zasady P1–P3, sekcja przekazania
  do przeglądu GPT i krótki raport z zadania — wszystko w `AGENTS.md`. Skille `/sv-start`,
  `/sv-koniec` i `/sv-review` obsługują PR-y przez `gh`.
  *Gotowe, gdy:* pierwszy prawdziwy PR przechodzi cały obieg — gałąź → PR → **review
  zakończone wskazaniem sprawdzonego SHA i ograniczeń weryfikacji (z uwagami albo bez)**
  → jeśli były uwagi, poprawki z nowym SHA i ponownym sprawdzeniem dotkniętego zakresu
  → merge za zgodą Kamila. Warunek **nie wymaga znalezienia błędu** — recenzja bez uwag
  zalicza obieg tak samo.
  **Zamknięte 2026-10-23 — obieg przeszedł pięć PR-ów, dwa razy w pełnej postaci.**
  [PR #1](https://github.com/Kuchaar/stockview/pull/1) przeszedł cały warunek: gałąź → PR →
  CI zielone → **cztery rundy recenzji Codex, 26 ustaleń**, wszystkie naprawione, 26/26 wątków
  zamkniętych → merge za zgodą Kamila (`bd40d3a`, bez squasha, żeby odnośniki do SHA
  w dzienniku nie prowadziły w nicość).
  [PR #5](https://github.com/Kuchaar/stockview/pull/5) przeszedł go **już według nowych zasad**,
  i to jest mocniejszy dowód niż PR #1, bo PR #1 powstał razem z regułami, a PR #5 je tylko
  stosował: poziom ryzyka w opisie (**wysokie** — sekrety i źródło danych), **jedna** runda
  `@codex review` z nazwanym celem, jedna uwaga **P2**, poprawka z nowym SHA
  [`c477fe2`]({C}/c477fe2), ponowne sprawdzenie **dotkniętego zakresu** (audyt grepem, bez
  powtarzania testów kodu, którego zmiana nie ruszała), wątek zamknięty mutacją
  `resolveReviewThread`, nowy SHA podany w komentarzu, **bez** proszenia o drugą rundę →
  merge za zgodą Kamila.
  Po drodze obieg wyłapał też swoje własne błędy i je naprawił: PR #4 wymagał rebase'u przy
  prawdziwym `CONFLICTING` i pokazał, że `--force-with-lease` działa; PR #2 i #4 pokazały,
  że PR z samych plików `.md` **nie dostaje runu** `build`, co jest brakiem sprawdzenia,
  nie zaliczeniem.
  Przy okazji zamknęła się pierwsza połowa warunku z F5: ścieżka `pull_request` w `ci.yml`
  odpaliła się i jest zielona. Druga połowa — że PR z zepsutym importem dostaje czerwony
  status — nadal nieprzetestowana.
  ℹ️ Codex działa jako **bot wpięty w repo** (komentuje PR przy otwarciu), nie jako CLI;
  CLI nie jest zainstalowane i nie jest potrzebne. Bot nie jest okresowym przeglądem GPT
  i niczego nie zatwierdza.

---

## Bramka 1 — Dane

Dziś dane finansowe spółek siedzą w ręcznie utrzymywanych plikach JSON i w `src/data/wig20.js`.
To się nie skaluje i cicho starzeje.

- [x] **D1 — audyt źródeł** (~40 min)
  Spisz dla każdego pola (przychód, EBITDA, bilans, `ratios`), skąd dziś pochodzi i jak
  często się zmienia.
  *Gotowe, gdy:* tabela „pole → źródło → częstotliwość → kto aktualizuje" jest w `docs/DATA.md`.
  Wynik: [`docs/DATA.md`](DATA.md) — pięć ustaleń (U1–U5); U3 naprawione w D1a.
  Audyt obejmuje też tabelę `financials` w Supabase, która powstała później — opisują ją
  sekcje „Stan po D3" i „Stan po D5" w tym samym pliku.
- [x] **D1a — naprawa dat w `/api/financials`** (~20 min) — wyszło z audytu D1
  Yahoo zwraca `endDate` jako liczbę, `transformStatements()` czeka na `.fmt` — przez to
  `date`/`period` są `null`, a `latest()` bierze najstarszy rocznik zamiast najnowszego.
  *Gotowe, gdy:* `/api/financials?symbol=PKO.WA` ma `date` i `period` w każdym wierszu,
  a wskaźniki na stronie spółki liczą się z ostatniego rocznika.
  Sprawdzone na `wrangler pages dev` dla PKO, CDR, KGH i ZAB: 0 wierszy bez daty.
- [x] **D2 — wybór dostawcy danych fundamentalnych** (~40 min)
  Porównaj 2–3 źródła pod kątem pokrycia GPW, limitów i ceny.
  *Gotowe, gdy:* decyzja z uzasadnieniem zapisana w `docs/DATA.md`.
  Decyzja: własna baza w Supabase, karmiona z Yahoo (0 zł) + ręczne poprawki, eksportowana
  do poziomu 2. EODHD (59,99 USD/mc) w odwodzie — uzasadnienie w [`docs/DATA.md`](DATA.md).
  Warunek „klucz testowy działa" odpadł: wybrane źródło nie ma klucza.
- [x] **D3 — tabela `financials` w Supabase** (~40 min)
  Migracja wg schematu z `docs/DATA.md` + RLS: publiczny `select`, zapis tylko dla admina.
  *Gotowe, gdy:* tabela istnieje, anon ją czyta, ręczny wiersz dla jednej spółki się zapisuje.
  Migracja: `supabase/migrations/20260920120000_financials.sql`, zastosowana na projekcie
  StockView. Sprawdzone: upsert bez duplikatów, trigger `updated_at`, odczyt przez `anon`,
  zapis przez `anon` odrzucony (42501). Uwaga o odmrażaniu projektu — w `docs/DATA.md`.
- [x] **D4 — importer `scripts/import-financials.mjs`** (~40 min)
  Yahoo → `upsert` do Supabase, z pominięciem wierszy `verified = true`.
  *Gotowe, gdy:* po przebiegu 24 spółki mają po 4 roczniki, a drugi przebieg niczego nie psuje
  ani nie duplikuje.
  189 wierszy z 24 spółek, drugi przebieg 189 → 189 bez duplikatów, wiersz `verified` nietknięty.
  Po drodze: U6 (Yahoo oddaje tylko przychód i zysk) i U7 (EBP na martwym `SPL.WA`) — `docs/DATA.md`.
- [x] **D4a — fałszywe zera z Yahoo w UI** (~20 min) — wyszło z D4
  `normalizeFinancials` kopiuje wypełniacze `0` z Yahoo do pól `grossProfit`, `ebit` itd.,
  więc zakładka Finanse pokazuje „0 zł" tam, gdzie danych po prostu nie ma. Przy okazji
  `isBank()` przestaje rozpoznawać banki, bo sprawdza `grossProfit == null`.
  *Gotowe, gdy:* na stronie PKO i CDR nie ma zer udających dane, a banki są rozpoznawane.
  `grossProfit`/`operatingIncome`/`ebitda` wracają jako `null`, `IncomeStatement` chowa całe
  puste wiersze, a `isBank()` idzie po sektorze ze `src/data/wig20.js`.
- [x] **D5 — eksport na poziom 2** (~40 min)
  `scripts/export-financials.mjs` → `public/data/financials/{companyId}/data.json`,
  wpięty w `update-financials.yml` (pierwotnie w `update-prices.yml`).
  *Gotowe, gdy:* przy wyłączonym `/api/financials` strona spółki pokazuje dane z `source: 'manual'`.
  24 pliki (108 kB). Sprawdzone na serwerze dev bez `/api/*`: PKO, CDR i ZAB schodzą na
  `source: 'manual'` z okresami FY2025–FY2022 zamiast na zaszyte dane z 2024 r.
  Bot wymaga dwóch sekretów w repo — patrz `docs/DATA.md`.
- [x] **D6 — panel `/admin/financials`** (~40 min × 2)
  Po wzorze `/admin/dividends`: ręczna korekta wiersza i ustawienie flagi `verified`.
  *Gotowe, gdy:* poprawiona ręcznie liczba przeżywa kolejny przebieg importera.
  Sprawdzone na danych: wiersz `verified` przeszedł import nietknięty (188 zapisanych,
  1 pominięty) i trafił do `public/data/financials/pkobp/data.json` z `sources: [manual, yahoo]`.
  Wygląd panelu do obejrzenia po zalogowaniu — w tej sesji Chrome nie łączył się z localhostem.
- [x] **D7 — sygnalizacja świeżości** (~40 min)
  Data ostatniej aktualizacji per spółka, widoczna na stronie spółki.
  *Gotowe, gdy:* dane starsze niż kwartał są wizualnie oznaczone.
  `DataFreshness` w zakładce Sprawozdania: okres, data jego końca, poziom źródła i ostrzeżenie
  po 92 dniach. Na dzisiejszych danych: 20 spółek aktualnych, 4 oznaczone (PKO, PEP, ACP, JSW).
- [x] **D7a — tabele sprawozdań na kanonicznym kształcie** — zgłoszone przez Kamila po D7
  Trzy komponenty szukały surowych kluczy Yahoo, a „Przegląd" wisiał na `wig20.js`.
  *Gotowe, gdy:* Orlen pokazuje w Przeglądzie FY2022–FY2025 z bazy, a nie 2021–2024E z kodu,
  i nigdzie nie ma zer udających dane. Szczegóły: U8 w `docs/DATA.md`.

- [x] **D8 — skąd wziąć bilans i przepływy** (~40 min)
  Yahoo zdawał się nie mieć bilansu ani przepływów (U6), przez co ROE, C/WK, dług do
  kapitału i płynność nie miały z czego powstać.
  *Gotowe, gdy:* decyzja wraz z kosztem jest zapisana w `docs/DATA.md`, a co najmniej
  jedna spółka ma w bazie wypełniony bilans.
  Okazało się, że dane były przez cały czas — pod innym endpointem: `quoteSummary` jest
  wypatroszony, a `fundamentals-timeseries` oddaje komplet i nie wymaga nawet crumba
  (U9 w `docs/DATA.md`). Wybrane źródło: Yahoo timeseries, **koszt 0 zł**, EODHD odrzucone.
  Po imporcie: 189 → **243 wiersze**, 218 z bilansem, 212 z przepływami, wszystkie 24 spółki,
  najnowszy okres `2026-07-31` zamiast `2026-03-31`. Przy okazji U10: Pepco raportuje w EUR.

- [ ] **D9 — waluta nie dochodzi do ekranu, Pepco pokazane jako PLN** (~40 min) — ryzyko: **wysokie** (waluty)
  Wyszło 2026-10-23 przy sprawdzaniu P0 — **nie jest skutkiem żadnej z dzisiejszych zmian**,
  siedziało tam wcześniej. D8 ustaliło U10 („Pepco raportuje w EUR"), baza to wie
  (`currency = 'EUR'` na 7 wierszach Pepco), ale na ekran ta informacja nie dochodzi:
  - `src/components/FinancialTable.jsx:55` wypisuje nagłówek narożny jako **zaszyte**
    `'mln PLN'` / `'M PLN'` i **w ogóle nie czyta** pola `currency`. Dotyczy **obu** poziomów
    danych, więc tabela Pepco opisuje kwoty w euro jako „mln PLN".
  - `scripts/export-financials.mjs:42` buduje `meta = { date, period }` i **gubi
    `row.currency`**, więc opublikowane pliki poziomu 2 nie mają tego pola wcale
    (sprawdzone na produkcji: `.../financials/pepco/data.json` → `currency: None`).
    Poziom 1 z Yahoo walutę oddaje, poziom 2 nie — czyli zjazd na plik statyczny po cichu
    kasuje informację o walucie.
  To wzorzec **P1** z `AGENTS.md` („poprawność liczb": waluta musi być właściwa; nic nie może
  twierdzić nieprawdy), dlatego zadanie jest w Bramce 1, nie na liście „Później".
  *Gotowe, gdy:* tabela sprawozdań Pepco pokazuje `mln EUR`, a spółek raportujących w złotych
  `mln PLN`, nagłówek bierze walutę z danych, eksport zapisuje `currency` w każdym wierszu
  pliku, i żaden wskaźnik nie dzieli liczby w EUR przez liczbę w PLN.
  *Niesprawdzone:* czy któryś wskaźnik już dziś miesza EUR z kapitalizacją w złotych —
  `src/data/ratioCalculator.js` używa słowa `currency` tylko jako nazwy formatu, więc osłony
  walutowej tam nie widziałem, ale pełnej ścieżki liczb nie przeszedłem.
---

## Bramka P — prywatność i bezpieczeństwo

**Idzie przed Bramką 2.** Strona już przetwarza dane osobowe (konta, watchlista), a portfel
z Bramki 2 zbierze ich więcej — [`docs/VISION.md`](VISION.md), Zasada 6. Na produkcji dwie
rzeczy nie działają, więc najpierw to (baza, poczta), potem ograniczenie danych wysyłanych
na zewnątrz i język ocen, a polityka prywatności na końcu, kiedy wiadomo, jakie usługi
zostają. 12 zadań po 20–40 minut, razem ok. 8 godzin.

Źródło: dokument „StockView — prawo, prywatność i bezpieczeństwo" (22.10.2026, sprawdzony
niezależnym agentem): <https://claude.ai/artifact/VoRrL6fWcfYEwmV8h4ARPV>

Poziom ryzyka stoi przy każdym zadaniu i wynika z `AGENTS.md` → „Review by risk", nie
z rozmiaru zmiany: **wysokie** dostaje jedną rundę `@codex review` przed merge'em,
**zwykłe** wymaga osobnej sesji Claude, **niskie** kończy się moim własnym review wpisanym
w opis PR-a.

- [x] **P0 — wybudzić bazę i zablokować usypianie** (~20 min) — ryzyko: **wysokie** (sekrety)
  · [`90ffed0`](https://github.com/Kuchaar/stockview/commit/90ffed0) (keepalive)
  · [`877e46b`](https://github.com/Kuchaar/stockview/commit/877e46b) (eksport)
  · [`388f32f`](https://github.com/Kuchaar/stockview/commit/388f32f) (commit bota z danymi)
  *Gotowe, gdy:* projekt Supabase ma status aktywny, logowanie na stockview.org działa, codzienny
  `keepalive.yml` robi prawdziwe zapytania `select` (także w weekendy), sekrety `SUPABASE_URL`
  i `SUPABASE_ANON_KEY` są w Actions, a ręcznie odpalony `update-financials.yml` odświeża
  `public/data/financials/` — pliki mają bilans i przepływy, a `lastUpdated` pokazuje datę
  ostatniego zapisu w bazie.
  **Dwie zmiany warunku, obie 2026-10-23.** (1) *decyzja Kamila:* pierwotnie wymagał **trzech**
  sekretów; po P13 import nie chodzi na GitHubie, więc `SUPABASE_SERVICE_ROLE_KEY` nie jest
  w Actions do niczego potrzebny — żywy tylko lokalnie, w `.env.local`. (2) *poprawka błędnego
  założenia:* warunek mówił „**nowa data**", zakładając, że eksport stempluje pliki datą
  przebiegu. Nie stempluje i nie powinien: `lastUpdated` to **najnowszy `updated_at` z bazy**
  (`scripts/export-financials.mjs:56`), czyli data, kiedy zmieniły się **liczby**, a nie kiedy
  przeszedł bot. Wszystkie 243 wiersze mają `updated_at` z 2026-09-20, więc `2026-09-20`
  w plikach jest prawdą, a nie zastojem. Data ruszy się dopiero po pierwszym lokalnym imporcie
  (raporty za III kwartał, początek grudnia). Przeciwny wzorzec siedzi w `scripts/fetch-stooq.mjs`,
  który wpisuje dzisiejszą datę przy każdym przebiegu — i dlatego weekendowy cron produkowałby
  tam commity-śmieci.
  **Jak sprawdzone (2026-10-23):** baza aktywna ✓; logowanie na stockview.org działa ✓
  (potwierdził Kamil); `gh secret list` → dokładnie dwa sekrety ✓; `keepalive.yml` zielony,
  [run 39983171367](https://github.com/Kuchaar/stockview/actions/runs/39983171367) — trzy `select` po HTTP 200, bez klucza w logu ✓;
  `update-financials.yml` zielony, [run 40001596221](https://github.com/Kuchaar/stockview/actions/runs/40001596221) — „Oba sekrety na miejscu",
  243 wiersze, 24 pliki, commit bota `388f32f` (+6845/−373) ✓; na produkcji
  `https://stockview.org/data/financials/pkobp/data.json` oddaje bilans 4R/5K i przepływy 4R/5K,
  sprawdzone też dla `cdprojekt`, `pepco` i `zabka` ✓.

- [ ] **P1 — własny SMTP** (~40 min) — ryzyko: **wysokie** (logowanie, sekrety)
  *Gotowe, gdy:* obcy adres e-mail dostaje link potwierdzający z adresu w stockview.org, a SPF, DKIM i DMARC przechodzą.

- [ ] **P2 — RLS i migracje dla `watchlist` i `dividends`** (~40 min) — ryzyko: **wysokie** (RLS, migracje)
  *Gotowe, gdy:* doradca bezpieczeństwa Supabase nie zgłasza błędów, obie tabele mają migracje w repo,
  a użytkownik B nie widzi watchlisty użytkownika A.

- [ ] **P3 — ustawienia logowania** (~40 min) — ryzyko: **wysokie** (logowanie)
  Minimum 8 znaków w panelu i w `AuthModal.jsx`, Turnstile przy rejestracji, logowaniu i resecie, link „Nie pamiętam hasła".
  *Gotowe, gdy:* hasło 7-znakowe jest odrzucane, a reset hasła działa od początku do końca.

- [ ] **P4 — czcionki u siebie, motyw zapisywany po wyborze** (~20 min) — ryzyko: **zwykłe**
  *Gotowe, gdy:* w zakładce Sieć nie ma żadnego żądania do googleapis.com ani gstatic.com, CSP nie zawiera domen Google,
  a `sv-theme` pojawia się w localStorage dopiero po przełączeniu motywu.

- [ ] **P5 — strona główna bez TradingView** (~40 min × 2) — ryzyko: **wysokie** (źródło danych)
  Ticker z `latest-prices.json`, wykres WIG20 z własnych danych.
  *Gotowe, gdy:* wejście na `/` nie wysyła nic do tradingview.com.

- [ ] **P6 — nagłówki** (~20 min) — ryzyko: **zwykłe**
  HSTS, `connect-src` bez Yahoo, próba bez `'unsafe-inline'`.
  *Gotowe, gdy:* Mozilla Observatory daje co najmniej B+, a strona działa w obu motywach.
  Uwaga: `max-age` w HSTS trudno odkręcić — sprawdź na podglądzie PR-a, zanim trafi na `main`.

- [ ] **P7 — usuwanie konta i retencja logów** (~40 min) — ryzyko: **wysokie** (usuwa dane użytkownika)
  Funkcja w bazie usuwa użytkownika razem z watchlistą; zadanie czyści `auth.audit_log_entries` starsze niż 90 dni.
  *Gotowe, gdy:* po „Usuń konto" w Supabase nie ma ani konta, ani jego wierszy, a czyszczenie logów jest zaplanowane.

- [ ] **P8 — neutralny język ocen** (~40 min) — ryzyko: **wysokie** (zmienia skład oceny)
  Ocena kondycji bez części o wycenie i bez „atrakcyjnej wyceny", progi w zakładce wyceny opisane jako konwencja
  z podanym źródłem zamiast „✓", zasada językowa dopisana do AGENTS.md.
  *Gotowe, gdy:* w `src/` nie ma słów „atrakcyjn", „kupuj", „niedowartościow" w tekstach dla użytkownika,
  a każda ocena prowadzi do opisu metodologii.
  **Miejsca z „atrakcyjną wyceną"** — ten sam tekst stoi w dwóch plikach, poprawka musi trafić w oba:
  `src/components/HealthScore.jsx:191-192` (`getDescription`, wariant `strong`, `pl` i `en`)
  i `src/pages/StockPage.jsx:802` (`healthDescription`, wariant `strong`). To werdykt oceny kondycji,
  a mówi o wycenie, której ta ocena nie liczy.
  Dwa trafienia, które **zostają**, żeby warunek dał się zamknąć bez dyskusji: „kupuj" wchodzi
  też w `src/data/translations.js:276` („inwestor kupujący «cały WIG20»") i `src/data/wig20.js:857`
  („Kupuje i obsługuje portfele wierzytelności" — opis działalności Kruka). To opisy, nie oceny.

- [ ] **P9 — polityka prywatności i regulamin** (~40 min × 2) — ryzyko: **zwykłe** (dotyka rejestracji)
  `/prywatnosc` i `/regulamin` po polsku i angielsku, link w stopce, wymagany checkbox przy rejestracji,
  adres kontaktowy, okresy przechowywania, przekazanie poza EOG.
  *Gotowe, gdy:* treść zgadza się ze stanem strony po P1–P8.
  Treść prawna jest decyzją Kamila, nie moją — `AGENTS.md` → „Code review rules", koniec sekcji.

- [ ] **P10 — rejestr czynności i procedura incydentu** (~20 min) — ryzyko: **niskie** (same dokumenty)
  *Gotowe, gdy:* oba dokumenty są w `docs/` i opisują co najmniej konto, watchlistę i logi.

- [ ] **P11 — konta i repo** (~20 min) — ryzyko: **wysokie** (uprawnienia) · **zadanie Kamila**
  *Gotowe, gdy:* 2FA działa na GitHubie, w Cloudflare, Supabase, u rejestratora i na skrzynce,
  a w repo są włączone skanowanie sekretów i Dependabot.
  Ustawień kont nie ruszam bez uzgodnienia — mogę najwyżej sprawdzić, co widać z `gh`, i zgłosić braki.

- [x] **P12 — `update-financials.yml` przerywa się przy brakującym sekrecie** (~20 min) — ryzyko: **wysokie** (sekrety)
  · [`c477fe2`](https://github.com/Kuchaar/stockview/commit/c477fe2) · PR #5
  Przed tą zmianą oba realne kroki były bramkowane `if: env.SUPABASE_* != ''`, a przy braku sekretu
  wykonywał się krok „Skip…" i cały przebieg kończył się na zielono. Tak przeszły cztery przebiegi
  „success" od 2026-09-26: po 16–24 s, bez jednej zmiany w plikach. To wzorzec P1 z `AGENTS.md` —
  „operacja zakończona błędem nie może zgłaszać sukcesu". Ma działać jak `keepalive.yml`: brak
  sekretu → `::error::` z nazwą sekretu i `exit 1`.
  *Gotowe, gdy:* brak `SUPABASE_URL` albo `SUPABASE_ANON_KEY` kończy przebieg czerwono i podaje
  w logu nazwę brakującego sekretu, kroków „Skip…" nie ma w pliku, a przebieg z sekretami eksportuje.
  **Warunek poprawiony 2026-10-23** po uwadze P2 z recenzji PR #5 na `3532415`: mówił o **trzech**
  sekretach oraz o imporcie, czyli wymagał cofnięcia tego, co P13 właśnie usuwa.
  **Jak sprawdzone:** krok `Check secrets` przepuszczony przez `bash -e` w trzech stanach —
  oba sekrety `exit 0`, brak jednego `exit 1` z jego nazwą, brak obu `exit 1` z dwiema nazwami;
  w pliku nie ma ani jednego kroku z `if:` (`yaml.safe_load` → `kroki z if: []`), a jedyne
  trafienie na „Skip" to komentarz tłumaczący, co usunięto; przebieg z sekretami zielony
  i eksportuje — [run 40001596221](https://github.com/Kuchaar/stockview/actions/runs/40001596221), „Oba sekrety na miejscu", 24 pliki zapisane.

- [x] **P13 — import z Yahoo nie przechodzi z runnera GitHuba** (~40 min) — ryzyko: **wysokie** (źródło danych)
  · [`c477fe2`](https://github.com/Kuchaar/stockview/commit/c477fe2) · PR #5
  Ręczny przebieg na `main` z 2026-10-23
  ([run 39981690212](https://github.com/Kuchaar/stockview/actions/runs/39981690212)):
  `import-financials.mjs` dostał HTTP 403 na 23 spółkach i „fetch failed" na PZU, zapisał 0 wierszy
  i wywalił job — a przez to krok „Export financials to static files" **w ogóle się nie wykonał**,
  choć baza ma 243 wiersze, z czego 218 z bilansem i 212 z przepływami. Ten sam adres
  `https://stockview.org/api/financials?symbol=PKO.WA` z komputera oddaje HTTP 200, więc blokowany
  jest adres IP runnera, nie endpoint. **Ten sam runner dobija się do Supabase bez problemu** —
  `keepalive.yml` dostaje z niego HTTP 200 na trzech zapytaniach `select`
  ([run 39983171367](https://github.com/Kuchaar/stockview/actions/runs/39983171367)), a eksport
  chodzi tą samą drogą i tym samym kluczem anon. Blokada stoi więc wyłącznie między runnerem
  i `/api/financials` na Cloudflare. Dwie rzeczy do rozdzielenia: eksport nie może zależeć od
  powodzenia importu (to on odświeża pliki i wystarczy mu klucz anon — i wiemy już, że z runnera
  by przeszedł), a import potrzebuje drogi, którą runner nie jest odbijany.
  **Wybrana droga (decyzja Kamila, 2026-10-23):** import **wychodzi z GitHuba** i zostaje
  komendą lokalną, odpalaną po raportach kwartalnych. Osobnego workflow importu nie tworzymy —
  z runnera i tak dostałby 403. Cotygodniowy przebieg robi **tylko eksport**, więc jest zielony
  i jego kolor coś znaczy. Gdyby import został w cronie, job byłby czerwony co tydzień na stałe,
  a to to samo zepsucie co w P12, tylko w drugą stronę: tam zielony nic nie znaczył, tu czerwony
  przestałby cokolwiek znaczyć.
  *Gotowe, gdy:* cotygodniowy eksport jest zielony i odświeża `public/data/financials/`;
  ręczny import lokalny jest opisany w [`docs/SETUP.md`](SETUP.md) i kończy się błędem,
  gdy nic nie zapisze.
  **Jak sprawdzone:** [run 40001596221](https://github.com/Kuchaar/stockview/actions/runs/40001596221) zielony, commit bota
  [`388f32f`](https://github.com/Kuchaar/stockview/commit/388f32f) z 24 odświeżonymi plikami (+6845/−373), a na produkcji bilans
  i przepływy widać w `https://stockview.org/data/financials/pkobp/data.json`; procedura
  importu jest w `docs/SETUP.md` sekcja D; importer z nieosiągalnym źródłem kończy
  `exit 1` i komunikatem „import nic nie wniósł do bazy", a na normalnej ścieżce `exit 0`
  i 231 wierszy. **Odblokowało P0.**

### Poza kodem — zadania Kamila

Trzy sprawy, których nie da się zrobić w repo. Nie zaczynam ich sam i nie zamykam za Kamila.

- [ ] Zapytać compliance u pracodawcy, **zanim** pojawią się własne wyceny albo zarobek.
- [ ] Już teraz napisać do GPW w sprawie umowy licencyjnej na dane opóźnione.
- [ ] Afiliację z brokerem rozmawiać tylko w modelu stałej opłaty.

---

## Bramka 2 — Konta i portfel

Logowanie i watchlista już działają na Supabase. Brakuje właściwego portfela.

> **Pierwszeństwo ma Bramka P.** Portfel zbiera więcej danych osobowych niż watchlista,
> a prywatność ma je wyprzedzać — Zasada 6 z [`docs/VISION.md`](VISION.md).

> **K3–K6 wstrzymane do Otwartej decyzji 1 z [`docs/VISION.md`](VISION.md).** Portfel liczony
> tylko na 24 spółkach WIG20 jest węższy niż hipoteza o ETF-ach i spółkach spoza indeksu —
> pokazałby początkującemu ułamek tego, co naprawdę ma. K1 i K2 zostają odhaczone, bo już
> działają.

- [x] **K1 — logowanie Supabase** · [`3d804c1`](https://github.com/Kuchaar/stockview/commit/3d804c1)
- [x] **K2 — watchlista z trwałym zapisem** · [`80e4ae2`](https://github.com/Kuchaar/stockview/commit/80e4ae2)
- [ ] **K3 — schemat portfela w Supabase** (~40 min) — ⏸ **wstrzymane** (Otwarta decyzja 1)
  Tabele `portfolio` i `transactions` (ticker, typ, liczba, cena, data, prowizja) + RLS
  ograniczone do właściciela.
  *Gotowe, gdy:* migracja zastosowana, a użytkownik B nie widzi wierszy użytkownika A.
- [ ] **K4 — dodawanie transakcji** (~40 min) — ⏸ **wstrzymane** (Otwarta decyzja 1)
  Formularz kupna/sprzedaży z walidacją.
  *Gotowe, gdy:* transakcja przeżywa odświeżenie strony i wylogowanie.
- [ ] **K5 — wycena portfela** (~40 min) — ⏸ **wstrzymane** (Otwarta decyzja 1)
  Wartość bieżąca, koszt nabycia, wynik w PLN i procentach, po cenach z `/api/quote`.
  *Gotowe, gdy:* liczby zgadzają się z ręcznym wyliczeniem na trzech transakcjach.
- [ ] **K6 — strona `/portfolio`** (~40 min) — ⏸ **wstrzymane** (Otwarta decyzja 1)
  Tabela pozycji + podsumowanie, w stylu istniejących stron.
  *Gotowe, gdy:* działa na telefonie i w trybie ciemnym, pusty portfel ma sensowny stan.

---

## Bramka 3 — SEO i ruch z Polski

- [x] **S1 — ujednolicenie domeny** (~40 min)
  `canonical`, OG, CSP w `public/_headers`, `BASE_URL` w `scripts/generate-sitemap.mjs`
  i CORS w `functions/api/` wskazywały na `stockview.pages.dev`, a docelowa domena to
  `stockview.org`. Adres kanoniczny pochodzi teraz z `src/config/site.js` (`SITE_URL`).
  *Gotowe, gdy:* `grep -rn "pages.dev" src/ public/ functions/ scripts/ index.html` nie
  zwraca nic. Przekierowania 301 ze starej domeny nie wymagamy — `pages.dev` siedzi za
  Cloudflare Access, więc dla robotów i tak jest niedostępna.
- [x] **S2 — tytuły i opisy per spółka** (~40 min)
  Unikalny `<title>` i `description` dla 24 stron spółek, z nazwą i tickerem.
  *Gotowe, gdy:* żadne dwie strony nie mają tego samego tytułu.
  Strony spółek miały to od początku; brakowało Helmeta na `/dividends`, `/watchlist`
  i obu panelach admina — dziedziczyły tytuł strony głównej. 30 tytułów, 30 unikalnych.
  Przy okazji: canonical na `/compare` i `/screener`, `noindex` dla stron prywatnych
  (jedno miejsce w `App.jsx`) i trzy publiczne narzędzia w sitemapie (25 → 28 URL-i).
- [x] **S3 — dane strukturalne** (~40 min)
  JSON-LD `Organization` + `FinancialProduct` na stronie spółki.
  *Gotowe, gdy:* walidator Google nie zgłasza błędów dla trzech losowych spółek.
  `src/data/structuredData.js` buduje graf: `Corporation` (nazwa, ticker, ISIN, siedziba,
  zatrudnienie, rok założenia, strona), `FinancialProduct` wskazujący na nią przez `@id`
  i `BreadcrumbList`. Sprawdzone skryptem na 48 wariantach (24 spółki × 2 języki): poprawny
  JSON, brak `null`, komplet pól wymaganych, adresy absolutne.
  **Do potwierdzenia w walidatorze Google** po wdrożeniu — patrz niżej.
- [x] **S4 — treść pod frazy** (~40 min)
  Sekcja tekstowa na stronie głównej pod „analiza spółek WIG20", „wskaźniki finansowe GPW".
  *Gotowe, gdy:* strona główna ma min. 300 słów sensownej treści, nie wypełniacza.
  `HomeContent` na dole strony: czym jest WIG20 i jak jest skoncentrowany, jak czytać C/Z,
  C/WK, ROE, dług/EBITDA i stopę dywidendy, skąd pochodzą dane, zastrzeżenie.
  433 słowa po polsku, 485 po angielsku — z faktami o indeksie (rewizja roczna po styczniu,
  korekty kwartalne, banki ok. 1/3 wartości), nie z wypełniaczem.
- [x] **S5 — Search Console** (~40 min)
  Weryfikacja domeny, zgłoszenie `sitemap.xml`, sprawdzenie pokrycia.
  *Gotowe, gdy:* wszystkie 25 URL-i z sitemapy jest zgłoszonych do indeksacji.
  Domena `stockview.org` zweryfikowana, sitemapa zgłoszona 2026-09-20 (razem z S1).


## Po Bramce P — do decyzji

Tematy, które wyszły z porównania tej roadmapy z [`docs/VISION.md`](VISION.md) (PR #2):
wizja ich wymaga, a roadmapa ich nie miała. **Lista tematów, nie zadań** — bez szacunków
czasu, bez warunków „gotowe, gdy" i **bez kolejności**. Kolejność ustala Kamil po Bramce P,
razem z Otwartą decyzją 1.

- **Edukacja wplątana w dane i narzędzie** — Zasady 3 i 4; dziś w roadmapie zero zadań
  edukacyjnych, więc opcji (A) z Otwartej decyzji 1 nie da się wybrać.
- **DCF jako kalkulator z założeniami użytkownika** — Zasada 2 wprost go dopuszcza, opcja (B)
  stawia go na trzecim miejscu.
- **Licencje na dane** — Yahoo i widgety TradingView zabraniają użytku komercyjnego, dane GPW
  wymagają licencji; aplikacja używa dziś obu.
- **Portfel z ETF-ami, spółkami spoza WIG20 i importem z eksportu brokera** — warunek z hipotez
  VISION, od którego zależą wstrzymane K3–K6.
- **Źródło i data przy każdej liczbie w każdym widoku, oraz koniec z poziomem 3 danych**
  (zaszyte `financials` i `ratios` w `src/data/wig20.js`) — Zasada 1; dziś `DataFreshness`
  jest tylko w zakładce Sprawozdania.
- **Ścieżka do pierwszych płatności** — Cel nr 1 („10 obcych osób płaci") nie ma dziś
  w roadmapie żadnego odpowiednika; wiąże się z Otwartą decyzją 2.

---

## Bramka 4 — Redesign — **zaparkowane, poza VISION**

> **Zaparkowane.** [`docs/VISION.md`](VISION.md) nie wymienia redesignu ani w „Zasadach",
> ani w żadnej z dwu opcji Otwartej decyzji 1. Treść zostaje nietknięta i czeka — jeśli
> redesign ma wrócić do kolejki, wraca decyzją Kamila i wpisem w `VISION.md`.

**Wchodzi dopiero po zamrożeniu zakresu.** Bez tego przerabiamy wygląd ekranów, które
i tak się jeszcze zmienią. Zakres celowo wąski: tylko strona główna i strona spółki.

- [ ] **R0 — zamrożenie zakresu** (~40 min)
  Lista ekranów i komponentów, których redesign dotyczy, i tych, których nie rusza.
  *Gotowe, gdy:* lista jest w tym pliku i nikt jej nie kwestionuje.
- [ ] **R1 — inwentaryzacja obecnego UI** (~40 min)
  Spis klas z `@layer components` w `src/index.css` i miejsc ich użycia.
  *Gotowe, gdy:* wiadomo, które klasy są martwe.
- [ ] **R2 — kierunek wizualny** (~40 min)
  Punkt wyjścia: [`docs/design/stockview-mockup.html`](design/stockview-mockup.html).
  *Gotowe, gdy:* decyzja: mockup jako baza / inspiracja / do kosza.
- [ ] **R3 — strona główna** (~40 min × 2–3)
  *Gotowe, gdy:* wygląda tak samo dobrze na telefonie i w obu motywach, testy wizualne przechodzą.
- [ ] **R4 — strona spółki** (~40 min × 2–3)
  *Gotowe, gdy:* wszystkie 6 zakładek działa bez regresji.

---

## Później — uwagi z recenzji

Uwagi **P2 i niższe** z kolejnych rund recenzji, które **nie blokują merge'a** (patrz
`AGENTS.md` → „Review by risk", wysokie ryzyko). Jedna runda `@codex review` wystarcza;
to, co przyjdzie potem i nie jest P1, ląduje tutaj zamiast przedłużać PR bez końca.

Format wiersza: `- [ ] <uwaga> — PR #<nr>, zgłoszone na <SHA>, plik:linia`

Bierz je stąd, gdy dotykasz tego samego pliku albo gdy zrobi się ich tyle, że warto zrobić
z nich jedno zadanie.

- *(pusto — wszystkie uwagi z PR #1 zostały naprawione w jego trakcie)*
