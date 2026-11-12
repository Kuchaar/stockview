// Comprehensive financial ratio calculator for StockView
// Operates on the canonical financial data format from financialSchema.js

import { isBankSector, currencyGuard } from './financialSchema.js'; // z rozszerzeniem: ten plik czytają też skrypty pod Node

const TAX_RATE_PL = 0.19; // Polish CIT rate

// --- Helpers ---

function safeDivide(numerator, denominator) {
  if (numerator == null || denominator == null || denominator === 0) return null;
  const result = numerator / denominator;
  if (!isFinite(result)) return null;
  return result;
}

function round2(val) {
  if (val == null) return null;
  return Math.round(val * 100) / 100;
}

/** Get the most recent row from an array of statement rows (by date) */
function latest(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows.reduce((a, b) => {
    if (!a?.date && !b?.date) return a; // brak dat → zostajemy przy pierwszym wierszu
    if (!a?.date) return b;
    if (!b?.date) return a;
    return a.date >= b.date ? a : b;
  });
}

/** Get the second most recent row */
function secondLatest(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const sorted = [...rows].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return sorted[1];
}

/**
 * Rozpoznanie banku. Najpewniejszy jest sektor ze `src/data/wig20.js`;
 * dawna heurystyka („brak marży brutto") przestała działać, bo Yahoo od pewnego czasu
 * nie podaje `grossProfit` dla żadnej spółki — patrz U6 w docs/DATA.md.
 */
function isBank(financialData) {
  if (financialData?.sector) return isBankSector(financialData.sector);
  const inc = latest(financialData?.incomeStatement?.annual);
  return inc ? inc.grossProfit == null : false;
}

// --- Main calculator ---

/**
 * Calculate all financial ratios from canonical financial data.
 *
 * @param {object} financialData - Canonical format from financialSchema.js
 * @param {number|null} currentPrice - Live stock price
 * @param {number|null} sharesOutstanding - Number of shares outstanding
 * @returns {object} Ratios grouped by category
 */
export function calculateAllRatios(financialData, currentPrice, sharesOutstanding) {
  if (!financialData) {
    return { profitability: {}, valuation: {}, debtAndLiquidity: {}, dividend: {}, growth: {} };
  }

  const inc = latest(financialData.incomeStatement?.annual);
  const incPrev = secondLatest(financialData.incomeStatement?.annual);
  const bs = latest(financialData.balanceSheet?.annual);
  const cf = latest(financialData.cashFlow?.annual);
  const ks = financialData.keyStats || {};
  const bank = isBank(financialData);

  const marketCap = (currentPrice != null && sharesOutstanding != null)
    ? currentPrice * sharesOutstanding
    : null;

  // Osłona walutowa (D9, uodporniona w D9a). `currentPrice` jest w walucie notowań, czyli
  // w PLN — tak notuje GPW i tak oddają Stooq i Yahoo. Sprawozdanie może być w innej walucie:
  // Pepco raportuje w EUR (U10 w docs/DATA.md). Wskaźnika, który łączy cenę z liczbą ze
  // sprawozdania, **nie liczymy wtedy wcale** — nie przeliczamy też kursem, bo kurs z dnia
  // wyceny i kurs średni okresu to dwie różne rzeczy, a wybór między nimi jest decyzją
  // metodologiczną, nie szczegółem implementacyjnym. Lepiej „—" niż liczba, która wygląda
  // poprawnie. Wskaźniki czysto ilorazowe (ROE, marże, dług/kapitał) są bezpieczne: dzielą
  // walutę przez tę samą walutę i skracają ją.
  //
  // Decyzję podejmuje `currencyGuard`, nie porównanie z jedną wartością: przy wierszach
  // o **różnych** walutach też trzeba wyłączyć wskaźniki, a wcześniejsza wersja brała
  // „pierwszą napotkaną" walutę i wtedy jeden wiersz mógł po cichu wyłączyć osłonę.
  const guard = currencyGuard(financialData);
  const currencyMismatch = guard.mismatch;

  // `notMeaningful` wychodzi z wyceny, ale stoi na wierzchu obok `currencyInfo`, bo to
  // informacja **o całym zestawie**, a nie kolejny wskaźnik: `MetricsPanel` iteruje po
  // zamkniętej liście pól kategorii, więc klucz w środku `valuation` byłby cicho pomijany.
  const { notMeaningful: valuationNm, ...valuation } = calcValuation(
    inc, incPrev, bs, cf, ks, currentPrice, marketCap, currencyMismatch,
  );
  const { notMeaningful: growthNm, ...growth } = calcGrowth(inc, incPrev);

  return {
    profitability: calcProfitability(inc, bs, bank),
    valuation,
    debtAndLiquidity: calcDebtAndLiquidity(inc, bs, cf, bank),
    dividend: calcDividend(cf, inc, ks, marketCap, currencyMismatch),
    growth,
    currencyInfo: guard,
    notMeaningful: { ...valuationNm, ...growthNm },
    isBank: bank,
  };
}

