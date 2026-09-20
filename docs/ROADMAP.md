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
- [ ] **F3 — rytuał sesji** (~40 min)
  Spisany start i koniec sesji: `git pull --rebase` → praca → wpis do dziennika → commit → push.
  Do tego skrót na sprawdzenie, czy drugi komputer czegoś nie zostawił.
  *Gotowe, gdy:* `docs/SESSION.md` istnieje i przechodzi test „obcy człowiek wykonuje kroki
  bez pytania o nic".
- [ ] **F4 — `AGENTS.md`** (~40 min)
  Instrukcja dla Claude Code i innych agentów: konwencje, czego nie ruszać, jak testować.
  *Gotowe, gdy:* `AGENTS.md` w katalogu głównym, a `CLAUDE.md` nie duplikuje jego treści.
- [ ] **F5 — CI na pull requestach** (~40 min)
  Workflow, który na PR odpala `npm ci && npm run build` na Node z `.nvmrc`.
  *Gotowe, gdy:* PR z celowo zepsutym importem dostaje czerwony status przed mergem.

---

## Bramka 1 — Dane

Dziś dane finansowe spółek siedzą w ręcznie utrzymywanych plikach JSON i w `src/data/wig20.js`.
To się nie skaluje i cicho starzeje.

- [ ] **D1 — audyt źródeł** (~40 min)
  Spisz dla każdego pola (przychód, EBITDA, bilans, `ratios`), skąd dziś pochodzi i jak
  często się zmienia.
  *Gotowe, gdy:* tabela „pole → źródło → częstotliwość → kto aktualizuje" jest w `docs/DATA.md`.
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

- [ ] **S1 — ujednolicenie domeny** (~40 min) ⚠️ **blokuje resztę bramki**
  Dziś `canonical`, OG, CSP w `public/_headers`, `BASE_URL` w `scripts/generate-sitemap.mjs`
  i CORS w `functions/api/` wskazują na `stockview.pages.dev`, a docelowa domena to
  `stockview.org`. Google indeksuje przez to domenę techniczną.
  *Gotowe, gdy:* `grep -rn "pages.dev" src/ public/ functions/ scripts/` nie zwraca nic
  poza świadomym wpisem na liście dozwolonych originów, a `curl -I` na starą domenę
  daje przekierowanie 301.
- [ ] **S2 — tytuły i opisy per spółka** (~40 min)
  Unikalny `<title>` i `description` dla 24 stron spółek, z nazwą i tickerem.
  *Gotowe, gdy:* żadne dwie strony nie mają tego samego tytułu.
- [ ] **S3 — dane strukturalne** (~40 min)
  JSON-LD `Organization` + `FinancialProduct` na stronie spółki.
  *Gotowe, gdy:* walidator Google nie zgłasza błędów dla trzech losowych spółek.
- [ ] **S4 — treść pod frazy** (~40 min)
  Sekcja tekstowa na stronie głównej pod „analiza spółek WIG20", „wskaźniki finansowe GPW".
  *Gotowe, gdy:* strona główna ma min. 300 słów sensownej treści, nie wypełniacza.
- [ ] **S5 — Search Console** (~40 min)
  Weryfikacja domeny, zgłoszenie `sitemap.xml`, sprawdzenie pokrycia.
  *Gotowe, gdy:* wszystkie 25 URL-i z sitemapy jest zgłoszonych do indeksacji.

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
