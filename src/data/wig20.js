// WIG20 Companies Data — hardcoded values serve as fallback
// Live data fetched from Yahoo Finance via /api/quote and /api/financials
// Financial data approximate as of late 2024 / early 2025

// Yahoo Finance symbol mapping for GPW (Warsaw Stock Exchange)
export const TICKER_TO_YAHOO = {
  PKO: 'PKO.WA',
  PKN: 'PKN.WA',
  KGH: 'KGH.WA',
  PZU: 'PZU.WA',
  PEO: 'PEO.WA',
  CDR: 'CDR.WA',
  ALE: 'ALE.WA',
  DNP: 'DNP.WA',
  LPP: 'LPP.WA',
  CPS: 'CPS.WA',
  MBK: 'MBK.WA',
  JSW: 'JSW.WA',
  PGE: 'PGE.WA',
  KRU: 'KRU.WA',
  CCC: 'CCC.WA',
  PCO: 'PCO.WA',
  ACP: 'ACP.WA',
  OPL: 'OPL.WA',
  ALR: 'ALR.WA',
  KTY: 'KTY.WA',
};

export const sectors = {
  pl: {
    banking: 'Bankowość',
    energy: 'Energetyka',
    mining: 'Górnictwo',
    insurance: 'Ubezpieczenia',
    gaming: 'Gry',
    ecommerce: 'E-commerce',
    retail: 'Handel detaliczny',
    telecom: 'Telekomunikacja',
    it: 'IT',
    industrial: 'Przemysł',
    finance: 'Finanse',
  },
  en: {
    banking: 'Banking',
    energy: 'Energy',
    mining: 'Mining',
    insurance: 'Insurance',
    gaming: 'Gaming',
    ecommerce: 'E-commerce',
    retail: 'Retail',
    telecom: 'Telecom',
    it: 'IT',
    industrial: 'Industrial',
    finance: 'Finance',
  },
};