function calcProfitability(inc, bs, bank) {
  const revenue = inc?.revenue;
  const netIncome = inc?.netIncome;
  const operatingIncome = inc?.operatingIncome;
  const grossProfit = inc?.grossProfit;
  const ebitda = inc?.ebitda;
  const equity = bs?.totalEquity;
  const totalAssets = bs?.totalAssets;

  // ROIC: NOPAT / Invested Capital
  // Invested Capital = Equity + Total Debt - Cash
  const nopat = operatingIncome != null ? operatingIncome * (1 - TAX_RATE_PL) : null;
  const investedCapital = (equity != null && bs?.totalDebt != null)
    ? equity + (bs.totalDebt ?? 0) - (bs.cash ?? 0)
    : null;

  return {
    roe: round2(safeDivide(netIncome, equity) != null ? safeDivide(netIncome, equity) * 100 : null),
    roa: round2(safeDivide(netIncome, totalAssets) != null ? safeDivide(netIncome, totalAssets) * 100 : null),
    roic: round2(safeDivide(nopat, investedCapital) != null ? safeDivide(nopat, investedCapital) * 100 : null),
    grossMargin: bank ? null : round2(safeDivide(grossProfit, revenue) != null ? safeDivide(grossProfit, revenue) * 100 : null),
    operatingMargin: round2(safeDivide(operatingIncome, revenue) != null ? safeDivide(operatingIncome, revenue) * 100 : null),
    netMargin: round2(safeDivide(netIncome, revenue) != null ? safeDivide(netIncome, revenue) * 100 : null),
    ebitdaMargin: bank ? null : round2(safeDivide(ebitda, revenue) != null ? safeDivide(ebitda, revenue) * 100 : null),
  };
}

