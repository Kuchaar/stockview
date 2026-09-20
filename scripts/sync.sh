#!/usr/bin/env bash
# Start sesji StockView: synchronizacja z GitHubem i przypomnienie, gdzie skończyłem.
# Celowo trzyma się składni bash 3.2 — macOS ma taką wersję systemowo, WSL/Ubuntu ma bash 5.
set -euo pipefail

if ! ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "To nie jest repozytorium git." >&2
  exit 1
fi
cd "$ROOT"

if [ -t 1 ]; then
  B=$(printf '\033[1m'); Y=$(printf '\033[33m'); G=$(printf '\033[32m')
  R=$(printf '\033[31m'); N=$(printf '\033[0m')
else
  B=''; Y=''; G=''; R=''; N=''
fi

# ── 1. Stan lokalny ───────────────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "${B}Gałąź:${N} ${BRANCH}   ${B}Komputer:${N} $(hostname)"

if [ -n "$(git status --porcelain)" ]; then
  echo "${Y}Niezacommitowane zmiany:${N}"
  git status --short | sed 's/^/  /'
else
  echo "Katalog roboczy czysty."
fi

# ── 2. Synchronizacja ─────────────────────────────────────────────────────────
echo
echo "${B}Pobieram z origin…${N}"
git fetch --prune --quiet

BEFORE=$(git rev-parse HEAD)

if UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null); then
  BEHIND=$(git rev-list --count "HEAD..${UPSTREAM}")
  if [ "$BEHIND" -gt 0 ]; then
    echo "Za ${UPSTREAM} o ${BEHIND} commit(ów) — rebase…"
    if ! git pull --rebase --autostash; then
      echo >&2
      echo "${R}Rebase stanął na konflikcie. Nie przerywam go za Ciebie.${N}" >&2
      echo "  1. zobacz pliki w konflikcie:  git status" >&2
      echo "  2. rozwiąż je, potem:          git add <pliki> && git rebase --continue" >&2
      echo "  3. albo cofnij całość:         git rebase --abort" >&2
      echo "Jeśli miałeś niezacommitowane zmiany, leżą w stashu: git stash list" >&2
      exit 1
    fi
  else
    echo "${G}Aktualne względem ${UPSTREAM}.${N}"
  fi
  AHEAD=$(git rev-list --count "${UPSTREAM}..HEAD")
  if [ "$AHEAD" -gt 0 ]; then
    echo "${Y}Lokalnie ${AHEAD} commit(ów) niewypchniętych.${N}"
  fi
else
  echo "${Y}Gałąź ${BRANCH} nie ma upstreamu — pomijam pull.${N}"
fi

# ── 3. Zależności ─────────────────────────────────────────────────────────────
NEED_CI=0
REASON=""
if [ ! -d node_modules ]; then
  NEED_CI=1; REASON="brak node_modules"
elif git diff --name-only "$BEFORE" HEAD | grep -qx 'package-lock.json'; then
  NEED_CI=1; REASON="zmienił się package-lock.json"
fi

if [ "$NEED_CI" -eq 1 ]; then
  echo
  echo "${B}npm ci${N} (${REASON})…"
  npm ci
fi

# ── 4. Wersja Node ────────────────────────────────────────────────────────────
if [ -f .nvmrc ] && command -v node >/dev/null 2>&1; then
  WANT=$(head -n1 .nvmrc | tr -dc '0-9.' | cut -d. -f1)
  HAVE=$(node -v | tr -dc '0-9.' | cut -d. -f1)
  if [ -n "$WANT" ] && [ "$WANT" != "$HAVE" ]; then
    echo
    echo "${Y}Node v${HAVE}, a .nvmrc chce ${WANT}.${N}  Uruchom: fnm use   (jeśli brak: fnm install)"
  fi
fi

# ── 5. Gdzie skończyłem ───────────────────────────────────────────────────────
if [ -f docs/JOURNAL.md ]; then
  NEXT=$(awk '/^\*\*Następne:\*\*/ {f=1} f { if ($0 == "") exit; print }' docs/JOURNAL.md)
  if [ -n "$NEXT" ]; then
    echo
    echo "${B}Z dziennika:${N}"
    echo "$NEXT" | sed 's/\*\*//g; s/^/  /'
  fi
fi

if [ -f docs/ROADMAP.md ]; then
  TASKS=$(grep '^- \[ \]' docs/ROADMAP.md | head -3 | sed 's/^- \[ \] //; s/\*\*//g; s/`//g')
  if [ -n "$TASKS" ]; then
    echo
    echo "${B}Otwarte zadania z roadmapy:${N}"
    echo "$TASKS" | sed 's/^/  • /'
  fi
fi

# ── 6. Niedokończona praca z drugiego komputera ───────────────────────────────
WIP=$(git for-each-ref --sort=-committerdate \
  --format='  %(refname:short) — %(committerdate:short), %(authorname)' \
  refs/remotes/origin/wip)
if [ -n "$WIP" ]; then
  echo
  echo "${Y}Czekają gałęzie wip:${N}"
  echo "$WIP"
  echo "  przejście:  git switch <nazwa-bez-origin/>"
fi

echo
echo "${G}Gotowe.${N}"
