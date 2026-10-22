# AGENTS.md — StockView

Shared context for every AI tool working on this repo (Codex, Claude Code in terminal,
desktop or on claude.ai/code). `CLAUDE.md` imports this file and adds Claude-only notes.

## Project

A web app for analysing the 24 companies of **WIG20**, the main index of the Warsaw Stock
Exchange. Audience: Polish retail investors. Free, no sign-up for most features.
Production: **stockview.org** on **Cloudflare Pages** (SPA + Pages Functions).

The canonical address comes from `src/config/site.js` (`SITE_URL`), which
`scripts/generate-sitemap.mjs` imports as well — never hardcode the domain anywhere else.

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
`Layout` and an `AnimatePresence` page transition. Only `HomePage` is imported eagerly —
every other route is a `React.lazy` chunk behind a `Suspense` fallback, so it downloads on
first visit instead of riding along in the main bundle.

Private routes (`/watchlist`, `/admin/*`) are kept out of search results in **two places**:
an `X-Robots-Tag` header in `public/_headers` (works for crawlers that never run JS) and a
`noindex` meta tag injected in `src/App.jsx` (second layer). Change both or neither.

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
18:00 UTC and commits the price files straight to `main`. Financial statements have their own
weekly job, `.github/workflows/update-financials.yml` (Saturday 06:00 UTC): it imports from
Yahoo into Supabase and exports `public/data/financials/`, because statements change
quarterly and there is nothing to gain from running that daily.

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
Tables in use: `watchlist`, `dividends`, `financials`. Credentials live in `.env.local`
(see `.env.example`).

`financials` holds the company statements — natural key `(company_id, period_type,
period_end)`, currently ~189 rows, RLS allows public `select` and writes only from the admin
account. **The app never reads it at runtime.** `scripts/import-financials.mjs` fills it from
Yahoo (needs a `service_role` key), `scripts/export-financials.mjs` writes it out to
`public/data/financials/{companyId}/data.json`, and the app reads those static files as tier 2
of `useFinancials`. Manual corrections go through `/admin/financials`; a row with
`verified = true` is never overwritten by the importer. Migration:
`supabase/migrations/20260920120000_financials.sql`.

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
- **Every manual change goes through a branch and a pull request** — code, data fixes,
  documentation and the agent instructions in this file included. Nothing is pushed straight
  to `main` by a human or an agent. The only writers on `main` are the two data bots,
  `update-prices.yml` and `update-financials.yml` — see „Collaboration" for why that
  exception stands.
- Branch names carry the commit type: `feat/*`, `fix/*`, `chore/*`, `docs/*`, and `wip/*`
  for work handed over mid-task.
- A pull request gets a Cloudflare preview deployment; use it to check the change in a
  browser before asking for a merge.
- Small commits, conventional commits (`feat:` / `fix:` / `chore:` / `docs:`), description
  in Polish.
- A bot commits `public/data/` to `main` every weekday, so **rebase on `origin/main` before
  pushing** a branch — and **re-run the checks after a rebase that moved anything**, because
  a rebase changes the tree and the SHA that the checks were run against; `pull.rebase` and
  `rebase.autoStash` are set globally.
- A rebase of a branch that is already pushed rewrites published commits, so the next push
  needs `--force-with-lease` — never a bare `--force`. Avoid it where you can: a fix round
  that only adds commits pushes fast-forward, with no rebase and no lease.
- Unfinished work → `wip/*` branch, pushed, so the other machine can pick it up.
- End a session with an entry at the top of `docs/JOURNAL.md` ending in `Następne:`.
- **Never commit `.env*`** — `.env.example` is the only exception.
- Stage explicit paths. Never `git add -A`.
- CI (`.github/workflows/ci.yml`) has `paths-ignore` on `docs/**` and `**/*.md`, and it
  skips the run only when **every** changed file matches. A pull request touching docs plus
  anything else — a config file, `.claude/settings.json` — still gets a CI run; one made of
  pure Markdown gets **no run at all**. An absent run is an absent check, not a green one, so
  look at which of the two you have instead of predicting it from the file list.

## Collaboration

Three people, one lane each. Nobody silently takes over somebody else's lane.

| Who | Owns |
|---|---|
| **Kamil** | Business goals, priorities, decisions that need a trade-off, and the approval of every merge |
| **Claude Code** | Runs the day-to-day work off the agreed roadmap: proposes the next task, implements it, tests it, documents it, opens the pull request. **Does not need a prompt from GPT to start a task.** |
| **GPT** | Periodic review of accumulated change, hard problems, architecture, financial methodology, judgement on where the product is going. **Not a mandatory reviewer of every pull request.** |

