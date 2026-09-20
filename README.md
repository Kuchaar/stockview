# StockView — analiza spółek WIG20

[![CI](https://github.com/Kuchaar/stockview/actions/workflows/ci.yml/badge.svg)](https://github.com/Kuchaar/stockview/actions/workflows/ci.yml)

Darmowa platforma do analizy spółek z indeksu WIG20: dane finansowe, wskaźniki,
wykresy i narzędzia do porównywania firm. Bez rejestracji dla większości funkcji.

**→ [stockview.org](https://stockview.org)**

## Funkcje

- 📊 **Przegląd WIG20** — 24 spółki z filtrami po sektorze i wyszukiwarką
- 📈 **Wykresy notowań** — własny wykres SVG (linia / świece, zakresy 1M–MAX) ze wskaźnikami AT: SMA, EMA, RSI, MACD, wstęgi Bollingera
- 🔎 **Screener** — filtrowanie spółek po wskaźnikach, gotowe presety, sortowalna tabela
- ⚖️ **Porównywarka** — zestawienie kilku spółek obok siebie
- 💰 **Dane finansowe** — przychody, zyski, EBITDA, bilans (roczne i kwartalne)
- 🎯 **Wycena** — P/E, P/B, EV/EBITDA, ROE, ROA, marże, EPS, stopa dywidendy
- 🛡️ **Ocena kondycji** — scoring z wykresem radarowym (rentowność, płynność, dźwignia, efektywność, wycena)
- 🏢 **Profile spółek** — opis działalności, rok założenia, IPO, zatrudnienie, siedziba
- 📅 **Kalendarz dywidend** — nadchodzące i wypłacone
- ⭐ **Watchlista** — własna lista obserwowanych spółek (wymaga konta)
- 🌍 **Dwujęzyczność** — przełącznik PL / EN
- 🌗 **Tryb ciemny / jasny** — z wykrywaniem preferencji systemowych
- 📱 **Responsywność** — telefon, tablet, desktop

## Stack

React 18 · Vite 5 · React Router v6 · Tailwind CSS · Framer Motion · Supabase ·
Cloudflare Pages + Pages Functions

## Dla dewelopera

| Dokument | Po co |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Postawienie projektu od zera na Macu albo na PC z WSL |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Bramki i zadania — co jest zrobione, co następne |
| [docs/JOURNAL.md](docs/JOURNAL.md) | Dziennik: co się działo w każdej sesji, najnowszy wpis na górze |
| [docs/prompts/](docs/prompts/README.md) | Archiwum promptów do Claude Code + co z nich wyszło |
| `AGENTS.md` | Konwencje dla agentów — *powstanie w F4* |

Szybki start dla kogoś, kto ma już Node 22 i sklonowane repo:

```bash
fnm install && npm ci
cp .env.example .env.local   # uzupełnij VITE_SUPABASE_* z panelu Supabase
npm run dev                  # http://localhost:5173
```

Pełne wyjaśnienie każdego kroku wraz z konfiguracją gita, GitHuba i fnm —
w [docs/SETUP.md](docs/SETUP.md).
