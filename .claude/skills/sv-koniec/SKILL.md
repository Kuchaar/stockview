---
description: Koniec sesji StockView — rebase, sprawdzenia, wpis do dziennika, commit, push i PR (bez merge)
disable-model-invocation: true
allowed-tools: Bash(npm run sync) Bash(npm run build) Bash(git *) Bash(hostname) Bash(git push *) Bash(gh pr create *) Bash(gh pr view *) Bash(gh pr list *) Bash(gh pr checks *) Read
argument-hint: "[co zrobiłem]"
---

# Koniec sesji StockView

Cel: nie zostawić pracy uwięzionej na jednym komputerze, zapisać kontekst i wystawić PR.
**Ta komenda nigdy nie scala.** Merge to zgoda Kamila na konkretny PR.

`$ARGUMENTS` to krótki opis tego, co zostało zrobione — jeśli jest pusty, ustal to
z rozmowy i z `git status` / `git diff`.

## Kroki

### 1. Gałąź

Zmiany ręczne nie idą na `main` (`AGENTS.md` → „Workflow"). Jeśli jesteśmy na `main`:

1. Zaproponuj nazwę w konwencji `feat/*`, `fix/*`, `chore/*` albo `docs/*` (kebab-case,
   np. `feat/portfel-schema`). Dla pracy niedokończonej — `wip/*`.
2. Po akceptacji: `git switch -c <nazwa>`.

Jeśli jesteśmy już na gałęzi roboczej — zostajemy na niej.

### 2. Rebase — tylko gdy trzeba, i zawsze przed sprawdzeniami

```
git fetch origin
gh pr view <nr> --json mergeable,mergeStateStatus   # jeśli PR już istnieje
```

**Najpierw rozstrzygnij, czy rebase jest w ogóle potrzebny.** Rebase'uj, gdy:

- gałąź nie jest jeszcze wypchnięta — wtedy jest darmowy, rób go zawsze;
- `mergeable` to `CONFLICTING` albo `mergeStateStatus` to `DIRTY` — jest prawdziwy
  konflikt do rozwiązania.

**`UNKNOWN` nie jest konfliktem.** GitHub liczy zdolność scalenia asynchronicznie i zaraz
po pushu zwraca `mergeable: UNKNOWN` — GraphQL rozróżnia `UNKNOWN` od `CONFLICTING`.
Odpytaj ponownie po kilku sekundach. Rebase na `UNKNOWN` przepisałby opublikowaną gałąź
i unieważnił zrecenzowany SHA na podstawie stanu, który za chwilę sam się wyjaśni.

**Nie rebase'uj**, gdy PR jest `MERGEABLE`/`CLEAN`, a `origin/main` ruszył tylko tam, gdzie
nie dotykasz — w praktyce w `public/data/` od bota. Rebase przepisałby opublikowane commity,
wymusił `--force-with-lease`, **unieważnił zrecenzowany SHA i pozamykane wątki**, a wciągnął
tylko pliki cen, które i tak nie kolidują. Merge załatwi to sam. Porządek w historii nie
jest wart unieważnienia recenzji.

Jeśli rebase'ujesz, **kolejność ma znaczenie**: rebase zmienia drzewo i SHA, więc build
zrobiony przed nim dotyczy innej wersji niż ta, która pójdzie do PR-a — czysty rebase wciąga
kod z `main`, którego nikt tu nie testował, a rozwiązywanie konfliktu zmienia gałąź
dodatkowo. Dlatego rebase idzie **przed** krokiem 3, a jeśli musisz go zrobić później —
**powtórz sprawdzenia**. Przy konflikcie — **zatrzymaj się** i pokaż, co jest w konflikcie.

Push po rebase już opublikowanej gałęzi wymaga `--force-with-lease`, nigdy samego `--force`.
Same nowe commity wchodzą fast-forward i żadnego lease nie potrzebują.

### 3. Sprawdzenia dobrane do zmiany

Nie cały rytuał na ślepo i nie wyłącznie build:

| Zmiana dotyczy | Co uruchomić |
|---|---|
| kod `src/` lub `functions/` | `npm run build` — musi skończyć się `✓ Generated dist/sitemap.xml` |
| `/api/*` | `npm run dev:full` i `curl` na konkretny endpoint |
| teksty w UI | oba języki (`t()` ma wpis `pl` i `en`) i oba motywy |
| liczby, wskaźniki, waluty | ręczne przeliczenie na jednej spółce, z podaniem okresu i waluty |
| skrypty w `scripts/` | przebieg na jednej spółce, **nigdy importer produkcyjny na całości** |
| migracja, RLS, uprawnienia | sprawdzenie, że konto B nie widzi wierszy konta A |
| wyłącznie dokumentacja pasywna (`docs/`, `README`, dziennik) | **nic się nie uruchamia** — powiedz to wprost |
| `.claude/skills/` — **instrukcje wykonywalne** | przejdź dotkniętą ścieżkę: każdą zmienioną komendę gita i każde zmienione wywołanie API odpal raz, na czymś bezpiecznym |

Jeśli build nie przechodzi — **zatrzymaj się**, powiedz co się wywala (plik, linia,
komunikat) i zaproponuj naprawę. Nie commituj zepsutego builda.

**Zielony build nie jest dowodem na poprawność instrukcji ani reguły.** Przy zmianie
w `AGENTS.md` czy w skillach build mówi tylko tyle, że aplikacja nadal się buduje.

**Ale „to tylko instrukcja" też nie jest powodem, żeby nie sprawdzić niczego.** Pliki
w `.claude/skills/` **wykonują** polecenia: rebase'ują gałęzie, pushują commity, zamykają
wątki recenzji. A skoro zmiana samych `.md` nie dostaje też runu CI (`paths-ignore`),
literówka w komendzie albo błąd w przejściu stanu dojedzie **nietknięty** do następnej
prawdziwej sesji i wywali się w połowie rytuału. Zmieniłeś zapytanie GraphQL — odpal je.
Zmieniłeś warunek na `mergeable` — sprawdź, co API naprawdę zwraca. Zmieniłeś mutację —
wykonaj ją raz.

### 4. Poziom ryzyka

Ustal poziom z `AGENTS.md` → „Review by risk" i wpisz go do opisu PR-a:

- **niskie** — dokumentacja, drobny wygląd, teksty bez znaczenia finansowego ani prawnego;
- **zwykłe** — zmiana funkcjonalna widoczna dla użytkownika;
- **wysokie** — RLS i uprawnienia, logowanie, sekrety, migracje, import nadpisujący dane,
  wzory finansowe, waluty, okresy, źródła danych.

Przy **wysokim**: PR zostaje otwarty z adnotacją, że czeka na dodatkową recenzję przed
merge i przed wdrożeniem. Nie szukaj obejścia — brak recenzenta nie jest powodem do
scalenia. Powiedz Kamilowi, że to stoi, i weź niezależne zadanie o niższym ryzyku.

### 5. Wpis do dziennika

Zaproponuj wpis **na górę** `docs/JOURNAL.md`, w formacie zgodnym z resztą pliku:

```markdown
## RRRR-MM-DD — <krótki tytuł sesji>

Komputer: `<hostname>`

**Zrobione.** …
**Decyzje.** …          ← tylko jeśli jakieś zapadły; wraz z powodem
**Do sprawdzenia.** …   ← co NIE zostało zweryfikowane
**Następne:** …
```

Datę weź z `date +%Y-%m-%d`, komputer z `hostname`. Pisz konkretnie: nazwy plików, liczby,
hashe — nie „poprawiono różne rzeczy".

**Pokaż wpis i poczekaj na „ok".** Nie zapisuj go do pliku, zanim nie potwierdzę.

### 6. Commit, push i PR

Dodaj **tylko pliki z tej sesji** (nie `git add -A`), commit w konwencji conventional
commits z opisem po polsku (`feat:` / `fix:` / `chore:` / `docs:`), potem:

```
git push -u origin <nazwa-gałęzi>
git rev-parse HEAD
```

Jeśli między krokiem 2 a tym momentem `origin/main` ruszył i musiałeś rebase'ować —
**powtórz sprawdzenia z kroku 3** przed pushem.

PR z opisem po polsku, z czterema częściami zadania i poziomem ryzyka:

```markdown
**Ryzyko:** niskie / zwykłe / wysokie — <czego dotyczy>

## Cel
…dlaczego ta zmiana istnieje

## Zakres
…jakie pliki i zachowania dotyka, czego celowo nie rusza

## Kryteria akceptacji
…warunek „gotowe, gdy…"

## Weryfikacja
…co uruchomiono i z jakim wynikiem; czego NIE sprawdzono

## Do recenzji
SHA: `<pełny sha>` · ścieżka recenzji wg poziomu ryzyka
```

SHA bierz z `git rev-parse HEAD` **po** pushu. Od tej chwili nie dotykaj gałęzi, dopóki
recenzja nie wróci.

**`wip/*` — tylko dopóki praca jest niedokończona.** Gałąź `wip/*` nie dostaje PR-a
i zostaje do podjęcia na drugim komputerze: `npm run sync` → `git switch wip/<opis>`.

Ale jeśli podjąłeś pracę z `wip/*` i **skończyłeś** ją w tej sesji, ta gałąź **musi
zmienić nazwę**, zanim wystawisz PR — inaczej gotowa zmiana zostaje jako WIP i nigdy nie
wchodzi do obiegu recenzji:

```
git branch -m wip/<opis> feat/<opis>          # albo fix/ , chore/ , docs/
git push -u origin feat/<opis>
git push origin --delete wip/<opis>
```

Rozstrzygnij wprost: czy warunek „gotowe, gdy…" z zadania jest spełniony? Jeśli tak —
przemianuj i wystaw PR. Jeśli nie — zostaw `wip/*` i powiedz, czego brakuje.

### 7. Podgląd Cloudflare — dopiero teraz da się go sprawdzić

Przy zmianie widocznej w UI **wszystkie sprawdzenia z kroku 3 odbyły się, zanim PR
istniał**, a deployment podglądowy powstaje **razem z PR-em**. Czyli w momencie
sprawdzania nie było jeszcze czego obejrzeć w przeglądarce — a `AGENTS.md` wymaga
sprawdzenia zmiany w przeglądarce przed prośbą o merge.

Po utworzeniu PR-a:

```
gh pr checks <nr>          # poczekaj, aż „Cloudflare Pages" przestanie być pending
```

Potem otwórz adres podglądu i sprawdź zmianę — **oba motywy i szerokość telefonu**.
Jeśli nie da się tego zrobić (jak dotychczas bywało: Chrome nie łączył się
z localhostem), **powiedz to wprost i napisz, że merge jest zablokowany do czasu
oględzin** — nie podawaj merge'a jako następnego kroku, skoro wymagana weryfikacja
nie została wykonana. Przy zmianie bez części wizualnej pomiń ten krok i powiedz, że
nie dotyczy.

**Nie wywołuj `gh pr merge`.** Nawet gdy CI jest zielone, a recenzja bez uwag.
`main` ma zostawać w stanie, który się buduje.

## Odpowiedź

Krótki raport, po polsku (`AGENTS.md` → „Finishing a task"), jedna–trzy linie na punkt:

1. **Co zmieniono i dlaczego.**
2. **Co sprawdzono, a czego nie** — z ograniczeniami wprost (brak podglądu w przeglądarce,
   brak runu CI, brak przebiegu produkcyjnego).
3. **Jedna istotna lekcja programistyczna.**
4. **Wyjaśnienie finansowe** — tylko jeśli zadanie dotyczyło pieniędzy.
5. **Link do PR-a i następny krok** — plus SHA i zdanie, że merge czeka na zgodę Kamila.
   Jeśli to `wip/*` bez PR-a — powiedz to zamiast linku.
