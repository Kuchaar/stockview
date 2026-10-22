---
description: Start sesji StockView — synchronizacja, otwarte PR-y i propozycja następnego zadania
disable-model-invocation: true
allowed-tools: Bash(npm run sync) Bash(git *) Bash(hostname) Bash(gh auth status) Bash(gh pr list *) Bash(gh pr view *) Bash(gh pr checks *) Bash(gh run list *) Read
---

# Start sesji StockView

Cel: w kilkanaście sekund doprowadzić repo do stanu aktualnego, pokazać, co czeka
w otwartych PR-ach, i **samemu zaproponować następne zadanie** z roadmapy — bez czekania
na prompt od GPT.

> `gh api` **nie jest** na liście `allowed-tools`. To celowe: `gh api` potrafi pisać
> (`--method`, a pola same przełączają je na POST), więc każde wywołanie ma zapytać
> o zgodę, zamiast przechodzić po cichu przy rutynowym starcie sesji.

## Kroki

1. Uruchom `npm run sync`. Skrypt robi `git fetch --prune`, `git pull --rebase --autostash`,
   w razie potrzeby `npm ci`, i wypisuje stan repo.
   - Jeśli skrypt zakończy się błędem rebase'a — **zatrzymaj się**. Pokaż jego instrukcję
     i nie próbuj rozwiązywać konfliktu samodzielnie.

2. **Otwarte PR-y, status CI i nierozwiązane uwagi.**

   ```
   gh pr list --state open
   gh pr checks <nr>                                  # status CI
   gh pr view <nr> --json headRefOid,title,body
   gh pr view <nr> --comments                         # komentarze ogólne
   ```

   Stan wątków recenzji bierz z GraphQL, bo REST go nie oddaje (`gh api` zapyta o zgodę):

   ```
   gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){
     repository(owner:$owner,name:$repo){ pullRequest(number:$pr){
       headRefOid
       reviews(last:20){nodes{state commit{oid} author{login}}}
       reviewThreads(first:100){nodes{id isResolved isOutdated
         comments(first:1){nodes{path line author{login} body}}}}}}}' \
     -F owner=Kuchaar -F repo=stockview -F pr=<nr>
   ```

   **Status CI ma cztery stany, nie dwa** (`gh pr checks` zwraca `pass`, `fail`, `pending`,
   `skipping`, `cancel`):
   - **zielony** — przeszło,
   - **czerwony** — `fail` albo `cancel`,
   - **trwa** — `pending`; to nie jest ani zielone, ani czerwone,
   - **brak runu** — check nie pojawia się na liście albo jest `skipping`. `ci.yml` ma
     `paths-ignore` na `docs/**` i `**/*.md`, ale **pomija build tylko wtedy, gdy wszystkie**
     zmienione pliki pasują do wzorca. Brak runu to brak sprawdzenia, nie zaliczenie.

   **Co liczy się jako nierozwiązana uwaga** — nie zgaduj z liczby komentarzy:
   - każdy wątek z `isResolved: false` (odpowiedź autora **nie** zamyka wątku — zamyka go
     dopiero mutacja `resolveReviewThread`),
   - `headRefOid`, do którego **nie ma żadnego review** — dodanie commita po
     `CHANGES_REQUESTED` niczego nie zamyka. Dopóki aktualny SHA nie został zrecenzowany,
     PR jest „czeka na recenzję aktualnego SHA", choćby wszystkie wątki były pozamykane.

   **Brak komentarzy nie znaczy „zaakceptowane".** Rozróżniaj trzy rzeczy: *brak recenzji*,
   *recenzja zakończona bez uwag* (recenzent nazwał sprawdzony SHA i ograniczenia — np. bot
   Codex, który przy braku uwag zostawia reakcję 👍) i *zgoda Kamila na merge*. Pisz, którą
   z nich masz.

   Jeśli `gh auth status` kończy się błędem — powiedz to jednym zdaniem i pomiń ten punkt.
   Nie zgaduj, co jest w PR-ach.

3. Przeczytaj `docs/JOURNAL.md` — **najnowszy wpis** (na górze pliku): data, komputer,
   co zostało zrobione i pole „Następne:".

4. Przeczytaj `docs/ROADMAP.md` — pierwsze niezaznaczone zadania `- [ ]` i ich warunki
   „gotowe, gdy…".

5. Sprawdź, czy nie zbliża się **przegląd GPT**: `AGENTS.md` → „GPT review handover"
   podaje ostatni zrecenzowany SHA i kadencję (3–5 małych PR-ów albo raz w tygodniu).
   Policz PR-y scalone od tego SHA. Jeśli próg jest przekroczony — powiedz to, ale **nie
   wstrzymuj pracy**: przegląd jest kadencją, nie bramką. Blokują wyłącznie zmiany wysokiego
   ryzyka czekające na recenzenta.

## Odpowiedź

Po polsku, **maksymalnie 8 linii**, bez powtarzania surowego outputu skryptu:

1. Na jakim komputerze i kiedy była poprzednia sesja, i co było w „Następne:".
2. **Otwarte PR-y**: numer, tytuł, poziom ryzyka z opisu, status CI (zielony / czerwony /
   trwa / brak runu) i stan recenzji (ile wątków `isResolved: false`, czy aktualny SHA
   był recenzowany).
3. **Jedno konkretne zadanie na ~40 minut** — Twoja propozycja, nazwa z roadmapy plus
   zdanie, od czego zacząć. Kolejność pierwszeństwa:
   1. PR z nierozwiązanymi wątkami albo z niezrecenzowanym aktualnym SHA → `/sv-review`,
   2. PR wysokiego ryzyka czekający na recenzenta → **nie czekaj**, weź niezależne zadanie
      o niższym ryzyku i powiedz, że tamten PR stoi,
   3. pierwsze otwarte zadanie z roadmapy, wybrane po polu „Następne:", nie po kolejności.
4. Czy czekają gałęzie `wip/*` (jeśli tak — z kiedy).
5. Ostrzeżenia ze skryptu: zła wersja Node, niewypchnięte commity, niezacommitowane zmiany.
6. Czy zbliża się przegląd GPT (jedna linia, tylko jeśli próg przekroczony).

Jeśli czegoś nie ma (brak dziennika, brak otwartych zadań) — powiedz to wprost jednym
zdaniem, nie zmyślaj kontekstu.