function calcValuation(inc, incPrev, bs, cf, ks, currentPrice, marketCap, currencyMismatch = false) {
  // Każdy wskaźnik poniżej łączy cenę albo kapitalizację (PLN) z liczbą ze sprawozdania,
  // więc przy innej walucie sprawozdania wszystkie idą na `null` — `forwardPe` też.
  // Tego ostatniego nie liczymy my, a Yahoo, i właśnie dlatego nie wiemy, czy dla spółki
  // raportującej w EUR zestawia cenę w PLN z prognozą zysku w EUR. Jedna liczba stojąca
  // między kreskami wyglądałaby na sprawdzoną, a sprawdzona nie jest (decyzja Kamila
  // po recenzji PR #7).
  //
  // `notMeaningful` to **drugi, osobny** powód braku liczby. `null` znaczy „nie mamy danej";
  // wpis w `notMeaningful` znaczy „daną mamy, ale ten wskaźnik jest z niej nieokreślony".
  // Na ekranie muszą wyglądać inaczej, bo mówią co innego (P8+D10e). Przy niezgodności walut
  // mapa zostaje pusta: tam powodem jest waluta i mówi o tym nota z `currencyInfo`.
  if (currencyMismatch) {
    return { pe: null, forwardPe: null, pb: null, ps: null, evEbitda: null, peg: null, fcfYield: null, notMeaningful: {} };
  }

  const eps = inc?.eps ?? ks.eps ?? null;
  const bvps = bs?.bookValuePerShare ?? ks.bookValue ?? null;
  const revenue = inc?.revenue;
  const ebitda = inc?.ebitda;
  const cash = bs?.cash ?? 0;
  const totalDebt = bs?.totalDebt ?? 0;
  const fcf = cf?.freeCashFlow;

  // C/Z przy zysku nie większym od zera **nie jest liczbą** — jest oznaczane „n/m"
  // (not meaningful), konwencją serwisów finansowych. Arytmetyka daje wynik (dla JSW −0,56,
  // Cyfrowego Polsatu −3,74, PGE −10,72), ale mnożnik ceny do zysku jest określony tylko
  // dla zysku dodatniego: ujemne C/Z nie znaczy „tanio", nie da się go porównać z dodatnim
  // i nie da się go uszeregować — −10,7 nie jest „niższe" niż 8 w żadnym użytecznym sensie.
  // Decyzja Kamila 2026-10-24 z recenzji PR #10.
  const notMeaningful = {};
  if (eps != null && eps <= 0) notMeaningful.pe = 'loss';
  const pe = notMeaningful.pe ? null : round2(safeDivide(currentPrice, eps));
  const forwardPe = ks.forwardPe ?? null;
  const pb = round2(safeDivide(currentPrice, bvps));
  const ps = round2(safeDivide(marketCap, revenue));
  const ev = marketCap != null ? marketCap + totalDebt - cash : null;
  const evEbitda = round2(safeDivide(ev, ebitda));
  const fcfYield = round2(safeDivide(fcf, marketCap) != null ? safeDivide(fcf, marketCap) * 100 : null);

  // PEG: C/Z podzielone przez tempo wzrostu EPS. Schodzi z `pe` sam, bo liczy się tylko
  // przy `pe != null` — ale ma własną pułapkę. Gdy **poprzedni** rok zamknął się stratą,
  // `(eps − epsPrev) / |epsPrev|` wychodzi dodatnie z samego wyjścia ze straty: przy
  // −1,00 → +0,10 daje to „wzrost 110%", choć zysk jest dziesięciokrotnie mniejszy niż
  // strata, od której liczymy. PEG z takiego mianownika mówi o odbiciu, nie o tempie
  // wzrostu, więc też idzie na „n/m". Warunek: oba EPS-y dodatnie.
  let peg = null;
  const epsNow = inc?.eps ?? null;
  const epsPrev = incPrev?.eps ?? null;
  if (notMeaningful.pe) {
    notMeaningful.peg = 'loss';
  } else if (pe != null && epsNow != null && epsPrev != null) {
    if (epsPrev > 0) {
      const epsGrowth = (epsNow - epsPrev) / epsPrev * 100;
      if (epsGrowth > 0) {
        peg = round2(safeDivide(pe, epsGrowth));
      }
    } else {
      notMeaningful.peg = 'rebound';
    }
  }

  return { pe, forwardPe, pb, ps, evEbitda, peg, fcfYield, notMeaningful };
}

function calcDebtAndLiquidity(inc, bs, cf, bank) {
  const equity = bs?.totalEquity;
  const totalDebt = bs?.totalDebt;
  const cash = bs?.cash ?? 0;
  const ebitda = inc?.ebitda;
  const operatingIncome = inc?.operatingIncome;
  const interestExpense = inc?.interestExpense;
  const currentAssets = bs?.currentAssets;
  const currentLiabilities = bs?.currentLiabilities;
  const ocf = cf?.operatingCashFlow;

  const netDebt = totalDebt != null ? totalDebt - cash : null;

  return {
    debtToEquity: round2(safeDivide(totalDebt, equity)),
    netDebtToEbitda: round2(safeDivide(netDebt, ebitda)),
    currentRatio: bank ? null : round2(safeDivide(currentAssets, currentLiabilities)),
    quickRatio: bank ? null : round2(safeDivide(currentAssets != null ? currentAssets * 0.7 : null, currentLiabilities)),
    interestCoverage: round2(safeDivide(operatingIncome, interestExpense != null ? Math.abs(interestExpense) : null)),
    noc: ocf ?? null,
  };
}

function calcDividend(cf, inc, ks, marketCap, currencyMismatch = false) {
  const dividendsPaid = cf?.dividendsPaid;
  const netIncome = inc?.netIncome;

  // Stopa od Yahoo jest ich własną, spójną liczbą — zostaje. Nasze wyliczenie awaryjne
  // dzieli dywidendę ze sprawozdania przez kapitalizację w PLN, więc przy innej walucie
  // sprawozdania się go nie robi. `payoutRatio` jest bezpieczny: dywidenda i zysk netto
  // są w tej samej walucie.
  let dividendYield = ks.dividendYield ?? null;
  if (!currencyMismatch && dividendYield == null && dividendsPaid != null && marketCap != null && marketCap > 0) {
    dividendYield = round2(Math.abs(dividendsPaid) / marketCap * 100);
  }

  const payoutRatio = (dividendsPaid != null && netIncome != null && netIncome > 0)
    ? round2(Math.abs(dividendsPaid) / netIncome * 100)
    : null;

  return { dividendYield, payoutRatio };
}

