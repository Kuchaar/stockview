---
description: Recenzja StockView — zebranie uwag z PR-a, poprawki w zakresie zadania i nowy SHA
disable-model-invocation: true
allowed-tools: Bash(npm run build) Bash(git *) Bash(git push *) Bash(gh pr list *) Bash(gh pr view *) Bash(gh pr diff *) Bash(gh pr checks *) Read Edit Write
argument-hint: "[numer PR-a]"
---

# Recenzja StockView

Cel: zamienić uwagi z recenzji na poprawki, bez pytania Kamila o każdą z osobna i bez
cichego rozszerzania zakresu zadania.

`$ARGUMENTS` to numer PR-a. Jeśli jest pusty — weź PR dla bieżącej gałęzi
(`gh pr view --json number`), a jeśli i tego nie ma, pokaż `gh pr list --state open`
i spytaj który.

> `gh api` nie jest na liście `allowed-tools` — potrafi pisać, więc każde wywołanie pyta
> o zgodę. Dotyczy to też mutacji GraphQL w kroku 5.

## Kroki

### 1. Stań dokładnie na recenzowanym SHA

```
gh pr view <nr> --json number,title,headRefName,headRefOid,baseRefName,body,mergeable,mergeStateStatus
git status --porcelain          # musi być pusto
git fetch origin
git switch <headRefName>
git merge --ff-only origin/<headRefName>
git rev-parse HEAD              # musi równać się headRefOid
```

`git fetch` aktualizuje tylko `origin/*`, a `git switch` wchodzi na **lokalną** gałąź —
na drugim komputerze może ona być starsza od PR-a i poprawki wylądują na innym SHA niż
recenzowany. Dlatego: czyste drzewo robocze, fast-forward z `origin/<headRefName>`
i jawne sprawdzenie, że `HEAD == headRefOid`. Jeśli fast-forward nie przechodzi albo SHA
się nie zgadza — **zatrzymaj się** i powiedz, co jest rozjechane.

`mergeable` i `mergeStateStatus` pobierz **tutaj**, nie dopiero przy pushu: krok 5
decyduje na ich podstawie, czy rebase'ować. Bez nich poprawki wejdą, a PR zostanie
skonfliktowany i nikt tego nie zauważy. `UNKNOWN` to stan przejściowy — GitHub jeszcze
liczy; odpytaj ponownie po kilku sekundach, zamiast traktować go jak konflikt.

Zapisz też **SHA, którego dotyczyły uwagi** (`commit_id` komentarzy, `commit.oid` review).
Jeśli jest inny niż `headRefOid`, część uwag może być nieaktualna — sprawdź je względem
nowego diffu, nie przyjmuj na słowo.

### 2. Zbierz uwagi ze wszystkich miejsc

GitHub trzyma je w czterech różnych miejscach i żadne nie zastępuje pozostałych:

```
gh pr view <nr> --comments                       # komentarze ogólne
gh pr checks <nr>                                # status CI
gh api repos/{owner}/{repo}/pulls/<nr>/reviews   # reviews + stan + commit_id
gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){
  repository(owner:$owner,name:$repo){ pullRequest(number:$pr){
    reviewThreads(first:100){nodes{id isResolved isOutdated
      comments(first:10){nodes{path line body author{login}}}}}}}}' \
  -F owner=Kuchaar -F repo=stockview -F pr=<nr>
```

Ostatnie zapytanie jest niezbędne: **REST nie oddaje stanu rozwiązania wątku**, a to on
decyduje, co jest jeszcze otwarte.

Zrób jedną listę: plik, linia, treść, autor, `id` wątku i priorytet wg „Code review rules"
w `AGENTS.md` (P1 / P2 / P3).

**Recenzja bez uwag jest skończoną recenzją.** Rozróżnij trzy sytuacje i nie zwijaj ich
w jedną:
- **recenzji nie ma** — nikt nie patrzył. Nie ma czego poprawiać; powiedz to i zatrzymaj
  się. To nie jest akceptacja.
- **recenzja była i nie znalazła nic** — recenzent nazwał sprawdzony SHA i ograniczenia
  weryfikacji (bot Codex przy braku uwag zostawia reakcję 👍). To wynik pełnoprawny:
  zapisz sprawdzony SHA i ograniczenia, i tyle. Nie szukaj błędu na siłę, żeby „zaliczyć"
  proces.
- **są uwagi** — idź do kroku 3.

### 3. Rozdziel uwagi na trzy kubełki

- **Potwierdzony błąd w zakresie zadania** — sprawdziłeś w kodzie, że uwaga jest prawdziwa,
  a poprawka mieści się w zakresie z opisu PR-a.
  → **Popraw bez pytania.** Nie pytaj o każdą osobno.
