#!/usr/bin/env node
// CSV-to-JSON converter for StockView canonical financial data format
// Usage: node scripts/csv-to-financials.mjs --input data.csv --company pkobp --type income-annual

import { readFileSync, writeFileSync } from 'fs';

const VALID_TYPES = [
  'income-annual', 'income-quarterly',
  'balance-annual', 'balance-quarterly',
  'cashflow-annual', 'cashflow-quarterly',
];

const INCOME_FIELDS = [
  'date', 'period', 'revenue', 'costOfRevenue', 'grossProfit',
  'operatingExpenses', 'operatingIncome', 'ebitda', 'interestExpense',
  'netIncome', 'eps', 'netInterestIncome', 'netFeeIncome', 'provisionForCreditLosses',
];

const BALANCE_FIELDS = [
  'date', 'period', 'totalAssets', 'currentAssets', 'cash',
  'totalLiabilities', 'currentLiabilities', 'longTermDebt', 'totalDebt',
  'totalEquity', 'bookValuePerShare', 'deposits', 'loans',
];

const CASHFLOW_FIELDS = [
  'date', 'period', 'operatingCashFlow', 'capitalExpenditure', 'freeCashFlow',
  'investingCashFlow', 'financingCashFlow', 'dividendsPaid',
];

function getFieldsForType(type) {
  if (type.startsWith('income')) return INCOME_FIELDS;
  if (type.startsWith('balance')) return BALANCE_FIELDS;
  if (type.startsWith('cashflow')) return CASHFLOW_FIELDS;
  return [];
}

function printHelp() {
  console.log(`
CSV-to-JSON converter for StockView financial data

Usage:
  node scripts/csv-to-financials.mjs --input <file.csv> --company <id> --type <type>

Options:
  --input    Path to CSV file (required)
  --company  Company ID, e.g. pkobp, orlen, kghm (required)
  --type     Statement type (required). One of:
               income-annual, income-quarterly,
               balance-annual, balance-quarterly,
               cashflow-annual, cashflow-quarterly
  --output   Write to file instead of stdout (optional)
  --help     Show this help message

CSV format:
  - First row must be headers matching canonical field names
  - Monetary values in base PLN (not millions)
  - Empty cells become null
  - Dates must be YYYY-MM-DD format

Example CSV (income-annual):
  date,period,revenue,netIncome,operatingIncome
  2024-12-31,FY2024,26500000000,7800000000,10200000000
  2023-12-31,FY2023,24100000000,6200000000,8100000000
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--input' && argv[i + 1]) {
      args.input = argv[++i];
    } else if (arg === '--company' && argv[i + 1]) {
      args.company = argv[++i];
    } else if (arg === '--type' && argv[i + 1]) {
      args.type = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = argv[++i];
    }
  }
  return args;
}

function parseCSV(content) {
  const lines = content.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

function validateDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
}

function convertRow(raw, validFields) {
  const row = {};
  for (const field of validFields) {
    const val = raw[field];
    if (val === undefined || val === '') {
      row[field] = null;
    } else if (field === 'date') {
      if (!validateDate(val)) {
        throw new Error(`Invalid date: "${val}" — expected YYYY-MM-DD`);
      }
      row[field] = val;
    } else if (field === 'period') {
      row[field] = val;
    } else {
      const num = Number(val);
      if (isNaN(num)) {
        throw new Error(`Invalid number for ${field}: "${val}"`);
      }
      row[field] = num;
    }
  }
  return row;
}

// --- Main ---
const args = parseArgs(process.argv);

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!args.input || !args.company || !args.type) {
  console.error('Error: --input, --company, and --type are required. Use --help for usage.');
  process.exit(1);
}

if (!VALID_TYPES.includes(args.type)) {
  console.error(`Error: Invalid --type "${args.type}". Must be one of: ${VALID_TYPES.join(', ')}`);
  process.exit(1);
}

let csvContent;
try {
  csvContent = readFileSync(args.input, 'utf8');
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  process.exit(1);
}

const { headers, rows } = parseCSV(csvContent);
const validFields = getFieldsForType(args.type);

// Warn about unknown columns
const unknownCols = headers.filter(h => !validFields.includes(h));
if (unknownCols.length) {
  console.error(`Warning: ignoring unknown columns: ${unknownCols.join(', ')}`);
}

const convertedRows = rows.map((row, i) => {
  try {
    return convertRow(row, validFields);
  } catch (err) {
    console.error(`Error on row ${i + 2}: ${err.message}`);
    process.exit(1);
  }
});

// Determine which section of the canonical format this goes into
const [statementType, frequency] = args.type.split('-');
const sectionMap = { income: 'incomeStatement', balance: 'balanceSheet', cashflow: 'cashFlow' };
const section = sectionMap[statementType];

const output = {
  ticker: args.company.toUpperCase(),
  lastUpdated: new Date().toISOString().slice(0, 10),
  [section]: {
    [frequency]: convertedRows,
  },
};

const json = JSON.stringify(output, null, 2);

if (args.output) {
  writeFileSync(args.output, json + '\n', 'utf8');
  console.error(`Written to ${args.output}`);
} else {
  console.log(json);
}
