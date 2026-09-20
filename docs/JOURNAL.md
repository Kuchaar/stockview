# Dziennik StockView

<!-- Najnowszy wpis na górze. Każdy wpis kończy się polem „Następne:". -->

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
