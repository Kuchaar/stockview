# Prompt 2.5 — Strona "O spółce" + dane podstawowe firm

## Kontekst

StockView — React 18 + Vite + Tailwind CSS (class-based dark mode `.dark`).

Spółki w `src/data/wig20.js` — tablica 24 obiektów. Każdy obiekt ma pola: id, ticker, tvSymbol, yahooSymbol, name, shortName, sector, logo, price, change, changePercent, volume, marketCap, sharesOutstanding, financials, ratios. **Brak pól opisowych** — trzeba je dodać.

StockPage (`src/pages/StockPage.jsx`) ma 5 tabów: overview, chart, financials, valuation, health. Tab `overview` pokazuje health grid + key ratios + income highlights + CTA.

Tłumaczenia: `t('klucz.podklucz')`, lang = `'pl'` | `'en'`.

## Zadania

### A. Dodaj dane opisowe do każdej spółki w `src/data/wig20.js`

Do KAŻDEGO z 24 obiektów w tablicy `wig20Companies` dodaj pole `profile`:

```js
profile: {
  description: { pl: '...', en: '...' },     // 2-3 zdania opisujące czym zajmuje się firma
  founded: 1919,                               // rok założenia (lub null)
  ipoYear: 2004,                               // rok debiutu na GPW (lub null)
  employees: 29000,                            // przybliżona liczba pracowników (lub null)
  ceo: 'Jan Kowalski',                         // imię i nazwisko prezesa (lub null)
  headquarters: { pl: 'Warszawa', en: 'Warsaw' }, // siedziba
  website: 'https://www.firma.pl',             // oficjalna strona WWW
  isin: 'PLPKO0000016',                       // kod ISIN
}
```

Dane dla każdej spółki (wpisz realistyczne, aktualne wartości):