/**
 * Dynamika rok do roku. **Tempo wzrostu liczymy tylko od bazy dodatniej.**
 *
 * `(bieżące − poprzednie) / |poprzednie|` przy poprzednim roku na stracie mierzy wyjście
 * ze straty, nie wzrost: Pepco ma tak „wzrost zysku netto +76%", mając **nadal stratę**
 * (marża netto −3,89%) — strata po prostu zmalała. JSW ma „+14,19%" przy marży netto −66%.
 * Oba wchodziły do oceny kondycji jako punkty za wzrost, czyli ocena nagradzała mniejszą
 * stratę tak samo jak zysk. Przy ujemnej bazie wynik idzie na `null` z powodem `rebound`,
 * żeby ekran mógł napisać „n/m", a nie „—" (P8+D10e).
 *
 * Spadek **w** stratę zostaje liczbą: baza jest dodatnia, więc „−150%" to prawdziwy spadek.
 */
function calcGrowth(inc, incPrev) {
  const notMeaningful = {};

  function yoyGrowth(key, current, previous) {
    if (current == null || previous == null) return null;
    if (previous <= 0) {
      notMeaningful[key] = 'rebound';
      return null;
    }
    return round2((current - previous) / previous * 100);
  }

  return {
    revenueGrowthYoY: yoyGrowth('revenueGrowthYoY', inc?.revenue, incPrev?.revenue),
    netIncomeGrowthYoY: yoyGrowth('netIncomeGrowthYoY', inc?.netIncome, incPrev?.netIncome),
    epsGrowthYoY: yoyGrowth('epsGrowthYoY', inc?.eps, incPrev?.eps),
    notMeaningful,
  };
}

// --- Ratio metadata ---

