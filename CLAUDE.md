# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

No test, lint, or type-check scripts are configured.

## Architecture

StockView is a static SPA for analyzing WIG20 (Polish stock index) companies. There is no backend — all financial data is hardcoded in `src/data/wig20.js`.

**Stack**: React 18 + Vite + React Router v6 + Tailwind CSS (class-based dark mode) + Framer Motion + TradingView widgets (external CDN embeds, not npm)

**Two routes**:
- `/` → `HomePage`: lists all 20 stocks with search/sector filter
- `/stock/:id` → `StockPage`: 4-tab detail view (Chart, Financials, Valuation, Health)

**Global state** via React Context only (no Redux/Zustand):
- `ThemeContext` — dark/light toggle, persists to `localStorage.sv-theme`, applies `.dark` to `document.documentElement`
- `LangContext` — PL/EN toggle, persists to `localStorage.sv-lang`; `t('dot.path')` does nested lookup into `src/data/translations.js`

**Data layer** (`src/data/wig20.js`):
- Array of 20 company objects with price data, `financials` (annual + quarterly arrays), and `ratios`
- Helper functions: `formatPrice`, `formatPercent`, `formatNumber`, `formatRatio`
- `calculateHealthScore(stock)` and `calculateSubScores(stock)` derive scores from ratios

**TradingView components** (`TradingViewChart.jsx`, `TickerTape.jsx`): inject `<script>` tags dynamically; re-mount on theme change; memoized to avoid unnecessary re-renders.

**Styling**: Tailwind utilities + custom `@layer components` in `src/index.css` (`.glass`, `.card`, `.card-hover`, `.badge`, `.btn-primary`, `.text-gradient`, `.tab-button`, etc.). Fonts loaded from Google Fonts in `index.html`.

**Deployment**: Cloudflare Pages. `public/_redirects` handles SPA fallback routing. Build command: `npm run build`, output: `dist/`.
