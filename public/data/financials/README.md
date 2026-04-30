# Manual Financial Data

This folder contains manually maintained financial data for WIG20 companies.
It serves as the **second-tier fallback** when Yahoo Finance API is unavailable.

## Fallback order

1. **Yahoo Finance API** (`/api/financials`) — live data, refreshed hourly
2. **Manual JSON** (`/data/financials/{companyId}/data.json`) — this folder
3. **Hardcoded** (`src/data/wig20.js`) — last resort, may be outdated

## How to add data

1. Copy `TEMPLATE.json` into the company folder as `data.json`
2. Fill in the values following the rules below
3. Commit and deploy

## Format rules

- **All monetary values in base PLN** (e.g., 26,500,000,000 not 26,500)
- **Dates** as `"YYYY-MM-DD"` strings (e.g., `"2024-12-31"`)
- **Periods** as `"FY2024"` for annual, `"Q1 2024"` for quarterly
- **null** means "not applicable" or "not available" — do not use 0 for missing data
- Include multiple years/quarters in the arrays, most recent first

## Bank vs non-bank fields

| Field | Banks | Non-banks |
|---|---|---|
| `costOfRevenue` | null | number |
| `grossProfit` | null | number |
| `currentAssets` | null | number |
| `currentLiabilities` | null | number |
| `netInterestIncome` | number | null |
| `netFeeIncome` | number | null |
| `provisionForCreditLosses` | number | null |
| `deposits` | number | null |
| `loans` | number | null |
| `ebitda` | null | number |

## Example: Bank (PKO BP)

```json
{
  "ticker": "PKO",
  "lastUpdated": "2025-04-15",
  "incomeStatement": {
    "annual": [
      {
        "date": "2024-12-31",
        "period": "FY2024",
        "revenue": 26500000000,
        "costOfRevenue": null,
        "grossProfit": null,
        "operatingExpenses": 16300000000,
        "operatingIncome": 10200000000,
        "ebitda": null,
        "interestExpense": null,
        "netIncome": 7800000000,
        "eps": 6.24,
        "netInterestIncome": 18500000000,
        "netFeeIncome": 4200000000,
        "provisionForCreditLosses": 2100000000
      }
    ],
    "quarterly": []
  },
  "balanceSheet": {
    "annual": [
      {
        "date": "2024-12-31",
        "period": "FY2024",
        "totalAssets": 485000000000,
        "currentAssets": null,
        "cash": 45000000000,
        "totalLiabilities": 435000000000,
        "currentLiabilities": null,
        "longTermDebt": 25000000000,
        "totalDebt": 25000000000,
        "totalEquity": 50000000000,
        "bookValuePerShare": 40.0,
        "deposits": 380000000000,
        "loans": 290000000000
      }
    ],
    "quarterly": []
  },
  "cashFlow": {
    "annual": [
      {
        "date": "2024-12-31",
        "period": "FY2024",
        "operatingCashFlow": 11000000000,
        "capitalExpenditure": -1500000000,
        "freeCashFlow": 9500000000,
        "investingCashFlow": -3200000000,
        "financingCashFlow": -5000000000,
        "dividendsPaid": -3800000000
      }
    ],
    "quarterly": []
  }
}
```

## Example: Non-bank (Dino Polska)

```json
{
  "ticker": "DNP",
  "lastUpdated": "2025-04-15",
  "incomeStatement": {
    "annual": [
      {
        "date": "2024-12-31",
        "period": "FY2024",
        "revenue": 25200000000,
        "costOfRevenue": 19400000000,
        "grossProfit": 5800000000,
        "operatingExpenses": 4100000000,
        "operatingIncome": 1700000000,
        "ebitda": 2800000000,
        "interestExpense": 180000000,
        "netIncome": 1250000000,
        "eps": 12.76,
        "netInterestIncome": null,
        "netFeeIncome": null,
        "provisionForCreditLosses": null
      }
    ],
    "quarterly": []
  },
  "balanceSheet": {
    "annual": [
      {
        "date": "2024-12-31",
        "period": "FY2024",
        "totalAssets": 14200000000,
        "currentAssets": 3400000000,
        "cash": 580000000,
        "totalLiabilities": 7800000000,
        "currentLiabilities": 4200000000,
        "longTermDebt": 2800000000,
        "totalDebt": 3200000000,
        "totalEquity": 6400000000,
        "bookValuePerShare": 65.3,
        "deposits": null,
        "loans": null
      }
    ],
    "quarterly": []
  },
  "cashFlow": {
    "annual": [
      {
        "date": "2024-12-31",
        "period": "FY2024",
        "operatingCashFlow": 2500000000,
        "capitalExpenditure": -1800000000,
        "freeCashFlow": 700000000,
        "investingCashFlow": -1900000000,
        "financingCashFlow": -500000000,
        "dividendsPaid": -400000000
      }
    ],
    "quarterly": []
  }
}
```