const RATIO_META = {
  // Profitability
  roe: { label_pl: 'ROE', label_en: 'ROE', tooltip_pl: 'Zwrot z kapitału własnego (zysk netto / kapitał)', tooltip_en: 'Return on equity (net income / equity)', format: 'percent', higherIsBetter: true },
  roa: { label_pl: 'ROA', label_en: 'ROA', tooltip_pl: 'Zwrot z aktywów (zysk netto / aktywa)', tooltip_en: 'Return on assets (net income / total assets)', format: 'percent', higherIsBetter: true },
  roic: { label_pl: 'ROIC', label_en: 'ROIC', tooltip_pl: 'Zwrot z zainwestowanego kapitału', tooltip_en: 'Return on invested capital', format: 'percent', higherIsBetter: true },
  grossMargin: { label_pl: 'Marża brutto', label_en: 'Gross Margin', tooltip_pl: 'Zysk brutto / przychody', tooltip_en: 'Gross profit / revenue', format: 'percent', higherIsBetter: true },
  operatingMargin: { label_pl: 'Marża operacyjna', label_en: 'Operating Margin', tooltip_pl: 'Zysk operacyjny / przychody', tooltip_en: 'Operating income / revenue', format: 'percent', higherIsBetter: true },
  netMargin: { label_pl: 'Marża netto', label_en: 'Net Margin', tooltip_pl: 'Zysk netto / przychody', tooltip_en: 'Net income / revenue', format: 'percent', higherIsBetter: true },
  ebitdaMargin: { label_pl: 'Marża EBITDA', label_en: 'EBITDA Margin', tooltip_pl: 'EBITDA / przychody', tooltip_en: 'EBITDA / revenue', format: 'percent', higherIsBetter: true },

  // Valuation
  pe: { label_pl: 'C/Z', label_en: 'P/E', tooltip_pl: 'Cena / zysk na akcję', tooltip_en: 'Price / earnings per share', format: 'multiple', higherIsBetter: null },
  forwardPe: { label_pl: 'C/Z (forward)', label_en: 'Forward P/E', tooltip_pl: 'Cena / prognozowany zysk', tooltip_en: 'Price / forward earnings', format: 'multiple', higherIsBetter: null },
  pb: { label_pl: 'C/WK', label_en: 'P/B', tooltip_pl: 'Cena / wartość księgowa', tooltip_en: 'Price / book value', format: 'multiple', higherIsBetter: null },
  ps: { label_pl: 'C/P', label_en: 'P/S', tooltip_pl: 'Kapitalizacja / przychody', tooltip_en: 'Market cap / revenue', format: 'multiple', higherIsBetter: null },
  evEbitda: { label_pl: 'EV/EBITDA', label_en: 'EV/EBITDA', tooltip_pl: 'Wartość przedsiębiorstwa / EBITDA', tooltip_en: 'Enterprise value / EBITDA', format: 'multiple', higherIsBetter: null },
  peg: { label_pl: 'PEG', label_en: 'PEG', tooltip_pl: 'C/Z podzielone przez tempo wzrostu zysku', tooltip_en: 'P/E divided by earnings growth rate', format: 'ratio', higherIsBetter: null },
  fcfYield: { label_pl: 'FCF Yield', label_en: 'FCF Yield', tooltip_pl: 'Wolne przepływy / kapitalizacja', tooltip_en: 'Free cash flow / market cap', format: 'percent', higherIsBetter: true },

  // Debt & Liquidity
  debtToEquity: { label_pl: 'Dług/Kapitał', label_en: 'Debt/Equity', tooltip_pl: 'Dług całkowity / kapitał własny', tooltip_en: 'Total debt / equity', format: 'ratio', higherIsBetter: false },
  netDebtToEbitda: { label_pl: 'Dług netto/EBITDA', label_en: 'Net Debt/EBITDA', tooltip_pl: 'Dług netto / EBITDA', tooltip_en: 'Net debt / EBITDA', format: 'ratio', higherIsBetter: false },
  currentRatio: { label_pl: 'Płynność bieżąca', label_en: 'Current Ratio', tooltip_pl: 'Aktywa obrotowe / zobowiązania krótkoterminowe', tooltip_en: 'Current assets / current liabilities', format: 'ratio', higherIsBetter: true },
  quickRatio: { label_pl: 'Płynność szybka', label_en: 'Quick Ratio', tooltip_pl: 'Aktywa obrotowe (bez zapasów) / zobowiązania krótkoterm.', tooltip_en: 'Quick assets / current liabilities', format: 'ratio', higherIsBetter: true },
  interestCoverage: { label_pl: 'Pokrycie odsetek', label_en: 'Interest Coverage', tooltip_pl: 'Zysk operacyjny / koszty odsetkowe', tooltip_en: 'Operating income / interest expense', format: 'ratio', higherIsBetter: true },
  noc: { label_pl: 'Przepływy operacyjne', label_en: 'Operating Cash Flow', tooltip_pl: 'Gotówka z działalności operacyjnej', tooltip_en: 'Cash from operating activities', format: 'currency', higherIsBetter: true },

  // Dividend
  dividendYield: { label_pl: 'Stopa dywidendy', label_en: 'Dividend Yield', tooltip_pl: 'Dywidenda / cena akcji', tooltip_en: 'Dividend / share price', format: 'percent', higherIsBetter: true },
  payoutRatio: { label_pl: 'Payout Ratio', label_en: 'Payout Ratio', tooltip_pl: 'Dywidendy wypłacone / zysk netto', tooltip_en: 'Dividends paid / net income', format: 'percent', higherIsBetter: null },

  // Growth
  revenueGrowthYoY: { label_pl: 'Wzrost przychodów r/r', label_en: 'Revenue Growth YoY', tooltip_pl: 'Zmiana przychodów rok do roku', tooltip_en: 'Year-over-year revenue change', format: 'percent', higherIsBetter: true },
  netIncomeGrowthYoY: { label_pl: 'Wzrost zysku netto r/r', label_en: 'Net Income Growth YoY', tooltip_pl: 'Zmiana zysku netto rok do roku', tooltip_en: 'Year-over-year net income change', format: 'percent', higherIsBetter: true },
  epsGrowthYoY: { label_pl: 'Wzrost EPS r/r', label_en: 'EPS Growth YoY', tooltip_pl: 'Zmiana zysku na akcję rok do roku', tooltip_en: 'Year-over-year EPS change', format: 'percent', higherIsBetter: true },
};

/**
 * Get metadata for a ratio key.
 * @param {string} ratioKey
 * @returns {{ label_pl, label_en, tooltip_pl, tooltip_en, format, higherIsBetter }|null}
 */
export function getRatioMeta(ratioKey) {
  return RATIO_META[ratioKey] || null;
}

// --- Ocena kondycji (P8+D10e) ---

