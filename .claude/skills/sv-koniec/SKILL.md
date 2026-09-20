---
description: Koniec sesji StockView — build, wpis do dziennika, commit i push
disable-model-invocation: true
allowed-tools: Bash(npm run sync) Bash(npm run build) Bash(git *) Bash(hostname) Bash(git push *) Read
argument-hint: "[co zrobiłem]"
---

# Koniec sesji StockView

Cel: nie zostawić pracy uwięzionej na jednym komputerze i zapisać kontekst, żeby następna
sesja nie zaczynała się od archeologii.

`$ARGUMENTS` to krótki opis tego, co zostało zrobione — jeśli jest pusty, ustal to
z rozmowy i z `git status` / `git diff`.

## Kroki

### 1. Build

Uruchom `npm run build`. Musi zakończyć się linią `✓ Generated dist/sitemap.xml`.

Jeśli build nie przechodzi — **zatrzymaj się**. Powiedz, co konkretnie się wywala
(plik, linia, komunikat) i zaproponuj naprawę. Nie commituj zepsutego builda.

### 2. Wpis do dziennika

Zaproponuj wpis **na górę** `docs/JOURNAL.md`, pod komentarzem HTML, w formacie zgodnym
z resztą pliku:

```markdown
## RRRR-MM-DD — <krótki tytuł sesji>

Komputer: `<hostname>`

**Zrobione.** …
**Decyzje.** …   ← tylko jeśli jakieś zapadły; wraz z powodem
**Następne:** …
```

Datę weź z `date +%Y-%m-%d`, komputer z `hostname`. Pisz konkretnie: nazwy plików,
liczby, nazwy commitów — nie „poprawiono różne rzeczy".

**Pokaż wpis i poczekaj na „ok".** Nie zapisuj go do pliku, zanim nie potwierdzę.

### 3. Commit i push

Po akceptacji: zapisz wpis, dodaj **tylko pliki z tej sesji** (nie `git add -A`)
i zacommituj w konwencji conventional commits z opisem po polsku:

- `feat:` nowa funkcja
- `fix:` poprawka błędu
- `chore:` konfiguracja, narzędzia, zależności
- `docs:` dokumentacja i dziennik

Potem `git push`. Jeśli push zostanie odrzucony (bot z cenami wszedł w międzyczasie):
`git pull --rebase` i ponów push. Przy konflikcie w rebase — zatrzymaj się i pokaż,
co jest w konflikcie.

### 4. Praca niedokończona

Jeśli robota nie jest skończona, a jesteśmy na `main`:

1. Zaproponuj gałąź `wip/<krótki-opis>` (kebab-case, np. `wip/portfel-schema`).
2. Po akceptacji: `git switch -c wip/<opis>`, commit, `git push -u origin wip/<opis>`.
3. Powiedz wprost, jak to podjąć na drugim komputerze:
   `npm run sync` → `git switch wip/<opis>`.

`main` ma zostawać w stanie, który się buduje.

## Odpowiedź

Na koniec krótko: co zostało zacommitowane (hash + tytuł), gdzie to poszło
(`main` czy `wip/*`), i co jest zapisane jako „Następne:".
