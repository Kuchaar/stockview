---
description: Koniec sesji StockView — build, wpis do dziennika, commit, push gałęzi i PR (bez merge)
disable-model-invocation: true
allowed-tools: Bash(npm run sync) Bash(npm run build) Bash(git *) Bash(hostname) Bash(git push *) Bash(gh pr create *) Bash(gh pr view *) Bash(gh pr list *) Bash(gh pr checks *) Read
argument-hint: "[co zrobiłem]"
---

# Koniec sesji StockView

Cel: nie zostawić pracy uwięzionej na jednym komputerze, zapisać kontekst i wystawić PR
do recenzji. **Ta komenda nigdy nie scala.** Merge to decyzja Kamila dotycząca konkretnego
PR-a.

`$ARGUMENTS` to krótki opis tego, co zostało zrobione — jeśli jest pusty, ustal to
z rozmowy i z `git status` / `git diff`.

## Kroki

### 1. Gałąź

Zmiany ręczne nie idą na `main` (patrz „Workflow" w `AGENTS.md`). Jeśli jesteśmy na `main`:

1. Zaproponuj nazwę w konwencji `feat/*`, `fix/*`, `chore/*` albo `docs/*` (kebab-case,
   np. `feat/portfel-schema`). Dla pracy niedokończonej — `wip/*`.
2. Po akceptacji: `git switch -c <nazwa>`.

Jeśli jesteśmy już na gałęzi roboczej — zostajemy na niej.

### 2. Build

Uruchom `npm run build`. Musi zakończyć się linią `✓ Generated dist/sitemap.xml`.

Jeśli build nie przechodzi — **zatrzymaj się**. Powiedz, co konkretnie się wywala
(plik, linia, komunikat) i zaproponuj naprawę. Nie commituj zepsutego builda.

Przy zmianie wyłącznie dokumentacyjnej build nic nie sprawdza — powiedz to wprost,
zamiast podawać go jako dowód.

### 3. Wpis do dziennika

Zaproponuj wpis **na górę** `docs/JOURNAL.md`, pod komentarzem HTML, w formacie zgodnym
z resztą pliku:

```markdown
## RRRR-MM-DD — <krótki tytuł sesji>

Komputer: `<hostname>`

**Zrobione.** …
**Decyzje.** …   ← tylko jeśli jakieś zapadły; wraz z powodem
**Do sprawdzenia.** …   ← co NIE zostało zweryfikowane
**Następne:** …
```

Datę weź z `date +%Y-%m-%d`, komputer z `hostname`. Pisz konkretnie: nazwy plików,
liczby, nazwy commitów — nie „poprawiono różne rzeczy".

**Pokaż wpis i poczekaj na „ok".** Nie zapisuj go do pliku, zanim nie potwierdzę.

### 4. Commit i push gałęzi

Po akceptacji: zapisz wpis, dodaj **tylko pliki z tej sesji** (nie `git add -A`)
i zacommituj w konwencji conventional commits z opisem po polsku:

- `feat:` nowa funkcja
- `fix:` poprawka błędu
- `chore:` konfiguracja, narzędzia, zależności
- `docs:` dokumentacja i dziennik

Potem przestaw gałąź na świeży `main` i wypchnij ją:

```
git fetch origin
git rebase origin/main
git push -u origin <nazwa-gałęzi>
```

Bot z cenami wchodzi na `main` w każdy dzień roboczy, więc rebase przed pushem jest
regułą, nie wyjątkiem. Przy konflikcie w rebase — **zatrzymaj się** i pokaż,
co jest w konflikcie.

### 5. Pull request

```
gh pr create --base main --head <nazwa-gałęzi> --title "<tytuł>" --body "<opis>"
```

Opis PR-a po polsku, z czterema częściami zadania (`AGENTS.md` → „Collaboration"):

```markdown
## Cel
…dlaczego ta zmiana istnieje

## Zakres
…jakie pliki i zachowania dotyka, czego celowo nie rusza

## Kryteria akceptacji
…warunek „gotowe, gdy…"

## Weryfikacja
…co uruchomiono i z jakim wynikiem; czego NIE sprawdzono

## Do recenzji
SHA: `<pełny sha>`
```

SHA bierz z `git rev-parse HEAD` **po** rebase i pushu. Recenzja dotyczy tego SHA, więc
od tego momentu nie dotykaj gałęzi, dopóki uwagi nie wrócą.

Praca niedokończona (`wip/*`) **nie dostaje PR-a** — zostaje jako gałąź do podjęcia na
drugim komputerze. Powiedz wprost, jak ją podjąć: `npm run sync` → `git switch wip/<opis>`.

**Nie wywołuj `gh pr merge`.** Nawet gdy CI jest zielone, a recenzja bez uwag.

`main` ma zostawać w stanie, który się buduje.

## Odpowiedź

Na koniec raport z pięciu punktów (`AGENTS.md` → „Finishing a task"), po polsku,
każdy punkt jedna–trzy linie:

1. **Co i dlaczego zmieniono** — plus hash i tytuł commita oraz gałąź.
2. **Wynik sprawdzeń i ograniczenia weryfikacji** — co przeszło, czego nie sprawdzono
   (brak podglądu w przeglądarce, CI pominięte przez `paths-ignore`, brak przebiegu
   produkcyjnego).
3. **Krótkie wyjaśnienie programistyczne** — nieoczywista decyzja, dwa–trzy zdania.
4. **Wyjaśnienie finansowe** — tylko jeśli zadanie dotyczyło pieniędzy: co liczba znaczy,
   za jaki okres i w jakiej walucie, i czego nie znaczy.
5. **Jedna rzecz do sprawdzenia przez Kamila** — jedna komenda, URL albo strona,
   z oczekiwanym wynikiem.

Na końcu: link do PR-a, SHA do recenzji i zdanie, że merge czeka na decyzję Kamila.
Jeśli to `wip/*` bez PR-a — powiedz to zamiast linku.