The repo also runs tooling that is not a participant: the Codex bot comments on a pull
request when it is opened, Cloudflare Pages builds a preview, GitGuardian scans for secrets.
Useful, all three — but none of them is the periodic GPT review and none of them approves
anything.

Ground rules:

- **Every manual change goes through a branch and a pull request**, including changes to the
  agent instructions themselves (`AGENTS.md`, `CLAUDE.md`, `.claude/skills/`).
  **The standing exception is the data bots**: `update-prices.yml` and
  `update-financials.yml` commit `public/data/` straight to `main`. That stays — the files
  are machine-generated, nobody reviews a price series by eye, and those two are the only
  writers there.
- **No agent merges anything without Kamil saying so for that specific pull request.**
  Approval of an earlier pull request does not carry over to the next one.
- **One task has four parts: goal, scope, acceptance criteria, verification method.** A task
  without them is not ready to start — ask for the missing part instead of guessing it.
  *Goal* = why this change exists. *Scope* = the files and behaviour it may touch, and what
  it must leave alone. *Acceptance criteria* = the "done when…" condition, phrased so it can
  be settled without discussion. *Verification method* = the command, page or query that
  shows the criteria are met.
- **While a review is in progress the author does not change the reviewed version.** No new
  commits on the branch, no rebase, no force-push, until the review comes back.
- **A review always names a target: a specific SHA, or a diff spelled out exactly**
  (`gh pr diff <n>`, `git diff A..B`, a list of files). "Review the branch" is not a target —
  the branch moves.
- **A change made after a review needs the matching range re-checked.** Not the whole task
  again, but every criterion the change could have broken, re-run, and the new SHA named.
- **A review may legitimately end with nothing to fix.** A finished review names the SHA it
  checked and the limits of what it verified; it does not have to produce a finding. No part
  of this process requires a bug before it counts as done.
- **Silence is not approval; an empty finding list with a named SHA is.** No answer from a
  reviewer, a review-tool run nobody read, a 👍 reaction from a bot, and Kamil's merge
  decision are four different things. Say which one you actually have.

### Review by risk

What review a change gets follows from what it can break, not from how big it is. The tier
goes in the pull request description, so nobody has to work it out twice.

**Low risk** — documentation, a minor visual tweak, UI text with no financial or legal
meaning.
→ Claude's own review plus the verification that fits the change. No second reviewer, no
waiting.

**Normal functional change** — behaviour in the app that a user can see or rely on.
→ review in a **separate Claude session**, tests matched to the behaviour, and a check by
Kamil. A separate session gives fresh context, which is worth something — but it is **not**
an independent review by a different model, and it shares the same blind spots. Do not
report it as one.

**High risk** — RLS and permissions, login, secrets, data migrations, an import that
overwrites existing data, financial formulas, currencies, periods, data sources.
→ an **additional review before merge and before deployment**. GPT preferred, or another
competent reviewer. If none is available: open the pull request, say in it that it is waiting
on a high-risk review, and **go do an independent task of lower risk**. A missing reviewer is
never a reason to merge a high-risk change.

## GPT review handover

Cadence, roughly: **every 3–5 small pull requests, or once a week**, whichever comes first,
and subject to GPT being available. It is a cadence, not a gate — work does not stop waiting
for it, with the one exception of the high-risk changes above.

**Last SHA actually reviewed by GPT: `nieustalony`.**

Move that line only when a review of the code actually happened. A handover is six short
items:

1. **Last SHA actually checked by GPT** — the line above, or `nieustalony` when there is none.
2. **The current SHA, and the pull requests since that point** — numbers and one-line titles.
3. **What the changes were for, what the checks said, and what is not verified.**
4. **Material changes to finance, data and security** — formulas, currencies, periods,
   sources, RLS, secrets, migrations. If there were none, one line saying so.
5. **At most three questions or decisions** for the review. A fourth is a sign the handover
   waited too long.
6. **Whether anything is blocked on a high-risk review**, with the pull request numbers.

Two things a handover must never claim:

- **Discussing a report is not a code review.** If GPT read a summary and replied, the
  reviewed-SHA line does not move.
- **A review after a merge is an audit, not pre-deployment approval.** Call it an audit of
  what already shipped; if it finds something, that is a new task, not a retroactive
  approval of the merge.

