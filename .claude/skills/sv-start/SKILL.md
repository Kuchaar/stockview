---
description: Start sesji StockView — synchronizacja z GitHubem i przypomnienie, gdzie skończyłem
disable-model-invocation: true
allowed-tools: Bash(npm run sync) Bash(git *) Bash(hostname) Read
---

# Start sesji StockView

Cel: w kilkanaście sekund doprowadzić repo do stanu aktualnego i przypomnieć, na czym
stanęła poprzednia sesja — niezależnie od tego, czy była na Macu, czy na PC.

## Kroki

1. Uruchom `npm run sync`. Skrypt robi `git fetch --prune`, `git pull --rebase --autostash`,
   w razie potrzeby `npm ci`, i wypisuje stan repo.
   - Jeśli skrypt zakończy się błędem rebase'a — **zatrzymaj się**. Pokaż jego instrukcję
     i nie próbuj rozwiązywać konfliktu samodzielnie.
2. Przeczytaj `docs/JOURNAL.md` — interesuje Cię **najnowszy wpis** (jest na górze pliku):
   data, komputer, co zostało zrobione i pole „Następne:".
3. Przeczytaj `docs/ROADMAP.md` — znajdź pierwsze niezaznaczone zadania `- [ ]` i ich
   warunki „gotowe, gdy…".

## Odpowiedź

Po polsku, **maksymalnie 6 linii**, bez powtarzania surowego outputu skryptu:

1. Na jakim komputerze i kiedy była poprzednia sesja.
2. Co było zapisane jako „Następne:".
3. **Jedno konkretne zadanie na ~40 minut** — nazwa z roadmapy plus zdanie, od czego zacząć.
   Wybierz to, które logicznie wynika z pola „Następne:", a nie pierwsze z brzegu.
4. Czy czekają gałęzie `wip/*` (jeśli tak — czyje i z kiedy).
5. Ostrzeżenia ze skryptu, jeśli jakieś były: zła wersja Node, niewypchnięte commity,
   niezacommitowane zmiany.

Jeśli czegoś nie ma (brak dziennika, brak otwartych zadań) — powiedz to wprost
jednym zdaniem, nie zmyślaj kontekstu.