export const wig20Companies = [
  {
    id: 'pkobp',
    ticker: 'PKO',
    tvSymbol: 'GPW:PKO',
    yahooSymbol: 'PKO.WA',
    name: 'PKO Bank Polski',
    shortName: 'PKO BP',
    sector: 'banking',
    logo: '🏦',
    price: 57.80,
    change: 1.42,
    changePercent: 2.52,
    volume: 4820000,
    marketCap: 72250,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [14200, 19800, 24100, 26500],
        netIncome: [4874, 3300, 6200, 7800],
        ebitda: [null, null, null, null],
        operatingIncome: [6100, 4200, 8100, 10200],
        totalAssets: [418000, 431000, 460000, 485000],
        totalDebt: [24000, 28000, 26000, 25000],
        equity: [40200, 37000, 44000, 50000],
        freeCashFlow: [8200, -2100, 9500, 11000],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [6400, 6700, 6800, 6600],
        netIncome: [1900, 2100, 2000, 1800],
      },
    },
    ratios: {
      pe: 9.3,
      pb: 1.45,
      evEbitda: null,
      roe: 17.2,
      roa: 1.6,
      currentRatio: null,
      quickRatio: null,
      debtToEquity: 0.50,
      dividendYield: 5.8,
      eps: 6.24,
      bookValue: 40.0,
      grossMargin: null,
      operatingMargin: 38.5,
      netMargin: 29.4,
    },
  },
  {
    id: 'orlen',
    ticker: 'PKN',
    tvSymbol: 'GPW:PKN',
    yahooSymbol: 'PKN.WA',
    name: 'ORLEN S.A.',
    shortName: 'Orlen',
    sector: 'energy',
    logo: '⛽',
    price: 61.20,
    change: -0.85,
    changePercent: -1.37,
    volume: 3150000,
    marketCap: 71400,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [131300, 232800, 276000, 258000],
        netIncome: [10500, 22200, 8100, 5900],
        ebitda: [18200, 34500, 22600, 18800],
        operatingIncome: [10600, 25000, 11200, 8500],
        totalAssets: [98000, 210000, 230000, 225000],
        totalDebt: [28000, 55000, 62000, 58000],
        equity: [48000, 105000, 110000, 112000],
        freeCashFlow: [8500, 16000, 5200, 7800],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [68000, 66000, 64000, 60000],
        netIncome: [1800, 1600, 1400, 1100],
      },
    },
    ratios: {
      pe: 12.1,
      pb: 0.64,
      evEbitda: 6.8,
      roe: 5.3,
      roa: 2.6,
      currentRatio: 1.15,
      quickRatio: 0.78,
      debtToEquity: 0.52,
      dividendYield: 6.2,
      eps: 5.06,
      bookValue: 95.7,
      grossMargin: 12.8,
      operatingMargin: 3.3,
      netMargin: 2.3,
    },
  },
  {
    id: 'kghm',
    ticker: 'KGH',
    tvSymbol: 'GPW:KGH',
    yahooSymbol: 'KGH.WA',
    name: 'KGHM Polska Miedź',
    shortName: 'KGHM',
    sector: 'mining',
    logo: '⛏️',
    price: 142.50,
    change: 3.20,
    changePercent: 2.30,
    volume: 1200000,
    marketCap: 28500,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [29800, 32400, 29500, 33200],
        netIncome: [5600, 4200, 1300, 2800],
        ebitda: [11200, 9800, 5800, 8200],
        operatingIncome: [7200, 5800, 1900, 4200],
        totalAssets: [48000, 51000, 52000, 54000],
        totalDebt: [8500, 10000, 12000, 11500],
        equity: [28000, 30000, 29500, 31000],
        freeCashFlow: [4200, 1800, -1200, 2500],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [7800, 8500, 8800, 8100],
        netIncome: [500, 800, 900, 600],
      },
    },
    ratios: {
      pe: 10.2,
      pb: 0.92,
      evEbitda: 4.9,
      roe: 9.0,
      roa: 5.2,
      currentRatio: 1.62,
      quickRatio: 0.95,
      debtToEquity: 0.37,
      dividendYield: 2.1,
      eps: 14.0,
      bookValue: 155.0,
      grossMargin: 22.5,
      operatingMargin: 12.7,
      netMargin: 8.4,
    },
  },
  {
    id: 'pzu',
    ticker: 'PZU',
    tvSymbol: 'GPW:PZU',
    yahooSymbol: 'PZU.WA',
    name: 'PZU S.A.',
    shortName: 'PZU',
    sector: 'insurance',
    logo: '🛡️',
    price: 48.90,
    change: 0.65,
    changePercent: 1.35,
    volume: 2400000,
    marketCap: 42200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [24100, 25800, 28500, 30200],
        netIncome: [3200, 3000, 4600, 5100],
        ebitda: [null, null, null, null],
        operatingIncome: [4100, 3800, 5900, 6500],
        totalAssets: [410000, 420000, 435000, 450000],
        totalDebt: [5000, 5500, 5200, 5000],
        equity: [18500, 17800, 20500, 23000],
        freeCashFlow: [3800, 2500, 4800, 5500],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [7400, 7600, 7800, 7400],
        netIncome: [1300, 1350, 1300, 1150],
      },
    },
    ratios: {
      pe: 8.3,
      pb: 1.83,
      evEbitda: null,
      roe: 22.2,
      roa: 1.1,
      currentRatio: null,
      quickRatio: null,
      debtToEquity: 0.22,
      dividendYield: 7.1,
      eps: 5.90,
      bookValue: 26.7,
      grossMargin: null,
      operatingMargin: 21.5,
      netMargin: 16.9,
    },
  },
  {
    id: 'pekao',
    ticker: 'PEO',
    tvSymbol: 'GPW:PEO',
    yahooSymbol: 'PEO.WA',
    name: 'Bank Pekao',
    shortName: 'Pekao',
    sector: 'banking',
    logo: '🏦',
    price: 168.40,
    change: 2.10,
    changePercent: 1.26,
    volume: 680000,
    marketCap: 44200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [8500, 11200, 15200, 16500],
        netIncome: [2100, 3000, 5200, 5800],
        ebitda: [null, null, null, null],
        operatingIncome: [2800, 3900, 6800, 7500],
        totalAssets: [250000, 260000, 275000, 285000],
        totalDebt: [14000, 15000, 14500, 14000],
        equity: [26500, 27000, 30000, 33000],
        freeCashFlow: [4500, 2800, 6200, 7000],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [4100, 4200, 4200, 4000],
        netIncome: [1500, 1550, 1500, 1250],
      },
    },
    ratios: {
      pe: 7.6,
      pb: 1.34,
      evEbitda: null,
      roe: 19.3,
      roa: 2.0,
      currentRatio: null,
      quickRatio: null,
      debtToEquity: 0.42,
      dividendYield: 8.5,
      eps: 22.15,
      bookValue: 125.7,
      grossMargin: null,
      operatingMargin: 45.5,
      netMargin: 35.2,
    },
  },
  {
    id: 'cdprojekt',
    ticker: 'CDR',
    tvSymbol: 'GPW:CDR',
    yahooSymbol: 'CDR.WA',
    name: 'CD Projekt',
    shortName: 'CD Projekt',
    sector: 'gaming',
    logo: '🎮',
    price: 198.50,
    change: -4.20,
    changePercent: -2.07,
    volume: 920000,
    marketCap: 19800,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [888, 790, 1170, 680],
        netIncome: [226, 150, 520, 180],
        ebitda: [400, 310, 720, 350],
        operatingIncome: [280, 180, 610, 220],
        totalAssets: [3200, 3400, 3800, 3500],
        totalDebt: [50, 40, 35, 30],
        equity: [2800, 2900, 3300, 3200],
        freeCashFlow: [350, 200, 580, 120],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [140, 150, 180, 210],
        netIncome: [30, 35, 55, 60],
      },
    },
    ratios: {
      pe: 110.0,
      pb: 6.19,
      evEbitda: 56.6,
      roe: 5.6,
      roa: 5.1,
      currentRatio: 4.20,
      quickRatio: 3.80,
      debtToEquity: 0.01,
      dividendYield: 0.5,
      eps: 1.80,
      bookValue: 32.1,
      grossMargin: 72.0,
      operatingMargin: 32.4,
      netMargin: 26.5,
    },
  },
  {
    id: 'allegro',
    ticker: 'ALE',
    tvSymbol: 'GPW:ALE',
    yahooSymbol: 'ALE.WA',
    name: 'Allegro.eu',
    shortName: 'Allegro',
    sector: 'ecommerce',
    logo: '🛒',
    price: 33.40,
    change: 0.55,
    changePercent: 1.67,
    volume: 3800000,
    marketCap: 36200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [4800, 6200, 8100, 9500],
        netIncome: [1200, 350, 620, 1100],
        ebitda: [2600, 2100, 3200, 3800],
        operatingIncome: [1900, 1200, 1800, 2400],
        totalAssets: [22000, 24000, 25000, 26000],
        totalDebt: [9500, 10000, 9000, 8000],
        equity: [5000, 4500, 5200, 6000],
        freeCashFlow: [1800, 800, 1500, 2200],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [2100, 2200, 2400, 2800],
        netIncome: [200, 250, 300, 350],
      },
    },
    ratios: {
      pe: 32.9,
      pb: 6.03,
      evEbitda: 11.6,
      roe: 18.3,
      roa: 4.2,
      currentRatio: 0.65,
      quickRatio: 0.60,
      debtToEquity: 1.33,
      dividendYield: 0.0,
      eps: 1.02,
      bookValue: 5.54,
      grossMargin: 62.5,
      operatingMargin: 25.3,
      netMargin: 11.6,
    },
  },
  {
    id: 'dino',
    ticker: 'DNP',
    tvSymbol: 'GPW:DNP',
    yahooSymbol: 'DNP.WA',
    name: 'Dino Polska',
    shortName: 'Dino',
    sector: 'retail',
    logo: '🦕',
    price: 430.00,
    change: -5.50,
    changePercent: -1.26,
    volume: 180000,
    marketCap: 42200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [15600, 21200, 25100, 28000],
        netIncome: [1200, 1650, 2100, 2400],
        ebitda: [2400, 3200, 4000, 4600],
        operatingIncome: [1600, 2200, 2800, 3200],
        totalAssets: [11000, 14000, 16500, 19000],
        totalDebt: [3800, 4500, 5200, 5800],
        equity: [4200, 5600, 7200, 9000],
        freeCashFlow: [200, -400, 600, 900],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [6200, 6800, 7200, 7800],
        netIncome: [450, 600, 700, 650],
      },
    },
    ratios: {
      pe: 17.6,
      pb: 4.69,
      evEbitda: 10.4,
      roe: 26.7,
      roa: 12.6,
      currentRatio: 0.82,
      quickRatio: 0.25,
      debtToEquity: 0.64,
      dividendYield: 0.0,
      eps: 24.43,
      bookValue: 91.7,
      grossMargin: 24.8,
      operatingMargin: 11.4,
      netMargin: 8.6,
    },
  },
  {
    id: 'lpp',
    ticker: 'LPP',
    tvSymbol: 'GPW:LPP',
    yahooSymbol: 'LPP.WA',
    name: 'LPP S.A.',
    shortName: 'LPP',
    sector: 'retail',
    logo: '👗',
    price: 14200.00,
    change: 180.00,
    changePercent: 1.28,
    volume: 12000,
    marketCap: 25800,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [13900, 16200, 17400, 19500],
        netIncome: [1050, 700, 1650, 2000],
        ebitda: [3200, 3000, 4400, 5000],
        operatingIncome: [1600, 1000, 2200, 2800],
        totalAssets: [15000, 16500, 18000, 19500],
        totalDebt: [6500, 7000, 7200, 7000],
        equity: [4200, 4500, 5800, 7200],
        freeCashFlow: [1200, 400, 1800, 2200],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [4200, 4600, 4800, 5900],
        netIncome: [320, 450, 500, 730],
      },
    },
    ratios: {
      pe: 12.9,
      pb: 3.58,
      evEbitda: 6.6,
      roe: 27.8,
      roa: 10.3,
      currentRatio: 1.10,
      quickRatio: 0.45,
      debtToEquity: 0.97,
      dividendYield: 2.8,
      eps: 1100.0,
      bookValue: 3967.0,
      grossMargin: 57.2,
      operatingMargin: 14.4,
      netMargin: 10.3,
    },
  },
  {
    id: 'cyfrplsat',
    ticker: 'CPS',
    tvSymbol: 'GPW:CPS',
    yahooSymbol: 'CPS.WA',
    name: 'Cyfrowy Polsat',
    shortName: 'Cyfrowy Polsat',
    sector: 'telecom',
    logo: '📡',
    price: 14.10,
    change: -0.12,
    changePercent: -0.84,
    volume: 5200000,
    marketCap: 9000,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [12400, 13100, 13600, 13200],
        netIncome: [1800, 1300, 950, 700],
        ebitda: [5100, 5200, 5000, 4600],
        operatingIncome: [2400, 2100, 1800, 1400],
        totalAssets: [38000, 39000, 38500, 37000],
        totalDebt: [15000, 15500, 15200, 14500],
        equity: [12500, 12800, 13000, 12800],
        freeCashFlow: [2200, 1500, 1000, 800],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [3200, 3300, 3400, 3300],
        netIncome: [200, 180, 180, 140],
      },
    },
    ratios: {
      pe: 12.9,
      pb: 0.70,
      evEbitda: 5.0,
      roe: 5.5,
      roa: 1.9,
      currentRatio: 0.85,
      quickRatio: 0.72,
      debtToEquity: 1.13,
      dividendYield: 0.0,
      eps: 1.09,
      bookValue: 20.1,
      grossMargin: 48.5,
      operatingMargin: 10.6,
      netMargin: 5.3,
    },
  },
  {
    id: 'mbank',
    ticker: 'MBK',
    tvSymbol: 'GPW:MBK',
    yahooSymbol: 'MBK.WA',
    name: 'mBank S.A.',
    shortName: 'mBank',
    sector: 'banking',
    logo: '🏦',
    price: 608.00,
    change: 8.50,
    changePercent: 1.42,
    volume: 120000,
    marketCap: 25800,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [5600, 7200, 10200, 11000],
        netIncome: [82, -700, 1600, 2400],
        ebitda: [null, null, null, null],
        operatingIncome: [300, -500, 2200, 3200],
        totalAssets: [199000, 210000, 220000, 230000],
        totalDebt: [12000, 13000, 12500, 12000],
        equity: [14500, 13000, 15000, 17000],
        freeCashFlow: [3200, -1500, 4800, 5500],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [2800, 2800, 2750, 2650],
        netIncome: [650, 680, 600, 470],
      },
    },
    ratios: {
      pe: 10.8,
      pb: 1.52,
      evEbitda: null,
      roe: 14.1,
      roa: 1.0,
      currentRatio: null,
      quickRatio: null,
      debtToEquity: 0.71,
      dividendYield: 0.0,
      eps: 56.3,
      bookValue: 400.0,
      grossMargin: null,
      operatingMargin: 29.1,
      netMargin: 21.8,
    },
  },
  {
    id: 'jsw',
    ticker: 'JSW',
    tvSymbol: 'GPW:JSW',
    yahooSymbol: 'JSW.WA',
    name: 'Jastrzębska Spółka Węglowa',
    shortName: 'JSW',
    sector: 'mining',
    logo: '⛏️',
    price: 22.80,
    change: -0.95,
    changePercent: -4.00,
    volume: 3600000,
    marketCap: 2680,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [10200, 18500, 11200, 8500],
        netIncome: [2100, 6200, 700, -400],
        ebitda: [3800, 9500, 2000, 500],
        operatingIncome: [2500, 7800, 800, -200],
        totalAssets: [15000, 19000, 17500, 16000],
        totalDebt: [1800, 1500, 1600, 2000],
        equity: [9500, 14500, 13500, 12500],
        freeCashFlow: [1500, 5000, -500, -1200],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [2200, 2100, 2100, 2100],
        netIncome: [-80, -120, -100, -100],
      },
    },
    ratios: {
      pe: null,
      pb: 0.21,
      evEbitda: 5.4,
      roe: -3.2,
      roa: -2.5,
      currentRatio: 1.45,
      quickRatio: 0.98,
      debtToEquity: 0.16,
      dividendYield: 0.0,
      eps: -3.40,
      bookValue: 106.4,
      grossMargin: 4.2,
      operatingMargin: -2.4,
      netMargin: -4.7,
    },
  },
  {
    id: 'pge',
    ticker: 'PGE',
    tvSymbol: 'GPW:PGE',
    yahooSymbol: 'PGE.WA',
    name: 'PGE Polska Grupa Energetyczna',
    shortName: 'PGE',
    sector: 'energy',
    logo: '⚡',
    price: 7.45,
    change: 0.08,
    changePercent: 1.09,
    volume: 12000000,
    marketCap: 14200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [38000, 52000, 48000, 42000],
        netIncome: [3800, 3200, 1200, 1800],
        ebitda: [8500, 10200, 6500, 7200],
        operatingIncome: [4500, 5800, 2200, 3000],
        totalAssets: [78000, 85000, 88000, 90000],
        totalDebt: [18000, 20000, 22000, 21000],
        equity: [38000, 40000, 40500, 41500],
        freeCashFlow: [1200, -2000, -3500, 500],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [11000, 10200, 10500, 10300],
        netIncome: [600, 500, 400, 300],
      },
    },
    ratios: {
      pe: 7.9,
      pb: 0.34,
      evEbitda: 4.9,
      roe: 4.3,
      roa: 2.0,
      currentRatio: 1.05,
      quickRatio: 0.82,
      debtToEquity: 0.51,
      dividendYield: 3.5,
      eps: 0.94,
      bookValue: 21.8,
      grossMargin: 18.2,
      operatingMargin: 7.1,
      netMargin: 4.3,
    },
  },
  {
    id: 'kruk',
    ticker: 'KRU',
    tvSymbol: 'GPW:KRU',
    yahooSymbol: 'KRU.WA',
    name: 'KRUK S.A.',
    shortName: 'Kruk',
    sector: 'finance',
    logo: '📊',
    price: 482.00,
    change: 7.80,
    changePercent: 1.64,
    volume: 95000,
    marketCap: 9200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [1600, 2100, 2800, 3200],
        netIncome: [620, 850, 1200, 1400],
        ebitda: [1100, 1500, 2100, 2500],
        operatingIncome: [800, 1100, 1600, 1900],
        totalAssets: [9500, 12000, 14500, 16500],
        totalDebt: [5500, 7000, 8500, 9500],
        equity: [3200, 3800, 4600, 5400],
        freeCashFlow: [-800, -1200, -1500, -1000],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [750, 800, 830, 820],
        netIncome: [330, 360, 380, 330],
      },
    },
    ratios: {
      pe: 6.6,
      pb: 1.70,
      evEbitda: 7.5,
      roe: 25.9,
      roa: 8.5,
      currentRatio: 1.85,
      quickRatio: 1.85,
      debtToEquity: 1.76,
      dividendYield: 2.5,
      eps: 73.1,
      bookValue: 283.5,
      grossMargin: 82.0,
      operatingMargin: 59.4,
      netMargin: 43.8,
    },
  },
  {
    id: 'ccc',
    ticker: 'CCC',
    tvSymbol: 'GPW:CCC',
    yahooSymbol: 'CCC.WA',
    name: 'CCC S.A.',
    shortName: 'CCC',
    sector: 'retail',
    logo: '👟',
    price: 187.00,
    change: 2.40,
    changePercent: 1.30,
    volume: 350000,
    marketCap: 10200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [7400, 8600, 9200, 10100],
        netIncome: [-280, -650, -200, 350],
        ebitda: [1200, 800, 1400, 1800],
        operatingIncome: [200, -200, 400, 800],
        totalAssets: [10500, 11000, 11500, 12000],
        totalDebt: [5000, 5500, 5200, 4800],
        equity: [2500, 1800, 1700, 2000],
        freeCashFlow: [-400, -800, 200, 600],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [2200, 2400, 2500, 3000],
        netIncome: [10, 80, 100, 160],
      },
    },
    ratios: {
      pe: 29.1,
      pb: 5.10,
      evEbitda: 8.3,
      roe: 17.5,
      roa: 2.9,
      currentRatio: 1.12,
      quickRatio: 0.45,
      debtToEquity: 2.40,
      dividendYield: 0.0,
      eps: 6.42,
      bookValue: 36.7,
      grossMargin: 52.5,
      operatingMargin: 7.9,
      netMargin: 3.5,
    },
  },
  {
    id: 'pepco',
    ticker: 'PCO',
    tvSymbol: 'GPW:PCO',
    yahooSymbol: 'PCO.WA',
    name: 'Pepco Group',
    shortName: 'Pepco',
    sector: 'retail',
    logo: '🏪',
    price: 18.60,
    change: -0.30,
    changePercent: -1.59,
    volume: 1800000,
    marketCap: 8200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [15200, 18400, 20800, 22000],
        netIncome: [400, 500, 100, 350],
        ebitda: [2200, 2600, 2400, 2800],
        operatingIncome: [800, 900, 400, 700],
        totalAssets: [14000, 15500, 16000, 16500],
        totalDebt: [6000, 6500, 7000, 6800],
        equity: [3500, 3800, 3600, 3800],
        freeCashFlow: [500, 200, -300, 400],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [5000, 5200, 5500, 6300],
        netIncome: [50, 80, 100, 120],
      },
    },
    ratios: {
      pe: 23.4,
      pb: 2.16,
      evEbitda: 5.4,
      roe: 9.2,
      roa: 2.1,
      currentRatio: 1.05,
      quickRatio: 0.38,
      debtToEquity: 1.79,
      dividendYield: 0.0,
      eps: 0.79,
      bookValue: 8.61,
      grossMargin: 42.0,
      operatingMargin: 3.2,
      netMargin: 1.6,
    },
  },
  {
    id: 'assecopol',
    ticker: 'ACP',
    tvSymbol: 'GPW:ACP',
    yahooSymbol: 'ACP.WA',
    name: 'Asseco Poland',
    shortName: 'Asseco',
    sector: 'it',
    logo: '💻',
    price: 87.50,
    change: 0.90,
    changePercent: 1.04,
    volume: 180000,
    marketCap: 7200,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [14200, 15800, 16500, 17200],
        netIncome: [520, 580, 620, 680],
        ebitda: [2000, 2200, 2400, 2600],
        operatingIncome: [1000, 1100, 1200, 1350],
        totalAssets: [18000, 19000, 19500, 20000],
        totalDebt: [3500, 3800, 3600, 3400],
        equity: [9500, 10000, 10400, 10800],
        freeCashFlow: [900, 1000, 1100, 1200],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [4100, 4200, 4300, 4600],
        netIncome: [150, 160, 170, 200],
      },
    },
    ratios: {
      pe: 10.6,
      pb: 0.69,
      evEbitda: 4.0,
      roe: 6.3,
      roa: 3.4,
      currentRatio: 1.45,
      quickRatio: 1.30,
      debtToEquity: 0.31,
      dividendYield: 4.2,
      eps: 8.25,
      bookValue: 126.8,
      grossMargin: 24.0,
      operatingMargin: 7.8,
      netMargin: 4.0,
    },
  },
  {
    id: 'orangepl',
    ticker: 'OPL',
    tvSymbol: 'GPW:OPL',
    yahooSymbol: 'OPL.WA',
    name: 'Orange Polska',
    shortName: 'Orange PL',
    sector: 'telecom',
    logo: '📱',
    price: 8.25,
    change: 0.05,
    changePercent: 0.61,
    volume: 4500000,
    marketCap: 10800,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [11900, 12400, 12900, 13200],
        netIncome: [800, 550, 750, 900],
        ebitda: [3800, 4000, 4200, 4500],
        operatingIncome: [1400, 1500, 1700, 1900],
        totalAssets: [22000, 22500, 23000, 23500],
        totalDebt: [4500, 4200, 3900, 3600],
        equity: [10500, 10800, 11200, 11800],
        freeCashFlow: [1200, 1300, 1400, 1600],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [3200, 3300, 3300, 3400],
        netIncome: [200, 220, 240, 240],
      },
    },
    ratios: {
      pe: 12.0,
      pb: 0.92,
      evEbitda: 3.2,
      roe: 7.6,
      roa: 3.8,
      currentRatio: 0.75,
      quickRatio: 0.68,
      debtToEquity: 0.31,
      dividendYield: 4.8,
      eps: 0.69,
      bookValue: 8.98,
      grossMargin: 68.0,
      operatingMargin: 14.4,
      netMargin: 6.8,
    },
  },
  {
    id: 'alior',
    ticker: 'ALR',
    tvSymbol: 'GPW:ALR',
    yahooSymbol: 'ALR.WA',
    name: 'Alior Bank',
    shortName: 'Alior',
    sector: 'banking',
    logo: '🏦',
    price: 92.40,
    change: 1.20,
    changePercent: 1.32,
    volume: 420000,
    marketCap: 7600,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [3200, 4500, 6100, 6500],
        netIncome: [350, 720, 1500, 1700],
        ebitda: [null, null, null, null],
        operatingIncome: [500, 1000, 2000, 2200],
        totalAssets: [82000, 88000, 92000, 96000],
        totalDebt: [5500, 6000, 5800, 5500],
        equity: [6500, 7000, 8200, 9500],
        freeCashFlow: [2000, 1200, 3500, 4000],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [1650, 1650, 1650, 1550],
        netIncome: [450, 460, 440, 350],
      },
    },
    ratios: {
      pe: 4.5,
      pb: 0.80,
      evEbitda: null,
      roe: 17.9,
      roa: 1.8,
      currentRatio: null,
      quickRatio: null,
      debtToEquity: 0.58,
      dividendYield: 7.5,
      eps: 20.5,
      bookValue: 115.5,
      grossMargin: null,
      operatingMargin: 33.8,
      netMargin: 26.2,
    },
  },
  {
    id: 'kety',
    ticker: 'KTY',
    tvSymbol: 'GPW:KTY',
    yahooSymbol: 'KTY.WA',
    name: 'Grupa Kęty',
    shortName: 'Kęty',
    sector: 'industrial',
    logo: '🏭',
    price: 680.00,
    change: 5.00,
    changePercent: 0.74,
    volume: 25000,
    marketCap: 6500,
    financials: {
      annual: {
        years: ['2021', '2022', '2023', '2024E'],
        revenue: [4600, 5400, 5100, 5300],
        netIncome: [650, 720, 600, 650],
        ebitda: [1000, 1100, 950, 1050],
        operatingIncome: [800, 880, 750, 820],
        totalAssets: [5200, 5600, 5800, 6000],
        totalDebt: [800, 900, 850, 800],
        equity: [3200, 3500, 3700, 3900],
        freeCashFlow: [500, 550, 480, 520],
      },
      quarterly: {
        quarters: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24E'],
        revenue: [1250, 1350, 1350, 1350],
        netIncome: [150, 170, 175, 155],
      },
    },
    ratios: {
      pe: 10.0,
      pb: 1.67,
      evEbitda: 6.9,
      roe: 16.7,
      roa: 10.8,
      currentRatio: 2.10,
      quickRatio: 1.45,
      debtToEquity: 0.21,
      dividendYield: 5.5,
      eps: 68.0,
      bookValue: 407.3,
      grossMargin: 28.5,
      operatingMargin: 15.5,
      netMargin: 12.3,
    },
  },
];

