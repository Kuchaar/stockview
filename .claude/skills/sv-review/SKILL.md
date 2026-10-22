---
description: Recenzja StockView — zebranie uwag z PR-a, poprawki w zakresie zadania i nowy SHA
disable-model-invocation: true
allowed-tools: Bash(npm run build) Bash(git *) Bash(git push *) Bash(gh pr list *) Bash(gh pr view *) Bash(gh pr diff *) Bash(gh pr checks *) Bash(gh api *) Read Edit Write
argument-hint: "[numer PR-a]"
---

# Recenzja StockView

Cel: zamienić uwagi z recenzji na poprawki, bez pytania Kamila o każdą z osobna i bez
cichego rozszerzania zakresu zadania.

`$ARGUMENTS` to numer PR-a. Jeśli jest pusty — weź PR dla bieżącej gałęzi
(`gh pr view --json number`), a jeśli i tego nie ma, pokaż `gh pr list --state open`
i spytaj który.

## Kroki

### 1. Ustal, czego dotyczy recenzja

```
gh pr view <nr> --json number,title,headRefName,headRefOid,baseRefName,body
git fetch origin && git switch <headRefName> && git log --oneline -1
```

Zapisz **SHA, którego dotyczyły uwagi** (z opisu PR-a albo z `commit_id` komentarzy)
i porównaj z `headRefOid`. Jeśli gałąź przesunęła się od czasu recenzji, powiedz to —
część uwag może być nieaktualna i trzeba je sprawdzić względem nowego diffu.

### 2. Zbierz wszystkie trzy rodzaje uwag

Nie wystarczy jedno źródło — GitHub trzyma je w trzech miejscach:

```
gh pr view <nr> --comments                                        # komentarze ogólne
gh api repos/{owner}/{repo}/pulls/<nr>/reviews                    # reviews + ich stan
gh api repos/{owner}/{repo}/pulls/<nr>/comments                   # komentarze do linii
gh pr checks <nr>                                                 # status CI
```

Zrób z nich jedną listę: plik, linia, treść uwagi, autor, i priorytet według
„Code review rules" w `AGENTS.md` (P1 / P2 / P3).

**Brak komentarzy nie jest akceptacją.** Jeśli nic nie przyszło — napisz „recenzji nie
ma", nie „recenzja bez uwag", i zatrzymaj się. Nie ma czego poprawiać.

### 3. Rozdziel uwagi na trzy kubełki

- **Potwierdzony błąd w zakresie zadania** — sprawdziłeś w kodzie, że uwaga jest
  prawdziwa, a poprawka mieści się w zakresie z opisu PR-a.
  → **Popraw bez pytania.** Nie pytaj o każdą osobno.
- **Uwaga sporna** — uwaga jest nieprawdziwa, nieaktualna, albo to P3, który odrzucasz.
  → **Nie poprawiaj. Uzasadnij.** Jedno–dwa zdania plus odwołanie do kodu albo do reguły.
  Odpowiedz w wątku komentarza, żeby nie została jako nierozwiązana.
- **Uwaga wychodząca poza zakres** — słuszna, ale wymaga zmiany innego pliku, migracji,
  nowej zależności albo dotyka prawa/regulacji.
  → **Przedstaw Kamilowi i czekaj.** Napisz, czego dotyczy, czym grozi odłożenie i czy
  proponujesz osobne zadanie w roadmapie. Nie dopisuj tego do tego PR-a na własną rękę.

Recenzent zgłasza, autor poprawia — nie odwrotnie. Nie przepisuj za recenzenta jego uwag
i nie zamykaj wątku bez odpowiedzi.

### 4. Popraw i sprawdź właściwy zakres

Poprawki w osobnych commitach (`fix:` albo `docs:`), opis po polsku, co uwaga za uwagą.

Potem uruchom **sprawdzenia odpowiadające temu, co zmieniłeś** — nie cały rytuał
na ślepo i nie wyłącznie build:

| Zmiana dotyczy | Co uruchomić |
|---|---|
| kod `src/` lub `functions/` | `npm run build` |
| `/api/*` | `npm run dev:full` i `curl` na konkretny endpoint |
| teksty w UI | oba języki (`t()` ma wpis `pl` i `en`) i oba motywy |
| liczby, wskaźniki, waluty | ręczne przeliczenie na jednej spółce, z podaniem okresu |
| skrypty w `scripts/` | przebieg na jednej spółce, nigdy importer produkcyjny na całości |
| wyłącznie dokumentacja | nic się nie uruchamia — powiedz to wprost |

Zasada z `AGENTS.md`: **zmiana po recenzji wymaga ponownego sprawdzenia tego zakresu,
który mogła zepsuć.** Nie całego zadania od zera, ale każdego kryterium, które dotyczy.

### 5. Wypchnij i wskaż nowy SHA

```
git fetch origin && git rebase origin/main
git push
git rev-parse HEAD
```

Nowy SHA podaj jawnie i dopisz go w komentarzu do PR-a — recenzja dotyczy konkretnej
wersji, więc kolejne przejście musi wiedzieć, której.

**Nie scalaj PR-a.** Merge to decyzja Kamila dotycząca tego jednego PR-a.

## Odpowiedź

Po polsku, krótko:

1. **SHA recenzowany → SHA nowy.**
2. **Poprawione** — lista: uwaga → co zmieniono, z priorytetem (P1/P2/P3).
3. **Odrzucone ze sporu** — uwaga → uzasadnienie, jedno zdanie każde.
4. **Dla Kamila** — uwagi wychodzące poza zakres, z propozycją (osobne zadanie / zmiana
   zakresu / zostawiamy).
5. **Wynik sprawdzeń i czego nie sprawdzono.**
6. Status CI dla nowego SHA, z rozróżnieniem „zielone / czerwone / brak runu".