1. **PKO BP** (pkobp) — Największy bank w Polsce, kontrolowany przez Skarb Państwa. Bankowość detaliczna, korporacyjna, hipoteczna. Założony 1919, IPO 2004, siedziba Warszawa, ~29000 pracowników, ISIN: PLPKO0000016
2. **ORLEN** (orlen) — Multienergetyczny koncern, rafinerie, petrochemia, energetyka, stacje paliw. Po fuzji z Lotosem i PGNiG. Założony 1999 (jako PKN), IPO 1999, Płock, ~75000 prac., ISIN: PLPKN0000018
3. **KGHM** (kghm) — Globalny producent miedzi i srebra, kopalnie w Polsce, Chile, USA i Kanadzie. Założony 1961, IPO 1997, Lubin, ~34000 prac., ISIN: PLKGHM000017
4. **PZU** (pzu) — Największa grupa ubezpieczeniowa w Europie Środkowo-Wschodniej. Ubezpieczenia, zarządzanie aktywami, opieka zdrowotna. Założony 1803, IPO 2010, Warszawa, ~11000 prac., ISIN: PLPZU0000011
5. **Pekao** (pekao) — Drugi największy bank w Polsce. Bankowość detaliczna, prywatna i korporacyjna. Założony 1929, IPO 1998, Warszawa, ~12000 prac., ISIN: PLPEKAO00016
6. **CD Projekt** (cdprojekt) — Studio gier (Wiedźmin, Cyberpunk 2077) i platforma GOG.com. Założony 1994, IPO 2002, Warszawa, ~1200 prac., ISIN: PLOPTTC00011
7. **Modivo** (modivo) — E-commerce moda i obuwie, marki eobuwie.pl, Modivo, HalfPrice, CCC. Założony 1999, IPO 2004, Polkowice, ~16000 prac., ISIN: PLCCC0000016
8. **Dino** (dino) — Sieć supermarketów proximity w Polsce, dynamiczna ekspansja. Założony 1999, IPO 2017, Krotoszyn, ~45000 prac., ISIN: PLDINPL00011
9. **LPP** (lpp) — Grupa odzieżowa, marki Reserved, Cropp, House, Mohito, Sinsay. Założony 1991, IPO 2001, Gdańsk, ~32000 prac., ISIN: PLLPP0000011
10. **Cyfrowy Polsat** (cyfrplsat) — Telewizja satelitarna, media, telekomunikacja (Plus), Polsat. Założony 1999, IPO 2007, Warszawa, ~16000 prac., ISIN: PLCFRPT00013
11. **mBank** (mbank) — Bank internetowy (dawniej BRE Bank). Bankowość detaliczna i korporacyjna online. Założony 1986, IPO 1992, Warszawa, ~6500 prac., ISIN: PLBRE0000012
12. **JSW** (jsw) — Największy producent węgla koksowego w UE. Kopalnie na Śląsku. Założony 1993, IPO 2011, Jastrzębie-Zdrój, ~22000 prac., ISIN: PLJSW0000015
13. **PGE** (pge) — Największa grupa energetyczna w Polsce. Wytwarzanie, dystrybucja, handel energią, OZE. Założony 1990, IPO 2009, Warszawa, ~42000 prac., ISIN: PLPGER000010
14. **Kruk** (kruk) — Lider zarządzania wierzytelnościami w Europie Środkowo-Wschodniej. Założony 1998, IPO 2011, Wrocław, ~2700 prac., ISIN: PLKRK0000010
15. **Pepco** (pepco) — Sieć dyskontowa Pepco i Dealz w Europie. Artykuły codzienne, odzież. IPO 2021 (na GPW), siedziba Poznań (zarejestrowana Holandia), ~45000 prac., ISIN: NL0015000AU7
16. **Asseco Poland** (assecopol) — Największa polska firma informatyczna. Oprogramowanie dla banków, administracji, biznesu. Założony 1991, IPO 1998, Rzeszów, ~30000 prac. (grupa), ISIN: PLSOFTB00016
17. **Orange Polska** (orangepl) — Operator telekomunikacyjny, internet, telewizja, 5G. Dawny TPSA. Założony 1991, IPO 1998, Warszawa, ~10000 prac., ISIN: PLTLKPL00017
18. **Alior** (alior) — Bank detaliczno-korporacyjny, challenger bank. Założony 2008, IPO 2012, Warszawa, ~7500 prac., ISIN: PLALIOR00045
19. **Kęty** (kety) — Grupa kapitałowa: aluminium (ekstruzja, systemy okienne), opakowania giętkie. Założony 1953, IPO 1996, Kęty, ~7500 prac., ISIN: PLKETY000011
20. **Allegro** (allegro) — Największa platforma e-commerce w Polsce i Europie Środkowo-Wschodniej. Marketplace, Allegro Pay, dostawy. Założony 1999, IPO 2020, Poznań (zarejestrowana Luksemburg), ~5750 prac., ISIN: LU2237380790
21. **Budimex** (budimex) — Największa firma budowlana w Polsce. Budownictwo ogólne, drogowe, kolejowe. Należy do grupy Ferrovial. Założony 1968, IPO 1995, Warszawa, ~7500 prac., ISIN: PLBUDMX00013
22. **Erste Bank Polska** (erste) — Trzeci największy bank w Polsce (dawniej Santander BP). Bankowość detaliczna i korporacyjna. Przejęty przez Erste Group 2026. IPO 2001 (jako WBK), Warszawa, ~11000 prac., ISIN: PLBZ00000044
23. **Tauron** (tauron) — Drugi największy dystrybutor energii elektrycznej w Polsce. Wytwarzanie, dystrybucja, OZE. Założony 2006, IPO 2010, Katowice, ~25000 prac., ISIN: PLTAURN00011
24. **Żabka** (zabka) — Największa sieć convenience w Europie Środkowo-Wschodniej. Ponad 10000 sklepów franczyzowych. IPO 2024, siedziba Poznań, ~4500 prac. (korporacja), ISIN: LU2910446546

Dla CEO: wpisz aktualnego prezesa zarządu na 2025/2026 — sprawdź w swojej wiedzy. Jeśli nie jesteś pewny, wpisz `null`.

### B. Nowy komponent: `src/components/CompanyProfile.jsx`

**Props:** `{ stock, lang }`

Renderuje sekcję "O spółce" z pól `stock.profile`. Layout:

#### B1. Opis spółki
- Nagłówek sekcji (używaj komponentu lub klasy `section-title`)
- Tekst opisu: `profile.description[lang]` — zwykły paragraf, `text-sm leading-relaxed`

