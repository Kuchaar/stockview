// Canonical financial data format for StockView
// All monetary values in BASE PLN (not millions, not thousands)
// null = not applicable for company type OR data not available
// Dates as "YYYY-MM-DD", periods as "FY2024" or "Q1 2024"

const BANK_SECTORS = ['banking', 'insurance'];

/**
 * Create an empty income statement row with all fields set to null
 */
function emptyIncomeRow() {
  return {
    date: null, period: null,
    revenue: null, costOfRevenue: null, grossProfit: null,
    operatingExpenses: null, operatingIncome: null, ebitda: null,
    interestExpense: null, netIncome: null, eps: null,
    // Bank-specific
    netInterestIncome: null, netFeeIncome: null, provisionForCreditLosses: null,
  };
}

/**
 * Create an empty balance sheet row with all fields set to null
 */
function emptyBalanceRow() {
  return {
    date: null, period: null,
    totalAssets: null, currentAssets: null, cash: null,
    totalLiabilities: null, currentLiabilities: null,
    longTermDebt: null, totalDebt: null, totalEquity: null,
    bookValuePerShare: null,
    // Bank-specific
    deposits: null, loans: null,
  };
}

/**
 * Create an empty cash flow row with all fields set to null
 */
function emptyCashFlowRow() {
  return {
    date: null, period: null,
    operatingCashFlow: null, capitalExpenditure: null, freeCashFlow: null,
    investingCashFlow: null, financingCashFlow: null, dividendsPaid: null,
  };
}

/**
 * Derive period string from date and type
 * "2024-12-31" + annual → "FY2024"
 * "2024-03-31" + quarterly → "Q1 2024"
 */
function derivePeriod(dateStr, isQuarterly) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const year = d.getFullYear();
  if (!isQuarterly) return `FY${year}`;
  const month = d.getMonth() + 1; // 1-12
  if (month <= 3) return `Q1 ${year}`;
  if (month <= 6) return `Q2 ${year}`;
  if (month <= 9) return `Q3 ${year}`;
  return `Q4 ${year}`;
}

// --- Yahoo v10 field mappings ---
// Yahoo quoteSummary uses camelCase keys; after extracting .raw values
// in transformStatements (API side), we get flat objects like:
// { date: "2024-12-31", totalRevenue: 26500000000, netIncome: 7800000000, ... }

const YAHOO_INCOME_MAP = {
  totalRevenue: 'revenue',
  costOfRevenue: 'costOfRevenue',
  grossProfit: 'grossProfit',
  totalOperatingExpenses: 'operatingExpenses',
  operatingIncome: 'operatingIncome',
  ebitda: 'ebitda',
  interestExpense: 'interestExpense',
  netIncome: 'netIncome',
  dilutedEPS: 'eps',
  // Bank-specific (Yahoo field names)
  netInterestIncome: 'netInterestIncome',
  netFeeIncome: 'netFeeIncome',
  provisionForCreditLosses: 'provisionForCreditLosses',
};

const YAHOO_BALANCE_MAP = {
  totalAssets: 'totalAssets',
  totalCurrentAssets: 'currentAssets',
  cash: 'cash',
  totalLiab: 'totalLiabilities',
  totalCurrentLiabilities: 'currentLiabilities',
  longTermDebt: 'longTermDebt',
  totalDebt: 'totalDebt',
  totalStockholderEquity: 'totalEquity',
  bookValuePerShare: 'bookValuePerShare',
  // Bank-specific
  deposits: 'deposits',
  loans: 'loans',
};

const YAHOO_CASHFLOW_MAP = {
  totalCashFromOperatingActivities: 'operatingCashFlow',
  capitalExpenditures: 'capitalExpenditure',
  freeCashFlow: 'freeCashFlow',
  totalCashflowsFromInvestingActivities: 'investingCashFlow',
  totalCashFromFinancingActivities: 'financingCashFlow',
  dividendsPaid: 'dividendsPaid',
};