## Code review rules

Priorities follow the consequence of the mistake, not the size of the diff.
P1–P3 say **what** to look for. **Who** reviews a given change is decided in
„Review by risk" above, and the high-risk areas listed there cover the same ground as
P1 — that is deliberate.

**P1 — blocks the merge.** It reaches a user, leaks data, or states something false.

1. **User data isolation and secrets.** Every table with an owner column has RLS, and a
   query cannot return another user's rows. A `service_role` key never reaches client code
   or a `VITE_*` variable. No secret in the repo, in a log line or in an error message;
   `.env*` is never committed (`.env.example` excepted).
2. **Correctness of the numbers.** Currency (Pepco reports in EUR — U10 in
   [docs/DATA.md](docs/DATA.md)), units (mln vs mld, PLN vs EUR), period
   (`FY` vs quarter, `period_end`) and source tier have to be right, and a ratio may never
   mix two of them — no dividing a EUR revenue by a PLN market cap, no FY numerator over a
   quarterly denominator.
3. **Missing data must not look like a zero or like a positive verdict.** `null` stays
   `null` all the way to the screen, an empty row is hidden rather than filled with `0`, and
   a score, health card or rating never awards points for an input that is absent (this is
   the D4a class of bug).
4. **A forecast stays distinguishable from a reported figure.** `2024E` is labelled as an
   estimate wherever it is shown and never slips into a historical series, a chart or an
   average as if it had been reported.
5. **An operation that failed must not report success.** A rejected `upsert`, a caught
   `fetch`, a partial import or an export that wrote nothing each surface an error state the
   caller can see. `source: 'unavailable'` from `/api/financials` is a legitimate answer, but
   only because the client then falls through to the next tier — a swallowed error that
   leaves the UI showing stale numbers as current is a P1.

**P2 — must be fixed, does not block on its own.** It ships and costs later. Judge each one;
breaking a convention is not automatically a P1.

- A UI string that bypasses `t()`, or a `t()` key missing its `pl` or `en` entry.
- Dark mode not checked on a new or changed component.
- The domain hardcoded instead of coming from `SITE_URL` in `src/config/site.js`.
- A new dependency added without asking, or bundle growth nobody flagged.
- A shell script that needs bash 4 (`mapfile`, associative arrays, `${var,,}`) — macOS
  ships bash 3.2.
- `noindex` changed in only one of its two places (`public/_headers` and `src/App.jsx`).
- A migration without a matching note in [docs/DATA.md](docs/DATA.md).

**P3 — remarks.** Naming, dead code, structure, duplication, a clearer way to write it. The
author may decline a P3 with a reason and that closes it.

Out of scope for a review:

- **A documented methodology or a DCF with adjustable sliders is not a compliance finding
  either way.** It explains how a number was produced; it says nothing about whether the app
  may publish it. Legal and regulatory questions (investment-advice status, KNF, required
  disclaimers) are Kamil's call — raise them as a question to him, never as a P1 "resolved"
  by pointing at the methodology, and never as an approval of legal standing.
- Rewriting the branch. A reviewer reports; the author fixes.

## Finishing a task

Keep the closing report short — one to three lines per point. The lasting parts belong in
`docs/JOURNAL.md`, `docs/DATA.md` and `docs/ROADMAP.md`, not in a retelling of the rules from
this file.

1. **What changed and why.**
2. **What was checked, and what was not.** Name the limits: no browser check, no production
   run, no CI run at all. And keep the evidence honest — **a green build is evidence about
   the build, never proof that an instruction or a rule is correct.**
3. **One programming lesson worth keeping** — the non-obvious thing, two or three sentences,
   because Kamil is learning web development.
4. **A financial explanation, only when the task touches money** — what the number means, for
   which period and in which currency, and what it does not mean.
5. **The pull request link and the next step.**

## Communication

Talk to Kamil in Polish. He is learning web development: briefly explain non-obvious
decisions.

## Docs map

| File | What's in it |
|---|---|
| [docs/JOURNAL.md](docs/JOURNAL.md) | Session log, newest entry first, each ends with `Następne:` |
| [docs/DATA.md](docs/DATA.md) | Data-source audit: field → source → refresh rate → who updates it |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Gates and ~40-minute tasks with "done when…" conditions |
| [docs/SETUP.md](docs/SETUP.md) | Setting the project up from scratch on macOS or WSL |
| [docs/prompts/](docs/prompts/README.md) | Archive of the prompts that built the app, mapped to commits |
