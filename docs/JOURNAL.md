# Dziennik StockView

<!-- Najnowszy wpis na górze. Każdy wpis kończy się polem „Następne:". -->

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
nie. Nie sprawdzone: `--force-with-lease` (nie było rebase'u), `resolveReviewThread`
(mutacja wymaga zgody, zrobiona dopiero na koniec sesji), ścieżka „wysokie ryzyko bez
recenzenta" — nie było takiego PR-a.

**Następne:** merge PR #1 za zgodą Kamila — to domyka F6 i odblokowuje resztę.
Potem **K3 — schemat portfela w Supabase**: tabele `portfolio` i `transactions` z RLS
ograniczonym do właściciela. Uwaga: K3 to **wysokie ryzyko** (RLS i uprawnienia), więc
według nowych zasad PR czeka na dodatkowy przegląd przed merge, a w razie braku
recenzenta robimy w tym czasie coś o niższym ryzyku.


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
