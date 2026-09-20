# AGENTS.md — StockView

Shared context for every AI tool working on this repo (Codex, Claude Code in terminal,
desktop or on claude.ai/code). `CLAUDE.md` imports this file and adds Claude-only notes.

## Project

A web app for analysing the 24 companies of **WIG20**, the main index of the Warsaw Stock
Exchange. Audience: Polish retail investors. Free, no sign-up for most features.
Production: **stockview.org** on **Cloudflare Pages** (SPA + Pages Functions).

Caveat: `canonical`/OG tags, the `public/_headers` CSP, `scripts/generate-sitemap.mjs` and
the CORS allowlist in `functions/api/` still say `stockview.pages.dev` — unifying the domain
is task S1 in `docs/ROADMAP.md`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:5173 |
| `npm run dev:full` | Vite behind `wrangler pages dev` — the only way `/api/*` works locally |
| `npm run build` | Production build to `dist/`; `postbuild` then runs `scripts/generate-sitemap.mjs` and prints `✓ Generated dist/sitemap.xml` |
| `npm run preview` | Serve the production build locally |
| `npm run update-prices` | `scripts/fetch-stooq.mjs` → rewrites `public/data/history/{ticker}.json` and `public/data/latest-prices.json` |
| `npm run sync` | Start-of-session script: fetch, rebase, conditional `npm ci`, Node check, journal + roadmap reminder |

There are no test, lint or type-check scripts.

## Architecture

**Stack:** React 18 · Vite 5 · React Router v6 · Tailwind CSS (class-based dark mode) ·
Framer Motion · react-helmet-async · Supabase JS · Cloudflare Pages Functions.

### Routes

All routes are declared in `src/App.jsx`, each wrapped in `ErrorBoundary`, inside
`Layout` and an `AnimatePresence` page transition.

| Path | Page | What it does |
|---|---|---|
| `/` | `HomePage` | Company list with search and sector filter, WIG20 TradingView chart, ticker tape |
| `/stock/:id` | `StockPage` | 6 tabs: overview, about, chart, financials (4 sub-tabs), valuation, health |
| `/compare` | `ComparePage` | Side-by-side comparison of several companies |
| `/screener` | `ScreenerPage` | Ratio filters, presets, sortable results table |
| `/dividends` | `DividendsPage` | Dividend calendar: upcoming and paid |
| `/watchlist` | `WatchlistPage` | User's watched companies (requires login) |
| `/admin/dividends` | `AdminDividendsPage` | Dividend CRUD, gated on a hardcoded admin user id |

`public/_redirects` (`/* /index.html 200`) gives SPA fallback routing.

### Data flow

**Prices** — `useLatestPrices` → `useStockData` (used by every list page):

1. `/api/quote?symbols=…` (`functions/api/quote.js`), 5 s timeout, auto-refresh every 60 s
2. on failure → static `public/data/latest-prices.json`
3. `sessionStorage` cache, TTL 60 s; the active tier is exposed as `source`
   (`'live'` / `'static'`) and rendered by `DataSourceBanner`

`useStockData` overlays live prices on the static `wig20Companies` array, so the UI always
has a complete company object even when every network tier fails.

**Financials** — `useFinancials`, three tiers, `sessionStorage` cache TTL 1 h:

1. `/api/financials?symbol=…` (`functions/api/financials.js`)
2. `public/data/financials/{companyId}/data.json`
3. hardcoded `financials` inside `src/data/wig20.js` (never cached, so the upper tiers get
   retried on the next mount)

All three shapes go through `normalizeFinancials()` in `src/data/financialSchema.js`.

**OHLCV history** — `useHistoricalPrices` / `useHistoricalData` read
`public/data/history/{ticker}.json` (~1250 sessions, 5 years), cache TTL 30–60 min.
`.github/workflows/update-prices.yml` runs `scripts/fetch-stooq.mjs` every weekday at
18:00 UTC and commits `public/data/` straight to `main`.

### Pages Functions

- `functions/api/quote.js` — Yahoo `v8/finance/chart` per symbol in parallel, Stooq CSV as
  per-symbol fallback, Cloudflare edge cache 90 s.
