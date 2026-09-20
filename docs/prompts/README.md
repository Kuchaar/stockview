# Archiwum promptów

Prompty, którymi budowaliśmy StockView w Claude Code. Trzymamy je w repo, bo pokazują
**jaki kontekst** trzeba było podać, żeby zadanie wyszło za pierwszym razem — to jest
ściąga przy pisaniu kolejnych promptów, nie dokumentacja kodu.

Archiwum zaczyna się od 2.3. Wcześniejsze prompty (1.x – 2.2) nie zostały zachowane.

| Prompt | Co zrobił | Commit |
|---|---|---|
| [prompt-2.3.md](prompt-2.3.md) | Własny wykres SVG (OHLCV, tryby linia/świece, zakresy 1M–MAX) zamiast widgetu TradingView + uzupełnienie składu WIG20 o 5 spółek (Allegro, Budimex, Erste, Tauron, Żabka) → 24 spółki | [`ce948bf`](https://github.com/Kuchaar/stockview/commit/ce948bf) · 2026-05-01 |
| [prompt-2.4.md](prompt-2.4.md) | Wskaźniki analizy technicznej rysowane na własnym SVG: SMA, EMA, RSI, MACD, wstęgi Bollingera | [`8fb631d`](https://github.com/Kuchaar/stockview/commit/8fb631d) · 2026-05-01 |
| [prompt-2.5.md](prompt-2.5.md) | Profile spółek — pole `profile` (opis, rok założenia, IPO, zatrudnienie, CEO, siedziba, ISIN) i zakładka „O spółce" dla wszystkich 24 firm | [`66de261`](https://github.com/Kuchaar/stockview/commit/66de261) · 2026-05-01 |
| [prompt-2.6.md](prompt-2.6.md) | Porównywarka spółek (`/compare`) + zabezpieczenia brzegowych przypadków w całej aplikacji | [`346bf2d`](https://github.com/Kuchaar/stockview/commit/346bf2d) · 2026-05-01 |
| [prompt-3.1.md](prompt-3.1.md) | Screener (`/screener`) — filtry po wskaźnikach, gotowe presety, sortowalna tabela wyników | [`3166385`](https://github.com/Kuchaar/stockview/commit/3166385) · 2026-05-01 |

## Co się sprawdziło w tych promptach

- **Kontekst przed zadaniem.** Każdy prompt zaczyna się od sekcji „Kontekst": stack, nazwy
  plików, kształt danych, istniejące komponenty. Bez tego model zgaduje strukturę projektu.
- **Konkretne ścieżki i nazwy pól.** `public/data/history/{ticker}.json`, `src/data/wig20.js`,
  nazwy wskaźników w `ratios` — wklejone dosłownie, nie opisane z pamięci.
- **Kryteria akceptacji.** Sprawdzalne zdania („screener zwraca N spółek dla presetu X"),
  nie „ma działać dobrze".
- **Jedna bramka na prompt.** 2.3 dowozi wykres, 2.4 dokłada wskaźniki na gotowym wykresie.
  Prompty, które próbowały zrobić dwie rzeczy naraz, wracały z połową roboty.
