# Postawienie StockView od zera

Instrukcja jest kompletna — od czystego systemu do działającego `npm run dev`.
Wybierz sekcję A (Mac) albo B (PC z WSL), potem wykonaj C. Sekcja D to lista rzeczy,
które już raz kosztowały nas stracony wieczór.

---

## A) Mac (zsh)

**1. Homebrew** — jeśli jeszcze go nie ma:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Instalator wypisze na końcu dwie linijki `eval "$(/opt/homebrew/bin/brew shellenv)"` —
wykonaj je, inaczej `brew` nie będzie widoczny w nowej karcie terminala.

**2. Narzędzia:**

```bash
brew install git gh fnm
```

**Nie instaluj `node` przez Homebrew.** Wersję Node daje fnm na podstawie `.nvmrc`.
Równoległy Node z Homebrew wygrywa wszędzie tam, gdzie nie wykonuje się `~/.zshrc` —
w skryptach `sh`, cronie i narzędziach odpalanych z GUI — i cicho buduje projekt na
innej wersji niż ta, którą widzisz w terminalu.

**3. Automatyczne przełączanie wersji Node.** Dopisz do `~/.zshrc`:

```bash
eval "$(fnm env --use-on-cd --shell zsh)"
```

Potem otwórz nową kartę terminala (albo `source ~/.zshrc`). Od tej pory wejście do
katalogu z `.nvmrc` przełącza Node automatycznie.

**4. Claude Code:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

---

## B) PC — Windows z WSL (Ubuntu, bash)

Pracujemy **wewnątrz WSL**, nie w PowerShellu. Jeśli WSL jeszcze nie ma:
`wsl --install -d Ubuntu` w PowerShellu jako administrator, potem restart.

**1. Narzędzia systemowe:**

```bash
sudo apt update
sudo apt install -y git gh curl unzip
```

**2. fnm:**

```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

Dopisz do `~/.bashrc` (instalator zwykle robi to sam — sprawdź, czy jest tam `--use-on-cd`):

```bash
eval "$(fnm env --use-on-cd --shell bash)"
```

Potem `source ~/.bashrc`.

**3. Claude Code** — ten sam instalator co na Macu:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

---

## C) Wspólne — oba systemy

**1. Konfiguracja gita** (raz na komputer):

```bash
git config --global user.name  "Kamil Kucharczyk"
git config --global user.email "kuchaar72@gmail.com"
git config --global pull.rebase true
git config --global rebase.autoStash true
git config --global fetch.prune true
git config --global init.defaultBranch main
git config --global core.autocrlf input
```

`pull.rebase` + `rebase.autoStash` to jest to, co pozwala przesiadać się między
komputerami bez merge commitów i bez gubienia niezacommitowanej pracy.
`core.autocrlf input` plus `.gitattributes` w repo trzymają wszystko na LF.

**2. GitHub:**

```bash
gh auth login          # HTTPS, uwierzytelnienie przez przeglądarkę
gh auth setup-git      # gh staje się helperem poświadczeń dla gita
```

**3. Klon** — zawsze do `~/code/stockview`:

```bash
mkdir -p ~/code && cd ~/code
git clone https://github.com/Kuchaar/stockview.git
cd stockview
```

**4. Node w wersji z repo:**

```bash
fnm install            # czyta .nvmrc → instaluje Node 22
node -v                # musi dać v22.x
```

**5. Zależności** — `npm ci`, nie `npm install`:

```bash
npm ci
```

`npm ci` instaluje dokładnie to, co jest w `package-lock.json`. `npm install` może
podbić wersje i wygenerować commit z lockfilem, którego nikt nie zamawiał.

**6. Zmienne środowiskowe:**

```bash
cp .env.example .env.local
```

Uzupełnij `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` wartościami z panelu Supabase:
**Project Settings → API**, pola *Project URL* i *anon public*. `.env.local` jest
w `.gitignore` i nigdy nie trafia do repo. Bez tych wartości aplikacja się zbuduje
i uruchomi — po prostu logowanie, watchlista i dywidendy nie zadziałają.

**7. Sprawdzenie:**

```bash
npm run build          # kończy się „✓ Generated dist/sitemap.xml (N URLs)"
npm run dev            # http://localhost:5173
```

Opcjonalnie `npm run dev:full` — Vite za `wrangler pages dev`, czyli z działającymi
funkcjami z `functions/api/`.

---

## D) Import sprawozdań — raz na kwartał, z laptopa

Sprawozdania finansowe trafiają do bazy **ręcznie, z Twojego komputera**. Nie robi tego
żaden workflow na GitHubie i nie jest to przeoczenie: runner GitHuba dostaje HTTP 403 na
`https://stockview.org/api/financials`, bo Cloudflare nie ufa adresom centrów danych.
Z laptopa ten sam adres odpowiada normalnie.

