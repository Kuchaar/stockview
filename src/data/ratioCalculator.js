// Comprehensive financial ratio calculator for StockView
// Operates on the canonical financial data format from financialSchema.js

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

/** Detect bank: grossProfit is null in the latest income statement */
function isBank(financialData) {
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

  return {
    profitability: calcProfitability(inc, bs, bank),
    valuation: calcValuation(inc, incPrev, bs, cf, ks, currentPrice, marketCap),
    debtAndLiquidity: calcDebtAndLiquidity(inc, bs, cf, bank),
    dividend: calcDividend(cf, inc, ks, marketCap),
    growth: calcGrowth(inc, incPrev),
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

function calcValuation(inc, incPrev, bs, cf, ks, currentPrice, marketCap) {
  const eps = inc?.eps ?? ks.eps ?? null;
  const bvps = bs?.bookValuePerShare ?? ks.bookValue ?? null;
  const revenue = inc?.revenue;
  const ebitda = inc?.ebitda;
  const cash = bs?.cash ?? 0;
  const totalDebt = bs?.totalDebt ?? 0;
  const fcf = cf?.freeCashFlow;

  const pe = round2(safeDivide(currentPrice, eps));
  const forwardPe = ks.forwardPe ?? null;
  const pb = round2(safeDivide(currentPrice, bvps));
  const ps = round2(safeDivide(marketCap, revenue));
  const ev = marketCap != null ? marketCap + totalDebt - cash : null;
  const evEbitda = round2(safeDivide(ev, ebitda));
  const fcfYield = round2(safeDivide(fcf, marketCap) != null ? safeDivide(fcf, marketCap) * 100 : null);

  // PEG: P/E divided by EPS growth rate
  let peg = null;
  if (pe != null && inc?.eps != null && incPrev?.eps != null && incPrev.eps !== 0) {
    const epsGrowth = (inc.eps - incPrev.eps) / Math.abs(incPrev.eps) * 100;
    if (epsGrowth > 0) {
      peg = round2(safeDivide(pe, epsGrowth));
    }
  }

  return { pe, forwardPe, pb, ps, evEbitda, peg, fcfYield };
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

function calcDividend(cf, inc, ks, marketCap) {
  const dividendsPaid = cf?.dividendsPaid;
  const netIncome = inc?.netIncome;

  let dividendYield = ks.dividendYield ?? null;
  if (dividendYield == null && dividendsPaid != null && marketCap != null && marketCap > 0) {
    dividendYield = round2(Math.abs(dividendsPaid) / marketCap * 100);
  }

  const payoutRatio = (dividendsPaid != null && netIncome != null && netIncome > 0)
    ? round2(Math.abs(dividendsPaid) / netIncome * 100)
    : null;

  return { dividendYield, payoutRatio };
}

function calcGrowth(inc, incPrev) {
  function yoyGrowth(current, previous) {
    if (current == null || previous == null || previous === 0) return null;
    return round2((current - previous) / Math.abs(previous) * 100);
  }

  return {
    revenueGrowthYoY: yoyGrowth(inc?.revenue, incPrev?.revenue),
    netIncomeGrowthYoY: yoyGrowth(inc?.netIncome, incPrev?.netIncome),
    epsGrowthYoY: yoyGrowth(inc?.eps, incPrev?.eps),
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