// Health score calculation
export function calculateHealthScore(ratios) {
  let score = 0;
  let maxScore = 0;

  const check = (val, thresholds, weight = 1) => {
    if (val === null || val === undefined) return;
    maxScore += weight * 100;
    const [excellent, good, fair] = thresholds;
    if (typeof excellent === 'object' && excellent.type === 'lower') {
      if (val <= excellent.val) score += weight * 100;
      else if (val <= good.val) score += weight * 75;
      else if (val <= fair.val) score += weight * 50;
      else score += weight * 25;
    } else {
      if (val >= excellent) score += weight * 100;
      else if (val >= good) score += weight * 75;
      else if (val >= fair) score += weight * 50;
      else score += weight * 25;
    }
  };

  // Profitability
  check(ratios.roe, [15, 10, 5], 2);
  check(ratios.roa, [8, 4, 2], 1);
  check(ratios.netMargin, [15, 8, 3], 1.5);
  check(ratios.operatingMargin, [20, 10, 5], 1);

  // Valuation
  if (ratios.pe !== null && ratios.pe > 0) {
    check(ratios.pe, [
      { type: 'lower', val: 10 },
      { type: 'lower', val: 15 },
      { type: 'lower', val: 25 },
    ], 1.5);
  }
  check(ratios.pb, [
    { type: 'lower', val: 1.0 },
    { type: 'lower', val: 2.0 },
    { type: 'lower', val: 4.0 },
  ], 1);

  // Leverage
  check(ratios.debtToEquity, [
    { type: 'lower', val: 0.3 },
    { type: 'lower', val: 0.7 },
    { type: 'lower', val: 1.5 },
  ], 1.5);

  // Liquidity
  if (ratios.currentRatio !== null) {
    check(ratios.currentRatio, [2.0, 1.5, 1.0], 1);
  }

  // Dividend
  check(ratios.dividendYield, [5, 3, 1], 0.5);

  if (maxScore === 0) return { score: 50, label: 'neutral' };
  const pct = Math.round((score / maxScore) * 100);

  let label;
  if (pct >= 80) label = 'strong';
  else if (pct >= 65) label = 'good';
  else if (pct >= 45) label = 'neutral';
  else if (pct >= 30) label = 'weak';
  else label = 'critical';

  return { score: pct, label };
}

