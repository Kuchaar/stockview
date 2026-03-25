# StockView — WIG20 Analysis Platform

Profesjonalna platforma do analizy spółek z indeksu WIG20.

## Funkcje

- 📊 **Przegląd indeksu WIG20** — wykresy TradingView, pasek tickerów, statystyki
- 📈 **Wykresy notowań** — profesjonalne wykresy TradingView z oscylatorami (RSI, MACD, Bollinger Bands...)
- 💰 **Dane finansowe** — przychody, zyski, EBITDA, bilans (roczne i kwartalne)
- 🎯 **Wycena** — P/E, P/B, EV/EBITDA, ROE, ROA, marże, EPS, stopa dywidendy
- 🛡️ **Ocena kondycji** — scoring z wykresem radarowym (rentowność, płynność, dźwignia, efektywność, wycena)
- 🌍 **Dwujęzyczność** — przełącznik PL / EN
- 🌗 **Tryb ciemny / jasny** — z automatycznym wykrywaniem preferencji systemowych
- 📱 **Responsywna** — działa na telefonach, tabletach i desktopach

## Quick Start (uruchomienie lokalne)

```bash
# 1. Wejdź do folderu projektu
cd stockview

# 2. Zainstaluj zależności
npm install

# 3. Uruchom serwer deweloperski
npm run dev

# 4. Otwórz w przeglądarce
# http://localhost:5173
```

## Deployment na Cloudflare Pages

### Opcja A: Przez GitHub (rekomendowane)

1. **Utwórz repo na GitHub:**
   ```bash
   cd stockview
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TWOJ-USER/stockview.git
   git push -u origin main
   ```

2. **W panelu Cloudflare:**
   - Wejdź na [dash.cloudflare.com](https://dash.cloudflare.com)
   - Workers & Pages → Create → Pages → Connect to Git
   - Wybierz swoje repo `stockview`
   - Build settings:
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
   - Kliknij "Save and Deploy"

3. **Podłącz domenę:**
   - W ustawieniach projektu Pages → Custom domains
   - Dodaj `stockview.org`
   - Cloudflare automatycznie skonfiguruje DNS i SSL

### Opcja B: Bezpośredni upload

```bash
# Zbuduj projekt
npm run build

# Zainstaluj Wrangler CLI
npm install -g wrangler

# Zaloguj się
wrangler login

# Wdróż
wrangler pages deploy dist --project-name=stockview
```

## Struktura projektu

```
stockview/
├── index.html              # Punkt wejścia HTML
├── package.json            # Zależności i skrypty
├── vite.config.js          # Konfiguracja buildera
├── tailwind.config.js      # Konfiguracja Tailwind CSS
├── public/
│   └── favicon.svg         # Ikona strony
└── src/
    ├── main.jsx            # Punkt wejścia React
    ├── App.jsx             # Routing
    ├── index.css           # Style globalne
    ├── components/
    │   ├── Layout.jsx          # Header, footer, nawigacja
    │   ├── TradingViewChart.jsx # Widget wykresu TradingView
    │   ├── TickerTape.jsx      # Pasek tickerów
    │   ├── StockCard.jsx       # Karta spółki na liście
    │   ├── FinancialTable.jsx  # Tabela danych finansowych
    │   ├── ValuationMetrics.jsx # Siatka wskaźników wyceny
    │   └── HealthScore.jsx     # Scoring kondycji + radar
    ├── context/
    │   ├── ThemeContext.jsx # Dark/light mode
    │   └── LangContext.jsx # PL/EN translations
    ├── data/
    │   ├── wig20.js        # Dane 20 spółek + helpers
    │   └── translations.js # Tłumaczenia PL/EN
    └── pages/
        ├── HomePage.jsx    # Strona główna
        └── StockPage.jsx   # Szczegóły spółki
```

## Technologie

| Technologia | Do czego |
|-------------|----------|
| **React 18** | Budowa interfejsu (komponenty) |
| **Vite 5** | Bundler/builder — szybki hot-reload |
| **React Router 6** | Nawigacja między stronami |
| **Tailwind CSS 3** | Stylowanie (utility-first CSS) |
| **Framer Motion** | Animacje i przejścia |
| **Lucide React** | Ikony |
| **TradingView Widgets** | Wykresy giełdowe |
| **Cloudflare Pages** | Hosting |

## Planowane rozszerzenia

- [ ] Live API dla danych finansowych (Financial Modeling Prep / Stooq)
- [ ] WIG40, WIG80, mWIG40
- [ ] Porównywarka spółek
- [ ] Screener z filtrami
- [ ] Watchlist z powiadomieniami
- [ ] Kalkulatory DCF / DDM
- [ ] Eksport raportów do PDF
- [ ] PWA (Progressive Web App)

## Licencja

Projekt prywatny. Dane finansowe mają charakter przybliżony i informacyjny.
