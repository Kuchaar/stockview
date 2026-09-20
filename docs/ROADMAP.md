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

---

## Bramka 1 — Dane

Dziś dane finansowe spółek siedzą w ręcznie utrzymywanych plikach JSON i w `src/data/wig20.js`.
To się nie skaluje i cicho starzeje.

- [x] **D1 — audyt źródeł** (~40 min)
  Spisz dla każdego pola (przychód, EBITDA, bilans, `ratios`), skąd dziś pochodzi i jak
  często się zmienia.
  *Gotowe, gdy:* tabela „pole → źródło → częstotliwość → kto aktualizuje" jest w `docs/DATA.md`.
  Wynik: [`docs/DATA.md`](DATA.md) — pięć ustaleń (U1–U5), z czego U3 blokuje sensowne D3.
- [ ] **D1a — naprawa dat w `/api/financials`** (~20 min) ⚠️ **wyszło z audytu D1**
  Yahoo zwraca `endDate` jako liczbę, `transformStatements()` czeka na `.fmt` — przez to
  `date`/`period` są `null`, a `latest()` bierze najstarszy rocznik zamiast najnowszego.
  *Gotowe, gdy:* `/api/financials?symbol=PKO.WA` ma `date` i `period` w każdym wierszu,
  a wskaźniki na stronie spółki liczą się z ostatniego rocznika.
- [ ] **D2 — wybór dostawcy danych fundamentalnych** (~40 min)
  Porównaj 2–3 źródła pod kątem pokrycia GPW, limitów i ceny.
  *Gotowe, gdy:* decyzja z uzasadnieniem zapisana w `docs/DATA.md`, klucz testowy działa.
- [ ] **D3 — endpoint `functions/api/fundamentals.js`** (~40 min)
  Po wzorze istniejącego `functions/api/financials.js`: cache na krawędzi + fallback.
  *Gotowe, gdy:* endpoint zwraca dane dla 3 tickerów i nie przekracza limitu dostawcy.
- [ ] **D4 — podmiana źródła w UI** (~40 min)
  `useStockData()` czyta z nowego endpointu, statyczne JSON-y zostają jako ostatni fallback.
  *Gotowe, gdy:* wyłączenie sieci pokazuje dane z fallbacku i baner o źródle, bez błędu.
- [ ] **D5 — sygnalizacja świeżości** (~40 min)
  Data ostatniej aktualizacji per spółka, widoczna na stronie spółki.
  *Gotowe, gdy:* dane starsze niż kwartał są wizualnie oznaczone.

---

## Bramka 2 — Konta i portfel

Logowanie i watchlista już działają na Supabase. Brakuje właściwego portfela.

- [x] **K1 — logowanie Supabase** · [`3d804c1`](https://github.com/Kuchaar/stockview/commit/3d804c1)
- [x] **K2 — watchlista z trwałym zapisem** · [`80e4ae2`](https://github.com/Kuchaar/stockview/commit/80e4ae2)
- [ ] **K3 — schemat portfela w Supabase** (~40 min)
  Tabele `portfolio` i `transactions` (ticker, typ, liczba, cena, data, prowizja) + RLS
  ograniczone do właściciela.
  *Gotowe, gdy:* migracja zastosowana, a użytkownik B nie widzi wierszy użytkownika A.
- [ ] **K4 — dodawanie transakcji** (~40 min)
  Formularz kupna/sprzedaży z walidacją.
  *Gotowe, gdy:* transakcja przeżywa odświeżenie strony i wylogowanie.
- [ ] **K5 — wycena portfela** (~40 min)
  Wartość bieżąca, koszt nabycia, wynik w PLN i procentach, po cenach z `/api/quote`.
  *Gotowe, gdy:* liczby zgadzają się z ręcznym wyliczeniem na trzech transakcjach.
- [ ] **K6 — strona `/portfolio`** (~40 min)
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
- [ ] **S2 — tytuły i opisy per spółka** (~40 min)
  Unikalny `<title>` i `description` dla 24 stron spółek, z nazwą i tickerem.
  *Gotowe, gdy:* żadne dwie strony nie mają tego samego tytułu.
- [ ] **S3 — dane strukturalne** (~40 min)
  JSON-LD `Organization` + `FinancialProduct` na stronie spółki.
  *Gotowe, gdy:* walidator Google nie zgłasza błędów dla trzech losowych spółek.
- [ ] **S4 — treść pod frazy** (~40 min)
  Sekcja tekstowa na stronie głównej pod „analiza spółek WIG20", „wskaźniki finansowe GPW".
  *Gotowe, gdy:* strona główna ma min. 300 słów sensownej treści, nie wypełniacza.
- [x] **S5 — Search Console** (~40 min)
  Weryfikacja domeny, zgłoszenie `sitemap.xml`, sprawdzenie pokrycia.
  *Gotowe, gdy:* wszystkie 25 URL-i z sitemapy jest zgłoszonych do indeksacji.
  Domena `stockview.org` zweryfikowana, sitemapa zgłoszona 2026-09-20 (razem z S1).

---

## Bramka 4 — Redesign

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