Podział pracy jest taki:

| Kto | Co robi | Kiedy |
|---|---|---|
| Ty, lokalnie | **import** — Yahoo → tabela `financials` w Supabase | raz na kwartał, po raportach |
| `update-financials.yml` | **eksport** — baza → `public/data/financials/` | automatycznie, w każdą sobotę |

**1. Kiedy odpalać.** Po tym, jak spółki opublikują raporty. Terminy są ustawowe — liczone
od końca okresu:

| Okres | Termin publikacji | Kiedy importować |
|---|---|---|
| I kwartał (do 31 III) | 60 dni → do 30 V | początek czerwca |
| Półrocze (do 30 VI) | 3 miesiące → do 30 IX | początek października |
| III kwartał (do 30 IX) | 60 dni → do 29 XI | **początek grudnia** |
| Rok (do 31 XII) | 4 miesiące → do 30 IV | początek maja |

Pojedyncze spółki raportują wcześniej, więc import w połowie okresu dociągnie część danych,
a reszta dojdzie przy następnym. Nic się nie psuje od zbyt częstego importu — poza tym, że
niepotrzebnie obciąża Yahoo.

**2. Klucz `service_role`** — potrzebny tylko do importu, bo zapis do tabeli `financials`
jest w RLS zarezerwowany dla konta administracyjnego. Bierzesz go z panelu Supabase:
**Project Settings → API → `service_role` `secret`**. Do `.env.local` dopisujesz:

```
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<klucz service_role>
```

**Bez przedrostka `VITE_`.** To nie jest kosmetyka: Vite wkleja **każdą** zmienną
`VITE_*` do zbudowanego bundla, czyli do pliku, który dostaje każdy odwiedzający stronę.
`VITE_SUPABASE_SERVICE_ROLE_KEY` oznaczałoby opublikowanie klucza omijającego całe RLS.
Zmienna bez przedrostka widzi tylko Node, nigdy przeglądarka.

`.env.local` jest w `.gitignore` i nigdy nie trafia do repo. Klucza nie wklejaj do czatu,
do issue ani do opisu PR-a — jeśli raz wycieknie, trzeba go zrotować w panelu Supabase.

**3. Odpalenie** — najpierw na próbę, bez zapisu:

```bash
npm run import-financials -- --dry-run     # nic nie zapisuje, tylko pokazuje
npm run import-financials                  # zapisuje do bazy
```

Wiersze poprawione ręcznie przez `/admin/financials` mają `verified = true` i import ich
**nie nadpisuje**.

**4. Sprawdzenie wyniku.** Na końcu import wypisuje `Spółek: 24, wierszy zapisanych: N`.
Jeśli `N` wyszłoby zerowe, komenda **kończy się błędem** (`exit 1`) — przebieg, który nic
nie wniósł, nie udaje sukcesu. Lista nieudanych spółek jest w linii `Błędy (…)`.

Import zmienia **bazę**, a strona czyta **pliki**. Żeby zmiana była widoczna, musi jeszcze
pójść eksport — w sobotę zrobi się sam, a od razu tak:

```bash
gh workflow run update-financials.yml --ref main
gh run watch
```

Workflow dopisuje odświeżone `public/data/financials/` bezpośrednio na `main` — to jeden
z dwóch botów, którym wolno to robić (patrz `AGENTS.md` → „Collaboration").

---

## E) Czego nie robić

**Nie trzymaj repo na Biurku ani w Dokumentach na Macu.** Oba katalogi są
synchronizowane z iCloud, który przy konflikcie tworzy obok pliku kopię `plik 2.jsx`.
Vite ją podchwytuje, import wskazuje na starą wersję i tropienie tego zajmuje godziny.
`~/code/` nie jest synchronizowane. W `.gitignore` stoi wzorzec `* 2.*` jako druga
linia obrony, ale problem lepiej mieć rozwiązany u źródła.

**Nie trzymaj repo na `/mnt/c` w WSL.** Dostęp do dysku Windows przez WSL jest wolny
(`npm ci` potrafi trwać kilkukrotnie dłużej), a co gorsza nie działa tam poprawnie
`inotify` — dev server nie widzi części zmian w plikach i przeładowuje stronę losowo.
Repo ma leżeć w systemie plików Linuksa, czyli `~/code/stockview`.

**Nie przenoś plików między komputerami z pominięciem gita.** Żadnego wysyłania
katalogów przez Dysk Google, pendrive'a ani ZIP-a na Slacku. Jedyna droga to
`git push` na jednym komputerze i `git pull --rebase` na drugim. Kopiowanie na około
przywlekło już raz do repo `.claude/worktrees/` i pliki z końcami linii CRLF.

**Nie commituj `.claude/settings.local.json`.** To plik osobisty, ze ścieżkami
konkretnego komputera. Wspólne ustawienia idą do `.claude/settings.json`.
