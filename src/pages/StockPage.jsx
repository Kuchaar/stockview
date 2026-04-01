import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import {
  wig20Companies, sectors, formatPrice, formatPercent, formatNumber,
  calculateHealthScore, calculateSubScores,
} from '../data/wig20';
import useStockData from '../hooks/useStockData';
import useFinancials from '../hooks/useFinancials';
import TradingViewChart from '../components/TradingViewChart';
import FinancialTable from '../components/FinancialTable';
import BalanceSheet from '../components/BalanceSheet';
import IncomeStatement from '../components/IncomeStatement';
import CashFlowStatement from '../components/CashFlowStatement';
import ValuationMetrics from '../components/ValuationMetrics';
import HealthScore from '../components/HealthScore';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'overview', pl: 'Przegląd', en: 'Overview' },
  { id: 'chart',    pl: 'Wykres',   en: 'Chart' },
  { id: 'financials', pl: 'Sprawozdania', en: 'Statements' },
  { id: 'valuation',  pl: 'Wskaźniki',   en: 'Metrics' },
  { id: 'health',     pl: 'Kondycja',    en: 'Health' },
];

const FINANCIAL_SUB_TABS = [
  { id: 'overview',  pl: 'Przegląd',               en: 'Overview' },
  { id: 'income',    pl: 'Rachunek zysków i strat', en: 'Income Statement' },
  { id: 'balance',   pl: 'Bilans',                  en: 'Balance Sheet' },
  { id: 'cashflow',  pl: 'Przepływy pieniężne',     en: 'Cash Flow' },
];