/**
 * Pasma, którymi karty Przeglądu opisują pojedynczy wskaźnik.
 *
 * **To konwencja StockView, nie wyliczona średnia indeksu ani norma rynkowa.** Wcześniej
 * karta C/Z pisała „Poniżej średniej WIG20" i podpowiadała w podpowiedzi „dla WIG20 średnia
 * to ok. 12–15" — żadnej średniej WIG20 nie liczymy, więc było to zdanie bez pokrycia
 * w danych. Liczby zostały, nazwa źródła się zmieniła: granice pasm są nasze i tak są
 * podpisane. Trzymamy je tutaj, żeby ekran i opis metodologii brały je z jednego miejsca.
 */
export const CARD_BANDS = {
  pe: [12, 20],
  pb: [1.5],
  roe: [8, 15],
  dividendYield: [1, 4],
};

/**
 * Progi oceny kondycji — również **konwencja StockView**. Żaden z nich nie jest cytatem
 * ze standardu rachunkowości, rekomendacji nadzoru ani wyliczenia z GPW; są dobrane tak,
 * by oddzielić wartości typowe dla dużej spółki giełdowej od skrajnych, i mogą się zmienić.
 * Tam, gdzie próg miałby konkretne źródło, stałoby ono tutaj w komentarzu.
 *
 * Czego tu **nie ma**:
 * - **bloku wyceny** — C/Z, C/WK i EV/EBITDA nie wchodzą do oceny kondycji. „Tanio" nie jest
 *   cechą finansów spółki, tylko zdaniem o cenie, a takiego zdania nie wydajemy
 *   (`docs/VISION.md`, Zasady 1 i 2). Przy okazji znika z oceny cały problem walutowy z D9,
 *   bo wszystkie wskaźniki poniżej dzielą walutę przez tę samą walutę;
 * - **płynności szybkiej** — `quickRatio` liczymy jako `aktywa obrotowe × 0,7`, czyli
 *   z założeniem, że zapasy to 30% aktywów obrotowych. Ten mnożnik jest zmyślony, a nie
 *   wzięty z bilansu, więc nie punktujemy nim niczego. W zakładce Wskaźniki zostaje, bo tam
 *   jest podpisany własną definicją.
 */
export const HEALTH_CRITERIA = {
  profitability: {
    weight: 30,
    group: 'profitability',
    metrics: [
      { key: 'roe', low: 5, mid: 10, high: 15 },
      { key: 'netMargin', low: 3, mid: 8, high: 15 },
      { key: 'operatingMargin', low: 5, mid: 10, high: 20 },
    ],
  },
  leverage: {
    weight: 25,
    group: 'debtAndLiquidity',
    metrics: [
      { key: 'debtToEquity', low: 0.3, mid: 0.7, high: 1.5, invert: true, negative: 'worst' },
      { key: 'netDebtToEbitda', low: 1, mid: 3, high: 5, invert: true, negative: 'skip' },
      { key: 'interestCoverage', low: 2, mid: 5, high: 10 },
    ],
  },
  growth: {
    weight: 20,
    group: 'growth',
    metrics: [
      { key: 'revenueGrowthYoY', low: 0, mid: 5, high: 15 },
      { key: 'netIncomeGrowthYoY', low: 0, mid: 10, high: 25 },
    ],
  },
  liquidity: {
    weight: 15,
    group: 'debtAndLiquidity',
    metrics: [
      { key: 'currentRatio', low: 1.0, mid: 1.5, high: 2.0 },
    ],
  },
  efficiency: {
    weight: 10,
    group: 'profitability',
    metrics: [
      // Progi ROA 2/4/8% są skalą spółki niefinansowej. Bank przy tej samej skali dostaje
      // najniższe pasmo z samej swojej budowy — PKO BP ma ROA 1,83% przy ROE 18,3% — bo
      // aktywa banku to przede wszystkim udzielone kredyty. **Nie podstawiamy tu własnych
      // progów bankowych**, bo nie mamy dla nich źródła, więc dla banku wskaźnik wypada
      // z oceny tak samo jak brak danej. `roic` i tak jest dla banków `null` (brak zysku
      // operacyjnego), więc cały obszar Efektywność znika im z oceny razem ze swoją wagą —
      // i jest to widoczne na ekranie w linijce o liczbie obszarów.
      { key: 'roa', low: 2, mid: 4, high: 8, skipForBank: true },
      { key: 'roic', low: 4, mid: 8, high: 12 },
    ],
  },
};

export const HEALTH_LABEL_BANDS = [
  { max: 25, label: 'critical' },
  { max: 40, label: 'weak' },
  { max: 60, label: 'neutral' },
  { max: 75, label: 'good' },
  { max: Infinity, label: 'strong' },
];

