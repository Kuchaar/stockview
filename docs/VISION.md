# StockView — kierunek

> Odpowiedź na pytanie „w którą stronę idziemy”. Czytaj przed zaplanowaniem zadania,
> przy review i przed tygodniowym przeglądem GPT. Zmienia go tylko Kamil, z wpisem w JOURNAL.
>
> Ostatnia zmiana: 2026-10-23 · Źródła: brief wizji (22.10.2026), rozmowa z GPT (22.10.2026), ocena Claude'a.

## Misja

StockView pomaga ludziom, którzy chcą zacząć inwestować, ale są sceptyczni i „nie czują tego”,
przejść od „inwestowanie nie jest dla mnie” do „rozumiem podstawy i sam podejmuję decyzje”.
Wyjaśniamy bez zawstydzania, pokazujemy ograniczenia i źródła. Uczciwym wynikiem bywa też:
„jeszcze nie inwestuję — najpierw uporządkuję swoje finanse”. To buduje zaufanie.

## Docelowy produkt (kierunek, nie plan na teraz)

Jedno proste miejsce dla polskiego inwestora indywidualnego: dane o spółkach z objaśnieniem
każdej liczby, ocena kondycji, portfel (dywersyfikacja, efektywność), wycena jako kalkulator
z własnymi założeniami, edukacja. Start: 24 spółki WIG20. Docelowo: cała GPW, ETF-y, obligacje.

## Użytkownik rośnie razem z produktem

| Etap | Potrzeba | Co daje StockView | Po co wraca |
|---|---|---|---|
| Zaczynam | „Chcę zrozumieć, zanim zaryzykuję pieniądze” | Przykłady na kwotach, symulacje, krótkie ścieżki nauki, objaśnienie ryzyka | Kolejne pytania, przygotowanie do pierwszej decyzji |
| Inwestuję samodzielnie | „Chcę wiedzieć, co mam i co się zmienia” | Watchlista, notatki z własnymi założeniami, dywidendy, zmiany wyników, docelowo portfel | Nowe raporty i przegląd własnych inwestycji |
| Analizuję głębiej | „Chcę sprawdzać hipotezy i oszczędzać czas” | Porównania, historia ze źródłami, własne scenariusze, filtry, eksport | Kolejne analizy, utrwalony sposób pracy |

Po podstawach są dwie równorzędne ścieżki: **„inwestuję prosto i poświęcam temu mało czasu”**
oraz **„analizuję samodzielnie”**. Większe zaangażowanie nie oznacza więcej transakcji
ani więcej wskaźników.

## Zasady (filtr dla każdego zadania i review)

1. **Najpierw wiarygodność.** Dane z bazy w każdym widoku, źródło i data przy liczbach,
   żadnych ocen typu „atrakcyjna wycena”.
2. **Uczymy rozumieć, nie mówimy, co kupić.** Bez „kup/sprzedaj” i bez „wartości godziwej”
   konkretnej spółki (MAR, KNF). DCF i inne modele to kalkulator z założeniami użytkownika.
3. **Nie blokujemy funkcji ukończeniem lekcji.** Odsłaniamy szczegóły stopniowo
   i proponujemy następny krok.
4. **Edukacja, dane i narzędzie w jednej czynności**, a nie biblioteka kursów obok screenera.
5. **Małe kroki.** Zadanie ok. 40 minut, widoczny efekt, projekt znosi kilkutygodniowe przerwy.
6. **Prywatność i bezpieczeństwo przed funkcjami na kontach** (Bramka P przed Bramką 2).

## Cele i miary

Cele po kolei:
1. 10 obcych osób płaci, korzysta i potrafi powiedzieć, co im to dało.
2. Biznes zarabia po kosztach i nie zabiera każdej wolnej godziny.
3. Dochód jest na tyle stabilny, że można bezpiecznie rozważyć odejście z etatu.

Co tydzień: odwiedzający z Polski, nowe konta, aktywni użytkownicy watchlisty/portfela,
odsetek wracających po 7 dniach.

## Hipotezy do sprawdzenia (to nie są fakty)

- **Pierwszy test produktu:** podstawy analizy spółki → wybieram kilka spółek do watchlisty
  → wracam, żeby zrozumieć zmianę w ich wynikach.
- **Cel na 3 miesiące (propozycja GPT):** 20 rozmów z początkującymi, jeden sprawdzony
  proces edukacyjny, pierwszych 10 płacących — równolegle z wiarygodnością danych.
- **Abonament ok. 29 zł/mies.** Ryzyko: po nauce podstaw edukacja się kończy, więc płatna
  wartość musi trwać dalej (watchlista, przegląd portfela, analizy).
- **Portfel obejmuje ETF-y i spółki spoza WIG20.** Inaczej pokaże początkującemu tylko ułamek tego, co ma.
  Import historii z eksportu brokera może być najmocniejszą funkcją.
- **Przewaga StockView:** nikt nie łączy w jednym przystępnym miejscu danych o spółkach,
  objaśnień dla laika i analizy własnego portfela.

## Otwarte decyzje (Kamil)

1. **Kolejność po Bramce P:**
   (A) edukacja + watchlista jako pierwszy test (propozycja GPT), czy
   (B) uczciwe dane wszędzie → portfel z szerokim pokryciem cen → DCF jako kalkulator → edukacja (propozycja Claude'a).
2. **Za co pierwsze płatności.** Płatna edukacja nie wymaga licencji na dane giełdowe;
   płatne narzędzia na obecnych darmowych danych — tak (Yahoo i widgety TradingView zabraniają
   użytku komercyjnego, dane GPW wymagają licencji).
## Zadania poza kodem (Kamil)

- **Compliance u pracodawcy** — zapytać, zanim pojawią się własne wyceny albo zarobek
  (6 gotowych pytań w dokumencie „StockView — prawo, prywatność i bezpieczeństwo”).
- **E-mail do GPW** w sprawie umowy licencyjnej na dane opóźnione — wymagana także przy darmowej dystrybucji.
- **2FA** na GitHubie, w Cloudflare, Supabase, u rejestratora domeny i na skrzynce e-mail (P11).

## Poza zakresem na teraz

- Dane fundamentalne całej GPW — dopiero z licencjonowanymi danymi i po portfelu.
- Reklamy displayowe (psują UX i wymagają banera cookies).
- Afiliacja brokera rozliczana od klienta (CPA) — tylko stała opłata.

## Jak z tego korzystać

- **Nowe zadanie:** wskaż, której zasady, celu lub hipotezy dotyczy. Jeśli kłóci się z „Zasadami”, zgłoś to Kamilowi zamiast realizować.
- **Review:** sprawdź, czy zmiana nie łamie „Zasad”.
- **Tygodniowy przegląd GPT:** paczka przekazania linkuje ten dokument, a GPT ocenia postęp względem „Celów” i „Hipotez”.
- **Zmiana kierunku:** tylko decyzją Kamila, z datą i powodem w `docs/JOURNAL.md`.