- `functions/api/financials.js` — Yahoo `v10/quoteSummary` needs crumb + cookie, so it runs
  a 3-step flow (`fc.yahoo.com` → cookie → crumb), caches the crumb on the edge for 30 min
  and retries once on 401. When Yahoo is down it returns **200 with `source: 'unavailable'`**
  instead of a 5xx, which is what lets the client fall through to tier 2.

### Contexts

Nested in `src/App.jsx` in this order: `ThemeProvider` → `LangProvider` → `AuthProvider`
→ `AuthModalProvider`.

- `ThemeContext` — toggles `.dark` on `<html>` and `.dark-body` on `<body>`, persists to
  `localStorage.sv-theme`, falls back to `prefers-color-scheme`.
- `LangContext` — `t('dot.path')` does a nested lookup in `src/data/translations.js`
  (`pl` / `en`), persists to `localStorage.sv-lang`, defaults to `pl`, returns the key
  itself when a translation is missing.
- `AuthContext` — Supabase session plus `onAuthStateChange`.
- `AuthModalContext` — open/close state of the login modal.

### Auth and database

Supabase, client in `src/lib/supabase.js`. It exports `null` when `VITE_SUPABASE_URL` or
`VITE_SUPABASE_ANON_KEY` is missing, and every consumer guards on that — the app builds
and runs without credentials, only auth, watchlist and dividends stop working.
Tables in use: `watchlist`, `dividends`. Credentials live in `.env.local`
(see `.env.example`).

### Charts and styling

- `StockChart.jsx` — the main price chart: hand-written SVG, line/candle modes, 1M–MAX
  ranges, indicators from `src/utils/technicalIndicators.js` (SMA, EMA, RSI, MACD, Bollinger).
- `TradingViewChart.jsx` / `TickerTape.jsx` — external TradingView embeds (injected
  `<script>`, remounted on theme change), used for the WIG20 index and the full chart tab.
- `src/index.css` holds the `@layer components` classes — `.card`, `.card-hover`, `.glass`,
  `.badge`, `.btn-primary`, `.section-title`, `.metric-label`, `.tab-button`,
  `.text-gradient`. Reuse them instead of inventing new ones.

## Conventions

- Match the surrounding code: 2-space indent, semicolons, single quotes, function
  components, no class components except `ErrorBoundary`.
- Hooks live in `src/hooks/`, one default-exported hook per file.
- **Every UI string goes through `t()` and gets both a `pl` and an `en` entry** in
  `src/data/translations.js`. No hardcoded user-facing text.
- **Every new component must work in dark mode** — check both themes before calling it done.
- **No new dependencies without asking.** The bundle is already over Vite's 500 kB warning.

## Environment

- Node comes from `.nvmrc` (**22**), enforced by `engines`; fnm with `--use-on-cd` switches
  automatically.
- Install with `npm ci`. Use `npm install` only when dependencies really change, and say so.
- LF everywhere (`.gitattributes`, `.editorconfig`).
- Work alternates between macOS (zsh) and Windows WSL/Ubuntu (bash), so **shell scripts must
  run on both** — macOS ships bash 3.2: no `mapfile`, associative arrays or `${var,,}`.

## Workflow

- **GitHub is the only channel between the two machines.** Never move files any other way.
- Start a session with `npm run sync`.
- Small commits, conventional commits (`feat:` / `fix:` / `chore:` / `docs:`), description
  in Polish.
- A bot commits `public/data/` to `main` every weekday, so **always `git pull --rebase`
  before pushing**; `pull.rebase` and `rebase.autoStash` are set globally.
- Larger change → `feat/*` branch → Cloudflare preview deployment → merge.
- Unfinished work → `wip/*` branch, pushed, so the other machine can pick it up.
- End a session with an entry at the top of `docs/JOURNAL.md` ending in `Następne:`.
- **Never commit `.env*`** — `.env.example` is the only exception.
- Stage explicit paths. Never `git add -A`.

## Communication

Talk to Kamil in Polish. He is learning web development: briefly explain non-obvious
decisions.

## Docs map

| File | What's in it |
|---|---|
| [docs/JOURNAL.md](docs/JOURNAL.md) | Session log, newest entry first, each ends with `Następne:` |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Gates and ~40-minute tasks with "done when…" conditions |
| [docs/SETUP.md](docs/SETUP.md) | Setting the project up from scratch on macOS or WSL |
| [docs/prompts/](docs/prompts/README.md) | Archive of the prompts that built the app, mapped to commits |