export default function StockPage() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const { dark } = useTheme();
  const [tab, setTab] = useState('overview');
  const [financialSubTab, setFinancialSubTab] = useState('overview');

  // Live stock data
  const { companies, lastUpdated } = useStockData();
  const stock = companies.find(s => s.id === id);

  // Live financials (only fetch when on financials tab or overview)
  const { data: liveFinancials, loading: financialsLoading } = useFinancials(stock?.yahooSymbol);

  if (!stock) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500 text-lg mb-4">
          {lang === 'pl' ? 'Spółka nie znaleziona' : 'Stock not found'}
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('stock.backToList')}
        </Link>
      </div>
    );
  }

  const isUp = stock.changePercent >= 0;
  const sectorName = sectors[lang]?.[stock.sector] || stock.sector;
  const health = calculateHealthScore(stock.ratios);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-surface-400 mb-6">
        <Link
          to="/"
          className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
        >
          WIG20
        </Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{sectorName}</span>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-surface-600 dark:text-surface-300">{stock.ticker}</span>
      </div>

      {/* Company header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-green-500/10 dark:bg-green-400/10 border border-green-500/20 dark:border-green-400/20 text-green-600 dark:text-green-400 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
            WIG20
          </div>
          <h1 className="text-[1.9rem] sm:text-[2.1rem] font-bold tracking-tight leading-tight mb-1">
            {stock.ticker}
          </h1>
          <p className="text-surface-500 text-sm mb-4">{stock.name}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <span className="text-sm text-surface-400">
              {lang === 'pl' ? 'Sektor:' : 'Sector:'}{' '}
              <strong className="text-surface-600 dark:text-surface-300 font-medium">{sectorName}</strong>
            </span>
            <span className="text-sm text-surface-400">
              {lang === 'pl' ? 'Kapitalizacja:' : 'Market Cap:'}{' '}
              <strong className="text-surface-600 dark:text-surface-300 font-medium">
                {formatNumber(stock.marketCap, lang)}
              </strong>
            </span>
            {stock.ratios.pe !== null && (
              <span className="text-sm text-surface-400">
                P/E:{' '}
                <strong className="text-surface-600 dark:text-surface-300 font-medium">
                  {stock.ratios.pe.toFixed(1)}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Price block */}
        <div className="sm:text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-surface-400 mb-1">
            <span>{lang === 'pl' ? 'Kurs zamknięcia' : 'Closing price'}</span>
            {stock._priceDate && (
              <span className="text-[10px] normal-case font-normal">
                ({stock._priceDate})
              </span>
            )}
          </div>
          <div className="font-mono font-bold text-[2rem] tracking-tight leading-none mb-2.5">
            {formatPrice(stock.price)}{' '}
            <span className="text-sm text-surface-400 font-normal">PLN</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg ${
            isUp
              ? 'text-green-600 dark:text-green-400 bg-green-500/10'
              : 'text-red-500 dark:text-red-400 bg-red-500/10'
          }`}>
            {isUp ? '▲' : '▼'}{' '}
            {isUp ? '+' : ''}{stock.change.toFixed(2)} zł ({formatPercent(stock.changePercent)})
          </div>
        </div>
      </div>

      {/* Tabs — underline style */}
      <div className="flex overflow-x-auto border-b border-surface-200 dark:border-surface-800 mb-8 -mx-1 px-1">
        {TABS.map(tabItem => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 -mb-px ${
              tab === tabItem.id
                ? 'text-green-600 dark:text-green-400 border-green-500 dark:border-green-400'
                : 'text-surface-500 border-transparent hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            {lang === 'pl' ? tabItem.pl : tabItem.en}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === 'overview' && (
          <OverviewTab stock={stock} lang={lang} dark={dark} health={health} t={t} />
        )}

        {tab === 'chart' && (
          <div className="space-y-4">
            <TradingViewChart symbol={stock.tvSymbol} variant="full" />
            <p className="text-xs text-surface-400 text-center">
              {lang === 'pl'
                ? 'Użyj paska narzędzi wykresu, aby dodać oscylatory (RSI, MACD, Bollinger Bands i inne).'
                : 'Use the chart toolbar to add oscillators (RSI, MACD, Bollinger Bands, and more).'}
            </p>
          </div>
        )}

        {tab === 'financials' && (
          <div className="card">
            <h2 className="section-title mb-4">{t('stock.financials')}</h2>

            {/* Financial sub-tabs */}
            <div className="flex overflow-x-auto gap-1 mb-6 pb-1">
              {FINANCIAL_SUB_TABS.map(st => (
                <button
                  key={st.id}
                  onClick={() => setFinancialSubTab(st.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                    financialSubTab === st.id
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 dark:border-green-400/20'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  {lang === 'pl' ? st.pl : st.en}
                </button>
              ))}
              {financialsLoading && (
                <span className="flex items-center gap-1 text-xs text-surface-400 ml-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {lang === 'pl' ? 'Ładowanie...' : 'Loading...'}
                </span>
              )}
            </div>

            {financialSubTab === 'overview' && (
              <FinancialTable financials={stock.financials} />
            )}
            {financialSubTab === 'income' && (
              <IncomeStatement
                liveData={liveFinancials?.incomeStatement}
                fallbackFinancials={stock.financials}
              />
            )}
            {financialSubTab === 'balance' && (
              <BalanceSheet
                liveData={liveFinancials?.balanceSheet}
                fallbackFinancials={stock.financials}
              />
            )}
            {financialSubTab === 'cashflow' && (
              <CashFlowStatement
                liveData={liveFinancials?.cashFlow}
                fallbackFinancials={stock.financials}
              />
            )}

            {liveFinancials && (
              <p className="text-[10px] text-surface-400 mt-4 text-right">
                {lang === 'pl' ? 'Dane z Yahoo Finance' : 'Data from Yahoo Finance'}
              </p>
            )}
          </div>
        )}

        {tab === 'valuation' && (
          <div className="card">
            <h2 className="section-title mb-6">{t('stock.valuation')}</h2>
            <ValuationMetrics ratios={stock.ratios} />
          </div>
        )}

        {tab === 'health' && (
          <div className="card">
            <h2 className="section-title mb-6">{t('stock.health')}</h2>
            <HealthScore ratios={stock.ratios} />
          </div>
        )}
      </motion.div>

      {/* Stock navigation */}
      <StockNavigation currentId={stock.id} />
    </motion.div>
  );
}

/* ─── Overview tab ─────────────────────────────────────────────────────────── */

function OverviewTab({ stock, lang, dark, health, t }) {
  const subs = calculateSubScores(stock.ratios);

  return (
    <div className="space-y-10">
      <HealthGrid stock={stock} lang={lang} dark={dark} health={health} subs={subs} />
      <KeyRatiosSection stock={stock} lang={lang} />
      <FinancialHighlights stock={stock} lang={lang} />
      <CtaBanner lang={lang} ticker={stock.ticker} />
    </div>
  );
}

/* ─── Health grid ───────────────────────────────────────────────────────────── */

function HealthGrid({ stock, lang, dark, health, subs }) {
  const { score, label } = health;

  const accentColor =
    label === 'strong' || label === 'good' ? '#22c55e'
    : label === 'neutral' ? '#f59e0b'
    : '#ef4444';

  const circumference = 2 * Math.PI * 63;
  const dashOffset = circumference * (1 - score / 100);

  const healthLabelText = {
    strong: lang === 'pl' ? 'Bardzo dobra kondycja' : 'Very strong health',
    good:   lang === 'pl' ? 'Dobra kondycja'        : 'Good health',
    neutral: lang === 'pl' ? 'Neutralna kondycja'   : 'Neutral health',
    weak:   lang === 'pl' ? 'Słaba kondycja'        : 'Weak health',
    critical: lang === 'pl' ? 'Krytyczna kondycja'  : 'Critical health',
  }[label];

  // Revenue growth from last two annual data points
  const rev = stock.financials.annual.revenue;
  const revenueGrowth =
    rev.length >= 2 && rev[rev.length - 2]
      ? ((rev[rev.length - 1] - rev[rev.length - 2]) / rev[rev.length - 2]) * 100
      : null;

  const detailCards = [
    {
      label: lang === 'pl' ? 'Rentowność' : 'Profitability',
      value: stock.ratios.roe != null ? `${stock.ratios.roe.toFixed(1)}%` : '—',
      explain: lang === 'pl'
        ? 'ROE — ile zysku generuje każda złotówka kapitału własnego. Powyżej 10% to dobry wynik.'
        : 'ROE — profit generated per unit of equity. Above 10% is a good result.',
      score: subs.profitability,
      barWidth: Math.min(subs.profitability, 100),
    },
    {
      label: lang === 'pl' ? 'Zadłużenie' : 'Leverage',
      value: stock.ratios.debtToEquity != null ? stock.ratios.debtToEquity.toFixed(2) : '—',
      explain: lang === 'pl'
        ? 'Dług/Kapitał — ile długu przypada na każdą złotówkę kapitału. Poniżej 0,5 to bezpieczny poziom.'
        : 'Debt/Equity — debt per unit of capital. Below 0.5 is a safe level.',
      score: subs.leverage,
      barWidth: Math.min(subs.leverage, 100),
    },
    {
      label: lang === 'pl' ? 'Dynamika przychodów' : 'Revenue Growth',
      value: revenueGrowth != null
        ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`
        : '—',
      explain: lang === 'pl'
        ? 'Zmiana przychodów rok do roku. Pokazuje czy firma rośnie czy kurczy się.'
        : 'Year-over-year revenue change. Shows whether the company is growing or shrinking.',
      score: revenueGrowth != null
        ? (revenueGrowth > 10 ? 80 : revenueGrowth > 0 ? 55 : 25)
        : 50,
      barWidth: revenueGrowth != null
        ? Math.min(Math.max(revenueGrowth + 50, 5), 100)
        : 50,
    },
    {
      label: lang === 'pl' ? 'Płynność' : 'Liquidity',
      value: stock.ratios.currentRatio != null ? stock.ratios.currentRatio.toFixed(2) : '—',
      explain: lang === 'pl'
        ? 'Current Ratio — czy firma jest w stanie spłacić bieżące zobowiązania. Powyżej 1,5 to komfort.'
        : 'Current Ratio — ability to cover short-term obligations. Above 1.5 is comfortable.',
      score: subs.liquidity,
      barWidth: Math.min(subs.liquidity, 100),
    },
  ];

  const badgeFor = s =>
    s >= 65
      ? { text: lang === 'pl' ? 'Dobra' : 'Good',       cls: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-400/20' }
      : s >= 40
        ? { text: lang === 'pl' ? 'Umiarkowana' : 'Moderate', cls: 'bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20' }
        : { text: lang === 'pl' ? 'Słaba' : 'Weak',      cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-400/20' };

  const valueColorFor = s =>
    s >= 65 ? 'text-green-600 dark:text-green-400'
    : s >= 40 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  const barColorFor = s =>
    s >= 65 ? 'bg-green-500 dark:bg-green-400'
    : s >= 40 ? 'bg-amber-500 dark:bg-amber-400'
    : 'bg-red-500 dark:bg-red-400';

  return (
    <div>
      <SectionHeader
        title={lang === 'pl' ? 'Kondycja finansowa' : 'Financial Health'}
        sub={lang === 'pl' ? 'Ocena na podstawie ostatniego sprawozdania' : 'Based on latest financial report'}
      />

      <div className="grid grid-cols-1 md:grid-cols-[268px_1fr] gap-4">
        {/* Score ring */}
        <div className="card flex flex-col items-center justify-center text-center py-8">
          <div className="relative w-36 h-36 mb-4">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle
                cx="70" cy="70" r="63"
                fill="none"
                className="stroke-surface-200 dark:stroke-surface-800"
                strokeWidth="8"
              />
              <circle
                cx="70" cy="70" r="63"
                fill="none"
                stroke={accentColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-bold text-[2.3rem] leading-none" style={{ color: accentColor }}>
                {score}
              </span>
              <span className="text-xs text-surface-400">/100</span>
            </div>
          </div>
          <div className="text-sm font-semibold mb-1.5" style={{ color: accentColor }}>
            {healthLabelText}
          </div>
          <p className="text-xs text-surface-400 leading-relaxed max-w-[190px]">
            {healthDescription(label, lang)}
          </p>
        </div>

        {/* 2×2 detail cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detailCards.map((card, i) => {
            const badge = badgeFor(card.score);
            return (
              <div
                key={i}
                className="card hover:border-surface-300/80 dark:hover:border-surface-700 transition-colors cursor-default"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-surface-500">{card.label}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>
                <div className={`font-mono font-bold text-2xl tracking-tight mb-1.5 ${valueColorFor(card.score)}`}>
                  {card.value}
                </div>
                <p className="text-[11px] text-surface-400 leading-relaxed">{card.explain}</p>
                <div className="h-1 bg-surface-200/70 dark:bg-surface-800/70 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColorFor(card.score)}`}
                    style={{ width: `${card.barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Key ratios ────────────────────────────────────────────────────────────── */

function KeyRatiosSection({ stock, lang }) {
  const { ratios, financials } = stock;

  const annualRevenue = financials.annual.revenue.filter(v => v != null);
  const maxRev = Math.max(...annualRevenue, 1);
  const revBars = annualRevenue.map(v => Math.max((v / maxRev) * 100, 4));

  const annualNI = financials.annual.netIncome.map(v => (v == null || v < 0 ? 0 : v));
  const maxNI = Math.max(...annualNI, 1);
  const niBars = annualNI.map(v => Math.max((v / maxNI) * 100, 4));

  const ratioCards = [
    {
      name: lang === 'pl' ? 'C/Z (P/E)' : 'P/E Ratio',
      tooltip: lang === 'pl'
        ? 'Cena/Zysk — ile lat zajęłoby odzyskanie inwestycji z samych zysków. Im niższe, tym „tańsza" spółka. Dla WIG20 średnia to ok. 12–15.'
        : 'Price/Earnings — years to recoup investment from earnings alone. Lower = cheaper stock. WIG20 average ≈ 12–15.',
      value: ratios.pe != null ? ratios.pe.toFixed(1) : '—',
      context: ratios.pe != null
        ? (ratios.pe < 12
            ? (lang === 'pl' ? 'Poniżej średniej WIG20' : 'Below WIG20 average')
            : ratios.pe < 20
              ? (lang === 'pl' ? 'Blisko średniej WIG20' : 'Near WIG20 average')
              : (lang === 'pl' ? 'Powyżej średniej WIG20' : 'Above WIG20 average'))
        : '—',
      ctxCls: ratios.pe != null
        ? (ratios.pe < 15 ? 'text-green-600 dark:text-green-400' : ratios.pe < 25 ? 'text-surface-400' : 'text-red-500 dark:text-red-400')
        : 'text-surface-400',
      bars: niBars,
      barColor: ratios.pe != null && ratios.pe < 15 ? '#22c55e' : '#60a5fa',
    },
    {
      name: lang === 'pl' ? 'C/WK (P/BV)' : 'P/B Ratio',
      tooltip: lang === 'pl'
        ? 'Cena/Wartość Księgowa — porównuje cenę rynkową z wartością majątku netto. Poniżej 1,0 oznacza, że rynek wycenia firmę poniżej jej majątku.'
        : 'Price/Book — market price vs net asset value. Below 1.0 means trading below book value.',
      value: ratios.pb != null ? ratios.pb.toFixed(2) : '—',
      context: ratios.pb != null
        ? (ratios.pb < 1.5
            ? (lang === 'pl' ? 'Blisko wartości księgowej' : 'Near book value')
            : (lang === 'pl' ? 'Premia do wartości księgowej' : 'Premium to book value'))
        : '—',
      ctxCls: ratios.pb != null && ratios.pb < 1.5
        ? 'text-green-600 dark:text-green-400'
        : 'text-surface-400',
      bars: revBars,
      barColor: '#60a5fa',
    },
    {
      name: 'ROE',
      tooltip: lang === 'pl'
        ? 'Return on Equity — ile zysku generuje firma z kapitału akcjonariuszy. Im wyższe, tym efektywniej firma wykorzystuje Twoje pieniądze. Powyżej 15% to świetny wynik.'
        : 'Return on Equity — profit generated from shareholders\' capital. Higher is better. Above 15% is excellent.',
      value: ratios.roe != null ? `${ratios.roe.toFixed(1)}%` : '—',
      context: ratios.roe != null
        ? (ratios.roe > 15
            ? (lang === 'pl' ? 'Solidna rentowność' : 'Solid profitability')
            : ratios.roe > 8
              ? (lang === 'pl' ? 'Przeciętna rentowność' : 'Average profitability')
              : (lang === 'pl' ? 'Niska rentowność' : 'Low profitability'))
        : '—',
      ctxCls: ratios.roe != null
        ? (ratios.roe > 15 ? 'text-green-600 dark:text-green-400' : ratios.roe > 8 ? 'text-surface-400' : 'text-red-500 dark:text-red-400')
        : 'text-surface-400',
      bars: niBars,
      barColor: ratios.roe != null && ratios.roe > 10 ? '#22c55e' : '#f87171',
    },
    {
      name: lang === 'pl' ? 'Stopa dywidendy' : 'Dividend Yield',
      tooltip: lang === 'pl'
        ? 'Ile procent ceny akcji firma wypłaca rocznie w dywidendzie. Jak oprocentowanie lokaty, ale z akcji. 3–5% to solidna dywidenda na GPW.'
        : 'Annual dividend as a percentage of share price. 3–5% is a solid yield on the WSE.',
      value: ratios.dividendYield ? `${ratios.dividendYield.toFixed(1)}%` : '—',
      context: ratios.dividendYield > 4
        ? (lang === 'pl' ? 'Wysoka dywidenda' : 'High dividend')
        : ratios.dividendYield > 1
          ? (lang === 'pl' ? 'Umiarkowana dywidenda' : 'Moderate dividend')
          : (lang === 'pl' ? 'Brak / niska dywidenda' : 'None / low dividend'),
      ctxCls: ratios.dividendYield > 3
        ? 'text-purple-600 dark:text-purple-400'
        : 'text-surface-400',
      bars: revBars,
      barColor: '#a78bfa',
    },
  ];

  return (
    <div>
      <SectionHeader
        title={lang === 'pl' ? 'Kluczowe wskaźniki' : 'Key Ratios'}
        sub={lang === 'pl' ? 'Najedź na ? aby zobaczyć wyjaśnienie' : 'Hover over ? to see explanation'}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ratioCards.map((rc, i) => (
          <RatioCard key={i} rc={rc} />
        ))}
      </div>
    </div>
  );
}

function RatioCard({ rc }) {
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <div className="card hover:border-surface-300/80 dark:hover:border-surface-700 hover:-translate-y-px transition-all duration-200 cursor-default">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-xs font-medium text-surface-500">{rc.name}</span>
        <button
          className="relative flex items-center justify-center w-4 h-4 rounded-full bg-surface-200/60 dark:bg-surface-800/60 text-[9px] font-bold text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors flex-shrink-0"
          onMouseEnter={() => setTipOpen(true)}
          onMouseLeave={() => setTipOpen(false)}
          tabIndex={-1}
        >
          ?
          {tipOpen && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-[11px] text-surface-500 dark:text-surface-400 font-normal leading-relaxed shadow-xl z-50 pointer-events-none text-left">
              {rc.tooltip}
            </span>
          )}
        </button>
      </div>

      <div className="font-mono font-bold text-[1.3rem] tracking-tight mb-1">
        {rc.value}
      </div>
      <div className={`text-[11px] ${rc.ctxCls}`}>{rc.context}</div>

      {/* Sparkline */}
      <div className="flex items-end gap-0.5 h-7 mt-3">
        {rc.bars.map((pct, idx) => (
          <div
            key={idx}
            className="flex-1 rounded-sm"
            style={{
              height: `${pct}%`,
              minHeight: 3,
              background:
                idx === rc.bars.length - 1
                  ? rc.barColor
                  : 'rgba(148,163,184,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Financial highlights ──────────────────────────────────────────────────── */

function FinancialHighlights({ stock, lang }) {
  return (
    <div>
      <SectionHeader
        title={lang === 'pl' ? 'Rachunek zysków i strat' : 'Income Statement'}
        sub={lang === 'pl' ? 'Dane roczne skonsolidowane · w milionach PLN' : 'Annual consolidated data · in millions PLN'}
      />
      <div className="card">
        <FinancialTable financials={stock.financials} />
      </div>
    </div>
  );
}

/* ─── CTA banner ────────────────────────────────────────────────────────────── */

function CtaBanner({ lang, ticker }) {
  return (
    <div className="rounded-2xl border border-green-500/15 dark:border-green-400/15 bg-gradient-to-br from-green-500/5 to-blue-500/5 dark:from-green-400/5 dark:to-blue-400/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div>
        <h3 className="text-base font-semibold mb-1.5">
          {lang === 'pl'
            ? `Dodaj ${ticker} do swojego portfela`
            : `Add ${ticker} to your portfolio`}
        </h3>
        <p className="text-sm text-surface-500 max-w-lg leading-relaxed">
          {lang === 'pl'
            ? 'Śledź jak Twoje spółki radzą sobie w czasie, sprawdzaj dywersyfikację i porównuj wyniki. Darmowe konto — zero reklam, zero spamu.'
            : 'Track how your stocks perform over time, check diversification and compare results. Free account — zero ads, zero spam.'}
        </p>
      </div>
      <button className="bg-green-500 dark:bg-green-400 text-white dark:text-[#0a0c10] font-semibold text-sm px-6 py-2.5 rounded-xl whitespace-nowrap hover:brightness-110 hover:-translate-y-px transition-all duration-200">
        {lang === 'pl' ? 'Utwórz darmowe konto →' : 'Create free account →'}
      </button>
    </div>
  );
}

/* ─── Shared helpers ────────────────────────────────────────────────────────── */

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <div className="text-base font-semibold tracking-tight">{title}</div>
      {sub && <div className="text-xs text-surface-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function healthDescription(label, lang) {
  const map = {
    strong:   { pl: 'Spółka wykazuje silne fundamenty — wysoka rentowność, zdrowy bilans i atrakcyjna wycena.', en: 'Strong fundamentals — high profitability, healthy balance sheet, attractive valuation.' },
    good:     { pl: 'Spółka jest w dobrej kondycji z większością wskaźników powyżej średniej.',                 en: 'Good financial health with most metrics above average.' },
    neutral:  { pl: 'Kondycja neutralna — niektóre obszary wymagają uwagi.',                                   en: 'Neutral health — some areas need attention.' },
    weak:     { pl: 'Spółka wykazuje słabości w kilku kluczowych obszarach finansowych.',                      en: 'Weaknesses in several key financial areas.' },
    critical: { pl: 'Trudna sytuacja finansowa — należy zachować szczególną ostrożność.',                      en: 'Difficult financial situation — exercise extreme caution.' },
  };
  return map[label]?.[lang] ?? '';
}

/* ─── Stock prev/next navigation ───────────────────────────────────────────── */

function StockNavigation({ currentId }) {
  const { lang } = useLang();
  const idx = wig20Companies.findIndex(s => s.id === currentId);
  const prev = idx > 0 ? wig20Companies[idx - 1] : null;
  const next = idx < wig20Companies.length - 1 ? wig20Companies[idx + 1] : null;

  return (
    <div className="flex justify-between mt-12 pt-6 border-t border-surface-200/40 dark:border-surface-800/40">
      {prev ? (
        <Link
          to={`/stock/${prev.id}`}
          className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {prev.shortName}
        </Link>
      ) : <div />}
      {next ? (
        <Link
          to={`/stock/${next.id}`}
          className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
        >
          {next.shortName}
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      ) : <div />}
    </div>
  );
}
