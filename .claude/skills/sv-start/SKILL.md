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
   gh pr view <nr> --json headRefOid,title,body,mergeable,mergeStateStatus,reactionGroups
   gh pr view <nr> --comments                         # komentarze ogólne
   ```

   Stan wątków recenzji bierz z GraphQL, bo REST go nie oddaje (`gh api` zapyta o zgodę):

   ```
   gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){
     repository(owner:$owner,name:$repo){ pullRequest(number:$pr){
       headRefOid
       reviews(last:20){nodes{state submittedAt commit{oid} author{login}
         reactionGroups{content users{totalCount}}}}
       reviewThreads(first:100){nodes{id isResolved isOutdated
         comments(first:1){nodes{path line author{login} body}}}}}}}' \
     -F owner=Kuchaar -F repo=stockview -F pr=<nr>
   ```

   `reactionGroups` nie jest ozdobą: bot Codex przy **braku uwag** nie pisze komentarza,
   tylko zostawia reakcję 👍. Żadne z pozostałych zapytań jej nie oddaje (`gh pr view
   --comments` jej nie pokazuje), więc bez niej recenzja zakończona bez uwag wygląda jak
   brak recenzji — i PR kręci się w kółko między `/sv-start` i `/sv-review`. Jeśli reakcji
   nie da się powiązać z konkretnym SHA, napisz „reakcja bez powiązania z SHA" — nie
   zakładaj, że dotyczy aktualnego.

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
     PR jest „czeka na recenzję aktualnego SHA", choćby wszystkie wątki były pozamykane,
   - **review ze stanem `CHANGES_REQUESTED` na aktualnym SHA** — recenzent może zgłosić
     uwagi w samej treści review, bez ani jednego komentarza do linii. Wtedy wątków jest
     zero, a uwagi są. Patrz na `state` ostatniego review dla tego SHA, nie na to, czy
     jakiekolwiek review istnieje.

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
   podaje **ostatni zrecenzowany SHA wraz z datą** i kadencję (3–5 małych PR-ów albo raz
   w tygodniu). Oba progi licz osobno:
   - **PR-y** — `gh pr list --state merged --limit 20` i policz te scalone po tym SHA;
   - **tydzień** — z **daty przeglądu zapisanej w `AGENTS.md`**, nie z daty commita. Data
     commita mówi, kiedy kod powstał, a nie kiedy ktoś go przejrzał; bez zapisanej daty
     progu tygodniowego nie da się policzyć i cichy tydzień przeszedłby niezauważony.
     Jeśli data to `nieustalony` — powiedz wprost, że próg tygodniowy nie ma od czego liczyć.

   Jeśli próg jest przekroczony — powiedz to, ale **nie wstrzymuj pracy**: przegląd jest
   kadencją, nie bramką. Blokują wyłącznie zmiany wysokiego ryzyka czekające na recenzenta.

## Odpowiedź

Po polsku, **maksymalnie 8 linii**, bez powtarzania surowego outputu skryptu:

1. Na jakim komputerze i kiedy była poprzednia sesja, i co było w „Następne:".
2. **Otwarte PR-y**: numer, tytuł, poziom ryzyka z opisu, status CI (zielony / czerwony /
   trwa / brak runu) i stan recenzji (ile wątków `isResolved: false`, czy aktualny SHA
   był recenzowany).
3. **Jedno konkretne zadanie na ~40 minut** — Twoja propozycja, nazwa z roadmapy plus
   zdanie, od czego zacząć. Kolejność pierwszeństwa, **od góry, pierwsze trafienie wygrywa**:

   1. **Czerwone CI na otwartym PR-ze** → naprawa tego PR-a. Zepsuty build nie czeka na
      recenzenta ani na roadmapę.
   2. **PR wysokiego ryzyka, którego aktualny SHA czeka na wymaganego recenzenta** →
      **nie kieruj do `/sv-review`** i **nie czekaj**: powiedz, że ten PR stoi, i weź
      niezależne zadanie o niższym ryzyku (punkt 5). Ten przypadek **musi być sprawdzony
      przed punktem 4**, bo taki PR z definicji ma niezrecenzowany `headRefOid` — wpadłby
      w „niezrecenzowany SHA", dostałby `/sv-review`, a ten przy braku recenzji zatrzymuje
      się. Efekt byłby odwrotny do zasady: brak recenzenta blokowałby całą pracę.
   3. **PR z nierozwiązanymi wątkami albo z `CHANGES_REQUESTED` na aktualnym SHA** →
      `/sv-review`. Tu uwagi istnieją, więc jest co poprawiać.
   4. **PR, którego aktualny SHA nie został zrecenzowany, a który na nikogo nie czeka** →
      **poproś o recenzję** (komentarz `@codex review` albo zagób wskazanego recenzenta),
      nie wołaj `/sv-review`. Samo wskazanie SHA recenzji nie uruchamia.
   5. **Pierwsze otwarte zadanie z roadmapy**, wybrane po polu „Następne:", nie po
      kolejności w pliku.

   **Przy punktach 2 i 5 zejdź z recenzowanej gałęzi, zanim zaczniesz.** Po `/sv-koniec`
   checkout zostaje na gałęzi PR-a, a `/sv-koniec` każe później „zostać na gałęzi
   roboczej" — bez przejścia nowe zadanie wyląduje commitami na PR-ze, który jest
   w recenzji, zmieniając jego zakres i zrecenzowaną wersję:

   ```
   git switch main && git pull --rebase
   ```
4. Czy czekają gałęzie `wip/*` (jeśli tak — z kiedy).
5. Ostrzeżenia ze skryptu: zła wersja Node, niewypchnięte commity, niezacommitowane zmiany.
6. Czy zbliża się przegląd GPT (jedna linia, tylko jeśli próg przekroczony).

Jeśli czegoś nie ma (brak dziennika, brak otwartych zadań) — powiedz to wprost jednym
zdaniem, nie zmyślaj kontekstu.