function mapYahooRow(raw, fieldMap, emptyFn, isQuarterly) {
  const row = emptyFn();
  row.date = raw.date || null;
  row.period = raw.period || derivePeriod(row.date, isQuarterly);

  for (const [yahooKey, canonKey] of Object.entries(fieldMap)) {
    if (raw[yahooKey] != null) {
      row[canonKey] = raw[yahooKey];
    }
  }
  return row;
}

function mapYahooStatements(statements, fieldMap, emptyFn, isQuarterly) {
  if (!Array.isArray(statements)) return [];
  return statements.map(s => mapYahooRow(s, fieldMap, emptyFn, isQuarterly));
}

// --- Hardcoded wig20.js mapping ---
// wig20.js values are in millions — multiply by 1_000_000

function mapHardcodedAnnualIncome(fin) {
  if (!fin?.annual?.years) return [];
  const { years, revenue, netIncome, ebitda, operatingIncome } = fin.annual;
  return years.map((year, i) => {
    const row = emptyIncomeRow();
    row.date = `${year.replace('E', '')}-12-31`;
    row.period = `FY${year.replace('E', '')}`;
    row.revenue = revenue?.[i] != null ? revenue[i] * 1_000_000 : null;
    row.netIncome = netIncome?.[i] != null ? netIncome[i] * 1_000_000 : null;
    row.ebitda = ebitda?.[i] != null ? ebitda[i] * 1_000_000 : null;
    row.operatingIncome = operatingIncome?.[i] != null ? operatingIncome[i] * 1_000_000 : null;
    return row;
  });
}

function mapHardcodedQuarterlyIncome(fin) {
  if (!fin?.quarterly?.quarters) return [];
  const { quarters, revenue, netIncome } = fin.quarterly;
  return quarters.map((q, i) => {
    const row = emptyIncomeRow();
    // "Q1 24" → "Q1 2024", date → "2024-03-31"
    const match = q.match(/Q(\d)\s+(\d{2,4})E?/);
    if (match) {
      const qNum = parseInt(match[1]);
      const year = match[2].length === 2 ? `20${match[2]}` : match[2];
      const monthEnd = [null, '03-31', '06-30', '09-30', '12-31'][qNum];
      row.date = `${year}-${monthEnd}`;
      row.period = `Q${qNum} ${year}`;
    }
    row.revenue = revenue?.[i] != null ? revenue[i] * 1_000_000 : null;
    row.netIncome = netIncome?.[i] != null ? netIncome[i] * 1_000_000 : null;
    return row;
  });
}

function mapHardcodedAnnualBalance(fin) {
  if (!fin?.annual?.years) return [];
  const { years, totalAssets, totalDebt, equity } = fin.annual;
  return years.map((year, i) => {
    const row = emptyBalanceRow();
    row.date = `${year.replace('E', '')}-12-31`;
    row.period = `FY${year.replace('E', '')}`;
    row.totalAssets = totalAssets?.[i] != null ? totalAssets[i] * 1_000_000 : null;
    row.totalDebt = totalDebt?.[i] != null ? totalDebt[i] * 1_000_000 : null;
    row.totalEquity = equity?.[i] != null ? equity[i] * 1_000_000 : null;
    return row;
  });
}

function mapHardcodedAnnualCashFlow(fin) {
  if (!fin?.annual?.years) return [];
  const { years, freeCashFlow } = fin.annual;
  return years.map((year, i) => {
    const row = emptyCashFlowRow();
    row.date = `${year.replace('E', '')}-12-31`;
    row.period = `FY${year.replace('E', '')}`;
    row.freeCashFlow = freeCashFlow?.[i] != null ? freeCashFlow[i] * 1_000_000 : null;
    return row;
  });
}

/**
 * Normalize financial data from any source to canonical format.
 *
 * @param {object} rawData - Raw data from one of the 3 sources
 * @param {'yahoo'|'manual'|'hardcoded'} source
 * @param {object} [meta] - Optional: { ticker, companyId }
 * @returns {object} Canonical financial data object
 */
export function normalizeFinancials(rawData, source, meta = {}) {
  if (source === 'yahoo') {
    return normalizeYahoo(rawData, meta);
  }
  if (source === 'manual') {
    return normalizeManual(rawData, meta);
  }
  if (source === 'hardcoded') {
    return normalizeHardcoded(rawData, meta);
  }
  throw new Error(`Unknown source: ${source}`);
}