/**
 * Punkty za jeden wskaźnik: 100 / 70 / 40 / 10, albo `null`, gdy danej nie ma.
 *
 * **`null` nigdy nie zamienia się w punkty.** To klasa błędu D4a: karta „Dynamika
 * przychodów" dostawała wcześniej 50 punktów za nieobecną daną, czyli połowę za to, że
 * czegoś nie wiemy — a połowa punktów to już ocena.
 *
 * Wartość **ujemna** przy wskaźniku „im mniej, tym lepiej" nie jest najlepszym wynikiem,
 * choć zwykłe `value <= low` tak by ją potraktowało:
 * - `debtToEquity < 0` może wyjść tylko z **ujemnego kapitału własnego** (dług ujemny nie
 *   istnieje), czyli z sytuacji skrajnie złej → najniższe pasmo (`negative: 'worst'`);
 * - `netDebtToEbitda < 0` ma **dwie** możliwe przyczyny o przeciwnym znaczeniu: nadwyżkę
 *   gotówki nad długiem (dobrze) albo ujemną EBITDA (źle). Z samego ilorazu nie wiadomo
 *   która, więc wskaźnik wypada z oceny (`negative: 'skip'`) — tak samo jak brak danej.
 *   Zgadywanie w którąkolwiek stronę byłoby oceną wziętą z niczego.
 */
function scoreMetric(value, metric) {
  if (value == null) return null;
  if (metric.invert) {
    if (value < 0) return metric.negative === 'worst' ? 10 : null;
    if (value <= metric.low) return 100;
    if (value <= metric.mid) return 70;
    if (value <= metric.high) return 40;
    return 10;
  }
  if (value >= metric.high) return 100;
  if (value >= metric.mid) return 70;
  if (value >= metric.low) return 40;
  return 10;
}

/**
 * Ocena kondycji z **bieżących** wskaźników (`calculateAllRatios` na danych poziomu 1/2).
 * Nic tu nie pochodzi z `src/data/wig20.js` — zaszyte `ratios` policzono zaszytą ceną,
 * a zaszyte `financials` mają kolumnę prognozy „2024E" (P8+D10e).
 *
 * @param {object|null} allRatios wynik `calculateAllRatios`
 * @returns {{score: number|null, label: string|null, categories: object, usedWeight: number}}
 *   `score: null` znaczy „nie ma z czego ocenić" — **nie zero i nie 50**. Zero wygląda
 *   na najgorszą możliwą ocenę, 50 na przeciętną; obie są werdyktem o spółce, o której
 *   nie wiemy nic (P1 §3).
 */
/**
 * Wartość wskaźnika **wzięta tak, jak ją widzi ocena** — razem z trzema powodami, dla
 * których wskaźnik może z oceny wypaść. Jedna funkcja, bo karta Przeglądu i sama ocena
 * muszą czytać dokładnie to samo: gdyby karta liczyła kolor z surowej liczby, a ocena
 * pomijała ją jako nieokreśloną, na ekranie stałby kolor bez punktów za nim.
 */
function metricValue(allRatios, def, metric) {
  if (metric.skipForBank && allRatios?.isBank) return null;
  if (allRatios?.notMeaningful?.[metric.key]) return null;
  return allRatios?.[def.group]?.[metric.key] ?? null;
}

/**
 * Punkty za **jeden** wskaźnik z podanego obszaru — dla kart Przeglądu, które pokazują
 * jedną liczbę, a plakietkę i pasek biorą ze średniej całego obszaru. Bez tego kolor liczby
 * szedłby za średnią: ROE −107,8% (Pepco) stałoby na pomarańczowo, gdyby marża operacyjna
 * podciągnęła średnią rentowności do środka pasma.
 */
export function scoreHealthMetric(area, key, allRatios) {
  const def = HEALTH_CRITERIA[area];
  const metric = def?.metrics.find(m => m.key === key);
  if (!metric) return null;
  return scoreMetric(metricValue(allRatios, def, metric), metric);
}