- **Uwaga sporna** — nieprawdziwa, nieaktualna, albo P3, który odrzucasz.
  → **Nie poprawiaj. Uzasadnij** jednym–dwoma zdaniami, z odwołaniem do kodu albo do reguły,
  odpowiadając w wątku.
- **Uwaga wychodząca poza zakres** — słuszna, ale wymaga innego pliku, migracji, nowej
  zależności, albo dotyka prawa i regulacji.
  → **Przedstaw Kamilowi i czekaj.** Napisz, czego dotyczy, czym grozi odłożenie i czy
  proponujesz osobne zadanie w roadmapie. Nie dopisuj tego do tego PR-a na własną rękę.

Recenzent zgłasza, autor poprawia — nie odwrotnie.

### 4. Popraw, zapisz w dzienniku i sprawdź właściwy zakres

Poprawki w osobnych commitach (`fix:` albo `docs:`), opis po polsku, uwaga za uwagą.

**Jeśli cała sesja to sam `/sv-review`, dziennik nadal musi dostać wpis** — inaczej
`/sv-start` na drugim komputerze przeczyta pole „Następne:" z **przed** recenzji i nie
dowie się ani o nowym SHA, ani o ograniczeniach weryfikacji, ani o uwagach, które zostały
otwarte. Dopisz do `docs/JOURNAL.md` przed commitem poprawek: co zgłoszono, co poprawione,
co odrzucone z uzasadnieniem, co czeka na Kamila, nowy SHA i nowe „Następne:". Format
i zasada „pokaż wpis i poczekaj na ok" — jak w `/sv-koniec`, krok 5.

Potem uruchom sprawdzenia dobrane do tego, co zmieniłeś — tabela jest w `/sv-koniec`,
krok 3. Zasada z `AGENTS.md`: **zmiana po recenzji wymaga sprawdzenia tego zakresu, który
mogła zepsuć** — nie całego zadania od zera, ale każdego dotkniętego kryterium.

Zielony build nie jest dowodem na poprawność reguły ani instrukcji.

### 5. Wypchnij, zamknij wątki, wskaż nowy SHA

```
git push                        # same nowe commity wchodzą fast-forward
git rev-parse HEAD
```

Rebase rób **tylko wtedy**, gdy PR przestał być `MERGEABLE`. Wtedy po rebase:
**powtórz sprawdzenia** (rebase zmienia drzewo i SHA) i pushuj z `--force-with-lease` —
nigdy samym `--force`. Bez lease push po rebase gałęzi już opublikowanej zostanie odrzucony
jako non-fast-forward i poprawki nigdy nie trafią do PR-a.

**Odpowiedź w wątku go nie zamyka.** Wątek zamyka dopiero mutacja — zrób to dla każdego
wątku, który załatwiłeś albo odrzuciłeś z uzasadnieniem:

```
gh api graphql -f query='mutation($id:ID!){
  resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -F id=<thread id>
```

Wątków spornych nie zamykaj, dopóki nie wpiszesz w nie uzasadnienia. Wątków poza zakresem
nie zamykaj wcale — czekają na decyzję Kamila.

Na koniec dopisz **nowy SHA w komentarzu do PR-a** razem z tym, co ponownie sprawdzono,
i **odpytaj CI jeszcze raz — już dla nowego SHA**:

```
gh pr checks <nr>
```

Wynik z kroku 2 dotyczył **poprzedniego** SHA. Podanie go jako statusu nowego to
raportowanie zielonego tam, gdzie checki mogą trwać, nie istnieć albo się wywalić.

**I poproś o ponowną recenzję.** Samo wskazanie SHA jej nie uruchamia — bez prośby PR
zostaje z niezrecenzowanym `headRefOid`, `/sv-start` skieruje go z powrotem tutaj,
a krok 2 zatrzyma się na „recenzji nie ma". Fix-round wisiałby bez końca:

```
gh pr comment <nr> --body "@codex review"
```

Przy zmianie wysokiego ryzyka zagób zamiast tego wskazanego recenzenta i powiedz Kamilowi,
że PR na niego czeka.

**Nie scalaj PR-a.** Merge to zgoda Kamila na ten konkretny PR.

## Odpowiedź

Po polsku, krótko:

1. **SHA recenzowany → SHA nowy.**
2. **Poprawione** — uwaga → co zmieniono, z priorytetem (P1/P2/P3).
3. **Odrzucone ze sporu** — uwaga → uzasadnienie, jedno zdanie każde.
4. **Dla Kamila** — uwagi poza zakresem, z propozycją (osobne zadanie / zmiana zakresu /
   zostawiamy).
5. **Co sprawdzono ponownie, a czego nie.**
6. **Stan wątków** (ile zamkniętych, ile otwartych i dlaczego) oraz status CI dla nowego
   SHA — „zielone / czerwone / trwa / brak runu".
