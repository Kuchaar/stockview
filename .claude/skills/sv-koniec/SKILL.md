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

### 2. Rebase przed sprawdzeniami, nie po

```
git fetch origin
git rebase origin/main
```

**Kolejność ma znaczenie.** Rebase zmienia drzewo i SHA, więc build zrobiony przed nim
dotyczy innej wersji niż ta, która pójdzie do PR-a: czysty rebase wciąga do gałęzi kod
z `main`, którego nikt tu nie testował, a rozwiązywanie konfliktu zmienia ją dodatkowo.
Dlatego rebase idzie **przed** krokiem 3, a jeśli musisz rebase'ować później — **powtórz
sprawdzenia**.

Przy konflikcie — **zatrzymaj się** i pokaż, co jest w konflikcie.

Gałąź już wypchnięta: rebase przepisuje opublikowane commity, więc push wymaga
`--force-with-lease` (nigdy samego `--force`). Jeśli nie musisz — nie rebase'uj; same nowe
commity wchodzą fast-forward.

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
| wyłącznie dokumentacja lub instrukcje | **nic się nie uruchamia** — powiedz to wprost |

Jeśli build nie przechodzi — **zatrzymaj się**, powiedz co się wywala (plik, linia,
komunikat) i zaproponuj naprawę. Nie commituj zepsutego builda.

**Zielony build nie jest dowodem na poprawność instrukcji ani reguły.** Przy zmianie
w `AGENTS.md` czy w skillach build mówi tylko tyle, że aplikacja nadal się buduje.

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

Praca niedokończona (`wip/*`) **nie dostaje PR-a** — zostaje jako gałąź do podjęcia na
drugim komputerze: `npm run sync` → `git switch wip/<opis>`.

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