function normalizeYahoo(data, meta) {
  const inc = data.incomeStatement || {};
  const bs = data.balanceSheet || {};
  const cf = data.cashFlow || {};

  return {
    ticker: meta.ticker || data.symbol?.replace(/\.WA$/, '') || null,
    lastUpdated: new Date().toISOString().slice(0, 10),
    source: 'yahoo',
    incomeStatement: {
      annual: mapYahooStatements(inc.annual, YAHOO_INCOME_MAP, emptyIncomeRow, false),
      quarterly: mapYahooStatements(inc.quarterly, YAHOO_INCOME_MAP, emptyIncomeRow, true),
    },
    balanceSheet: {
      annual: mapYahooStatements(bs.annual, YAHOO_BALANCE_MAP, emptyBalanceRow, false),
      quarterly: mapYahooStatements(bs.quarterly, YAHOO_BALANCE_MAP, emptyBalanceRow, true),
    },
    cashFlow: {
      annual: mapYahooStatements(cf.annual, YAHOO_CASHFLOW_MAP, emptyCashFlowRow, false),
      quarterly: mapYahooStatements(cf.quarterly, YAHOO_CASHFLOW_MAP, emptyCashFlowRow, true),
    },
    keyStats: data.keyStats || null,
  };
}

function normalizeManual(data, meta) {
  // Manual JSON is expected to already be in canonical format
  // Fill missing fields with null
  const fill = (rows, emptyFn) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({ ...emptyFn(), ...r }));
  };

  const inc = data.incomeStatement || {};
  const bs = data.balanceSheet || {};
  const cf = data.cashFlow || {};

  return {
    ticker: data.ticker || meta.ticker || null,
    lastUpdated: data.lastUpdated || new Date().toISOString().slice(0, 10),
    source: 'manual',
    incomeStatement: {
      annual: fill(inc.annual, emptyIncomeRow),
      quarterly: fill(inc.quarterly, emptyIncomeRow),
    },
    balanceSheet: {
      annual: fill(bs.annual, emptyBalanceRow),
      quarterly: fill(bs.quarterly, emptyBalanceRow),
    },
    cashFlow: {
      annual: fill(cf.annual, emptyCashFlowRow),
      quarterly: fill(cf.quarterly, emptyCashFlowRow),
    },
    keyStats: data.keyStats || null,
  };
}

function normalizeHardcoded(companyData, meta) {
  const fin = companyData.financials || {};
  const ratios = companyData.ratios || {};

  return {
    ticker: companyData.ticker || meta.ticker || null,
    lastUpdated: new Date().toISOString().slice(0, 10),
    source: 'hardcoded',
    incomeStatement: {
      annual: mapHardcodedAnnualIncome(fin),
      quarterly: mapHardcodedQuarterlyIncome(fin),
    },
    balanceSheet: {
      annual: mapHardcodedAnnualBalance(fin),
      quarterly: [],
    },
    cashFlow: {
      annual: mapHardcodedAnnualCashFlow(fin),
      quarterly: [],
    },
    keyStats: {
      pe: ratios.pe ?? null,
      forwardPe: null,
      pb: ratios.pb ?? null,
      evEbitda: ratios.evEbitda ?? null,
      roe: ratios.roe ?? null,
      roa: ratios.roa ?? null,
      currentRatio: ratios.currentRatio ?? null,
      quickRatio: ratios.quickRatio ?? null,
      debtToEquity: ratios.debtToEquity ?? null,
      dividendYield: ratios.dividendYield ?? null,
      eps: ratios.eps ?? null,
      bookValue: ratios.bookValue ?? null,
      grossMargin: ratios.grossMargin ?? null,
      operatingMargin: ratios.operatingMargin ?? null,
      netMargin: ratios.netMargin ?? null,
      marketCap: companyData.marketCap ? companyData.marketCap * 1_000_000 : null,
      totalRevenue: null,
      revenueGrowth: null,
    },
  };
}

export { derivePeriod };