#### B2. Karta informacyjna — grid 2 kolumny (mobile: 1 kolumna)
Każdy wiersz: etykieta (szary, mały) + wartość (normalny tekst). Pola:

| Etykieta PL | Etykieta EN | Wartość |
|---|---|---|
| Sektor | Sector | `sectors[lang][stock.sector]` |
| Siedziba | Headquarters | `profile.headquarters[lang]` |
| Rok założenia | Founded | `profile.founded` |
| Debiut na GPW | IPO Year | `profile.ipoYear` |
| Pracownicy | Employees | `profile.employees` — sformatowane z separatorem tysięcy |
| Prezes zarządu | CEO | `profile.ceo` |
| ISIN | ISIN | `profile.isin` — font mono |
| Strona WWW | Website | `profile.website` — jako link `<a>` z `target="_blank"`, wyświetl domenę bez https:// |

- Pomiń pola z wartością `null`
- Styl karty: klasa `.card` (istniejąca w projekcie)

#### B3. Kluczowe dane rynkowe — osobna karta pod spodem
Mini grid z wartościami:

| Etykieta PL | Etykieta EN | Wartość |
|---|---|---|
| Kapitalizacja | Market Cap | `formatNumber(stock.marketCap, lang)` |
| Liczba akcji | Shares Outstanding | `stock.sharesOutstanding` sformatowane |
| Cena / Zysk (P/E) | P/E Ratio | `stock.ratios.pe?.toFixed(1)` |
| Cena / Wartość Księgowa | P/B Ratio | `stock.ratios.pb?.toFixed(2)` |
| Stopa dywidendy | Dividend Yield | `stock.ratios.dividendYield?.toFixed(1)%` |

- Użyj istniejących helperów `formatNumber`, `formatPrice` z `wig20.js`

### C. Nowy tab "O spółce" w `src/pages/StockPage.jsx`

1. Dodaj nowy tab do tablicy `TABS`:
```js
{ id: 'about', pl: 'O spółce', en: 'About' }
```
Umieść go na pozycji 2 (po overview, przed chart), żeby kolejność była:
`overview → about → chart → financials → valuation → health`

2. W sekcji tab content dodaj:
```jsx
{tab === 'about' && stock.profile && (
  <CompanyProfile stock={stock} lang={lang} />
)}
```

3. Fallback gdy `stock.profile` nie istnieje:
```jsx
{tab === 'about' && !stock.profile && (
  <div className="card text-center py-12 text-surface-400">
    {lang === 'pl' ? 'Informacje o spółce będą dostępne wkrótce.' : 'Company information coming soon.'}
  </div>
)}
```

### D. Tłumaczenia w `src/data/translations.js`

Dodaj do obiektu `stock`:
```
about: "O spółce" / "About"
```

Dodaj nowy obiekt `company`:
```
company.sector: "Sektor" / "Sector"
company.headquarters: "Siedziba" / "Headquarters"
company.founded: "Rok założenia" / "Founded"
company.ipoYear: "Debiut na GPW" / "IPO Year"
company.employees: "Pracownicy" / "Employees"
company.ceo: "Prezes zarządu" / "CEO"
company.isin: "ISIN" / "ISIN"
company.website: "Strona WWW" / "Website"
company.marketCap: "Kapitalizacja" / "Market Cap"
company.shares: "Liczba akcji" / "Shares Outstanding"
company.description: "O spółce" / "About Company"
company.marketData: "Dane rynkowe" / "Market Data"
company.info: "Informacje" / "Information"
```

## Ważne zasady

- BEZ nowych zależności npm
- Opisy spółek: 2-3 zdania, merytoryczne, bez marketingu — jak w encyklopedii
- CEO: wpisz prawdziwych prezesów jeśli jesteś pewny, w przeciwnym razie null
- Link do strony WWW: `rel="noopener noreferrer"`, wyświetl tylko domenę (np. "pkobp.pl")
- Komponent CompanyProfile nie powinien fetchować danych — wszystko z props
- Formatowanie liczby pracowników: `toLocaleString('pl-PL')` lub `toLocaleString('en-US')` w zależności od `lang`
- Zachowaj istniejący tab overview — tab "about" to NOWY, osobny tab
- Nie zmieniaj kolejności istniejących tabów (overview pierwszy, reszta jak dotychczas, about wstawiany między overview i chart)
