# Dziennik StockView

<!-- Najnowszy wpis na górze. Każdy wpis kończy się polem „Następne:". -->

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