// Sub-scores for the radar
export function calculateSubScores(ratios) {
  const profitability = Math.min(100, Math.max(0,
    ((ratios.roe || 0) / 25 * 40) +
    ((ratios.netMargin || 0) / 20 * 30) +
    ((ratios.operatingMargin || 0) / 25 * 30)
  ));

  const liquidity = ratios.currentRatio != null
    ? Math.min(100, (ratios.currentRatio / 2.5) * 100)
    : 50;

  const leverageRaw = ratios.debtToEquity != null
    ? Math.max(0, 100 - (ratios.debtToEquity / 3) * 100)
    : 50;

  const efficiency = Math.min(100, Math.max(0,
    ((ratios.roa || 0) / 12 * 50) +
    ((ratios.roe || 0) / 30 * 50)
  ));

  const valPe = ratios.pe != null && ratios.pe > 0
    ? Math.max(0, 100 - (ratios.pe / 50) * 100)
    : 50;
  const valPb = ratios.pb != null
    ? Math.max(0, 100 - (ratios.pb / 6) * 100)
    : 50;
  const valuation = (valPe + valPb) / 2;

  return {
    profitability: Math.round(profitability),
    liquidity: Math.round(liquidity),
    leverage: Math.round(leverageRaw),
    efficiency: Math.round(efficiency),
    valuation: Math.round(valuation),
  };
}

// Format number helpers
export function formatNumber(n, lang = 'pl') {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1000) {
    return (lang === 'pl')
      ? `${(n / 1000).toFixed(1).replace('.', ',')} mld`
      : `${(n / 1000).toFixed(1)}B`;
  }
  return (lang === 'pl')
    ? `${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} mln`
    : `${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}M`;
}

export function formatPrice(n) {
  if (n >= 1000) return n.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(n) {
  if (n === null || n === undefined) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function formatRatio(n) {
  if (n === null || n === undefined) return '—';
  return n.toFixed(2);
}
