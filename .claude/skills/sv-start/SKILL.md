---
description: Start sesji StockView — synchronizacja z GitHubem, otwarte PR-y i przypomnienie, gdzie skończyłem
disable-model-invocation: true
allowed-tools: Bash(npm run sync) Bash(git *) Bash(hostname) Bash(gh pr list *) Bash(gh pr view *) Bash(gh pr checks *) Bash(gh run list *) Bash(gh api *) Read
---

# Start sesji StockView

Cel: w kilkanaście sekund doprowadzić repo do stanu aktualnego, pokazać, co czeka
w otwartych PR-ach, i przypomnieć, na czym stanęła poprzednia sesja — niezależnie od tego,
czy była na Macu, czy na PC.

## Kroki

1. Uruchom `npm run sync`. Skrypt robi `git fetch --prune`, `git pull --rebase --autostash`,
   w razie potrzeby `npm ci`, i wypisuje stan repo.
   - Jeśli skrypt zakończy się błędem rebase'a — **zatrzymaj się**. Pokaż jego instrukcję
     i nie próbuj rozwiązywać konfliktu samodzielnie.

2. **Otwarte PR-y, status CI i nieodpowiedziane uwagi.** Dla każdego otwartego PR-a:

   ```
   gh pr list --state open
   gh pr checks <nr>                              # status CI
   gh pr view <nr> --comments                     # komentarze ogólne
   gh api repos/{owner}/{repo}/pulls/<nr>/reviews  # reviews (APPROVE / CHANGES_REQUESTED)
   gh api repos/{owner}/{repo}/pulls/<nr>/comments # komentarze do linii
   ```

   Przy raportowaniu CI rozróżniaj trzy stany i nie łącz ich w jeden:
   - **zielony** — build przeszedł,
   - **czerwony lub trwa**,
   - **brak runu** — `ci.yml` ma `paths-ignore` na `docs/**` i `**/*.md`, więc PR
     wyłącznie z dokumentacją **nie odpala CI**. To brak sprawdzenia, nie zaliczenie.

   Tak samo z recenzją: **brak komentarzy nie znaczy „zaakceptowane"**. Napisz „brak
   recenzji", nie „bez uwag". Jako nierozwiązaną uwagę traktuj każdy komentarz do linii
   bez odpowiedzi autora i każde `CHANGES_REQUESTED` nowsze niż ostatni commit na gałęzi.

   Jeśli `gh` nie jest zalogowany (`gh auth status` kończy się błędem) — powiedz to jednym
   zdaniem i pomiń ten punkt. Nie zgaduj, co jest w PR-ach.

3. Przeczytaj `docs/JOURNAL.md` — interesuje Cię **najnowszy wpis** (jest na górze pliku):
   data, komputer, co zostało zrobione i pole „Następne:".

4. Przeczytaj `docs/ROADMAP.md` — znajdź pierwsze niezaznaczone zadania `- [ ]` i ich
   warunki „gotowe, gdy…".

## Odpowiedź

Po polsku, **maksymalnie 8 linii**, bez powtarzania surowego outputu skryptu:

1. Na jakim komputerze i kiedy była poprzednia sesja.
2. Co było zapisane jako „Następne:".
3. **Otwarte PR-y**: numer, tytuł, status CI (zielony / czerwony / brak runu) i liczba
   nieodpowiedzianych uwag. Jeśli nie ma żadnego — jedno zdanie, że nie ma.
4. **Jedno konkretne zadanie na ~40 minut** — nazwa z roadmapy plus zdanie, od czego zacząć.
   Jeśli czeka PR z `CHANGES_REQUESTED` albo z nieodpowiedzianymi uwagami, to **on** jest
   zadaniem (`/sv-review`), nie nowa pozycja z roadmapy.
5. Czy czekają gałęzie `wip/*` (jeśli tak — czyje i z kiedy).
6. Ostrzeżenia ze skryptu, jeśli jakieś były: zła wersja Node, niewypchnięte commity,
   niezacommitowane zmiany.

Jeśli czegoś nie ma (brak dziennika, brak otwartych zadań) — powiedz to wprost
jednym zdaniem, nie zmyślaj kontekstu.