export function calculateHealth(allRatios) {
  const categories = {};
  let weighted = 0;
  let usedWeight = 0;

  for (const [name, def] of Object.entries(HEALTH_CRITERIA)) {
    const scores = def.metrics
      .map(m => scoreMetric(metricValue(allRatios, def, m), m))
      .filter(sc => sc != null);
    const score = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    categories[name] = {
      score,
      weight: def.weight,
      used: scores.length,
      total: def.metrics.length,
    };
    if (score != null) {
      weighted += score * def.weight;
      usedWeight += def.weight;
    }
  }

  if (usedWeight === 0) {
    return { score: null, label: null, categories, usedWeight: 0 };
  }

  // Wagi obszarów bez danych **nie przechodzą** na pozostałe jako punkty — dzielimy przez
  // sumę wag tych obszarów, które mamy. `usedWeight` wraca na wierzch, żeby ekran mógł
  // powiedzieć, z jakiej części oceny ta liczba pochodzi: 82/100 z jednego obszaru i 82/100
  // z pięciu to nie to samo twierdzenie.
  const score = Math.round(weighted / usedWeight);
  const label = HEALTH_LABEL_BANDS.find(b => score < b.max).label;

  return { score, label, categories, usedWeight };
}

// --- Health Score V2 ---

function scoreRange(value, low, mid, high, invert = false) {
  if (value == null) return null;
  if (invert) {
    if (value <= low) return 100;
    if (value <= mid) return 70;
    if (value <= high) return 40;
    return 10;
  }
  if (value >= high) return 100;
  if (value >= mid) return 70;
  if (value >= low) return 40;
  return 10;
}

/**
 * Calculate health score from the new grouped ratios.
 * Returns { score: 0-100, label: 'critical'|'weak'|'neutral'|'good'|'strong' }
 */
export function calculateHealthScoreV2(allRatios) {
  if (!allRatios) return { score: 0, label: 'critical' };

  const p = allRatios.profitability || {};
  const v = allRatios.valuation || {};
  const d = allRatios.debtAndLiquidity || {};
  const g = allRatios.growth || {};

  // Profitability (25%)
  const profScores = [
    scoreRange(p.roe, 5, 10, 15),
    scoreRange(p.netMargin, 3, 8, 15),
    scoreRange(p.operatingMargin, 5, 10, 20),
  ].filter(s => s != null);
  const profAvg = profScores.length ? profScores.reduce((a, b) => a + b, 0) / profScores.length : null;

  // Valuation (20%) — lower is better for P/E, P/B, EV/EBITDA
  const valScores = [
    scoreRange(v.pe, 8, 15, 25, true),
    scoreRange(v.pb, 0.5, 1.5, 3, true),
    scoreRange(v.evEbitda, 5, 10, 18, true),
  ].filter(s => s != null);
  const valAvg = valScores.length ? valScores.reduce((a, b) => a + b, 0) / valScores.length : null;

  // Debt (25%) — lower is better for D/E, net debt/EBITDA; higher for interest coverage
  const debtScores = [
    scoreRange(d.debtToEquity, 0.3, 0.7, 1.5, true),
    scoreRange(d.netDebtToEbitda, 1, 3, 5, true),
    scoreRange(d.interestCoverage, 2, 5, 10),
  ].filter(s => s != null);
  const debtAvg = debtScores.length ? debtScores.reduce((a, b) => a + b, 0) / debtScores.length : null;

  // Liquidity (15%) — skip for banks
  const liqScores = [
    scoreRange(d.currentRatio, 1.0, 1.5, 2.0),
    scoreRange(d.quickRatio, 0.7, 1.0, 1.5),
  ].filter(s => s != null);
  const liqAvg = liqScores.length ? liqScores.reduce((a, b) => a + b, 0) / liqScores.length : null;

  // Growth (15%)
  const growthScores = [
    scoreRange(g.revenueGrowthYoY, 0, 5, 15),
    scoreRange(g.netIncomeGrowthYoY, 0, 10, 25),
  ].filter(s => s != null);
  const growthAvg = growthScores.length ? growthScores.reduce((a, b) => a + b, 0) / growthScores.length : null;

  // Weighted average — redistribute weights for missing categories
  const components = [
    { score: profAvg, weight: 25 },
    { score: valAvg, weight: 20 },
    { score: debtAvg, weight: 25 },
    { score: liqAvg, weight: 15 },
    { score: growthAvg, weight: 15 },
  ].filter(c => c.score != null);

  if (components.length === 0) return { score: 0, label: 'critical' };

  const totalWeight = components.reduce((a, c) => a + c.weight, 0);
  const score = Math.round(
    components.reduce((a, c) => a + c.score * c.weight, 0) / totalWeight
  );

  let label;
  if (score < 25) label = 'critical';
  else if (score < 40) label = 'weak';
  else if (score < 60) label = 'neutral';
  else if (score < 75) label = 'good';
  else label = 'strong';

  return { score, label };
}
