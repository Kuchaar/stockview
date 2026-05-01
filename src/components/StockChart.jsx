import React, { useState, useMemo, useCallback, useRef } from 'react';
import useHistoricalPrices from '../hooks/useHistoricalPrices';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { calcSMA, calcEMA, calcRSI, calcMACD, calcBollingerBands } from '../utils/technicalIndicators';
import { Loader2 } from 'lucide-react';

// SVG layout constants
const VB_W = 800;
const CHART_L = 60, CHART_R = 790, CHART_T = 10, CHART_B = 330;
const VOL_T = 350, VOL_B = 430;
const CHART_W = CHART_R - CHART_L;
const CHART_H = CHART_B - CHART_T;
const VOL_H = VOL_B - VOL_T;
const PANEL_H = 90, PANEL_GAP = 20; // oscillator panel height + gap

const RANGES = [
  { key: '1m', days: 22 },
  { key: '3m', days: 66 },
  { key: '6m', days: 132 },
  { key: '1y', days: 252 },
  { key: '3y', days: 756 },
  { key: 'max', days: Infinity },
];

const MONTHS_PL = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Indicator colors
const COLORS = {
  sma20: '#f59e0b',
  sma50: '#8b5cf6',
  ema12: '#06b6d4',
  ema26: '#ec4899',
  bollinger: '#f59e0b',
  rsi: '#8b5cf6',
  macdLine: '#06b6d4',
  macdSignal: '#ec4899',
};

const OVERLAY_INDICATORS = [
  { key: 'sma20', label: 'SMA 20', color: COLORS.sma20 },
  { key: 'sma50', label: 'SMA 50', color: COLORS.sma50 },
  { key: 'ema12', label: 'EMA 12', color: COLORS.ema12 },
  { key: 'ema26', label: 'EMA 26', color: COLORS.ema26 },
  { key: 'bollinger', label: 'Bollinger', color: COLORS.bollinger },
];

const OSCILLATOR_INDICATORS = [
  { key: 'rsi', label: 'RSI' },
  { key: 'macd', label: 'MACD' },
];

function formatDateLabel(dateStr, rangeKey, lang) {
  const [y, m, d] = dateStr.split('-');
  const months = lang === 'pl' ? MONTHS_PL : MONTHS_EN;
  if (rangeKey === '1m' || rangeKey === '3m') return `${d}.${m}`;
  if (rangeKey === '6m' || rangeKey === '1y') return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
  return y;
}

function filterByRange(data, rangeKey) {
  if (rangeKey === 'max' || !data.length) return data;
  const range = RANGES.find(r => r.key === rangeKey);
  if (!range) return data;
  return data.slice(Math.max(0, data.length - range.days));
}

/** Build SVG path skipping null values */
function buildLinePath(values, toX, toY) {
  let d = '';
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) continue;
    const x = toX(i);
    const y = toY(values[i]);
    d += d === '' ? `M${x},${y}` : ` L${x},${y}`;
  }
  return d;
}

function StockChartInner({ ticker, className }) {
  const { t, lang } = useLang();
  const { dark } = useTheme();
  const { data: allData, loading, error, refetch } = useHistoricalPrices(ticker);

  const [mode, setMode] = useState('line');
  const [rangeKey, setRangeKey] = useState('1y');
  const [hover, setHover] = useState(null);
  const [indicators, setIndicators] = useState({
    sma20: false, sma50: false, ema12: false, ema26: false,
    bollinger: false, rsi: false, macd: false,
  });

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const toggleIndicator = useCallback((key) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const data = useMemo(() => filterByRange(allData, rangeKey), [allData, rangeKey]);
  const closes = useMemo(() => data.map(d => d.close), [data]);

  // Indicator calculations (only when toggled on)
  const sma20Data = useMemo(() => indicators.sma20 ? calcSMA(closes, 20) : null, [closes, indicators.sma20]);
  const sma50Data = useMemo(() => indicators.sma50 ? calcSMA(closes, 50) : null, [closes, indicators.sma50]);
  const ema12Data = useMemo(() => indicators.ema12 ? calcEMA(closes, 12) : null, [closes, indicators.ema12]);
  const ema26Data = useMemo(() => indicators.ema26 ? calcEMA(closes, 26) : null, [closes, indicators.ema26]);
  const bollingerData = useMemo(() => indicators.bollinger ? calcBollingerBands(closes) : null, [closes, indicators.bollinger]);
  const rsiData = useMemo(() => indicators.rsi ? calcRSI(closes) : null, [closes, indicators.rsi]);
  const macdData = useMemo(() => indicators.macd ? calcMACD(closes) : null, [closes, indicators.macd]);

  // Dynamic viewBox height
  const oscillatorCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
  const vbH = 450 + oscillatorCount * (PANEL_H + PANEL_GAP);

  // Oscillator panel positions
  const rsiPanelTop = 450 + PANEL_GAP;
  const macdPanelTop = indicators.rsi ? rsiPanelTop + PANEL_H + PANEL_GAP : 450 + PANEL_GAP;
  const crosshairBottom = oscillatorCount > 0
    ? (indicators.macd ? macdPanelTop + PANEL_H : rsiPanelTop + PANEL_H)
    : VOL_B;

  // X-axis label Y position
  const xLabelY = vbH - 5;

  const { minPrice, maxPrice, maxVol, priceRange } = useMemo(() => {
    if (!data.length) return { minPrice: 0, maxPrice: 1, maxVol: 1, priceRange: 1 };
    let mn = Infinity, mx = -Infinity, mv = 0;
    for (const d of data) {
      const lo = mode === 'candle' ? d.low : d.close;
      const hi = mode === 'candle' ? d.high : d.close;
      if (lo < mn) mn = lo;
      if (hi > mx) mx = hi;
      if (d.volume > mv) mv = d.volume;
    }
    // Also consider Bollinger bands in price range
    if (bollingerData) {
      for (let i = 0; i < bollingerData.upper.length; i++) {
        if (bollingerData.upper[i] != null && bollingerData.upper[i] > mx) mx = bollingerData.upper[i];
        if (bollingerData.lower[i] != null && bollingerData.lower[i] < mn) mn = bollingerData.lower[i];
      }
    }
    const pad = (mx - mn) * 0.05 || 1;
    return { minPrice: mn - pad, maxPrice: mx + pad, maxVol: mv || 1, priceRange: (mx + pad) - (mn - pad) };
  }, [data, mode, bollingerData]);

  const toX = useCallback((i) => CHART_L + (i / (data.length - 1 || 1)) * CHART_W, [data.length]);
  const priceToY = useCallback((p) => CHART_T + CHART_H * (1 - (p - minPrice) / priceRange), [minPrice, priceRange]);
  const volToH = useCallback((v) => (v / maxVol) * VOL_H, [maxVol]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const price = minPrice + (priceRange * i) / steps;
      lines.push({ y: priceToY(price), label: price.toFixed(2) });
    }
    return lines;
  }, [minPrice, priceRange, priceToY]);

  // X-axis labels
  const xLabels = useMemo(() => {
    if (!data.length) return [];
    const labels = [];
    const step = Math.max(1, Math.floor(data.length / 7));
    for (let i = 0; i < data.length; i += step) {
      labels.push({ x: toX(i), label: formatDateLabel(data[i].date, rangeKey, lang) });
    }
    return labels;
  }, [data, rangeKey, lang, toX]);

  // MACD scale
  const macdScale = useMemo(() => {
    if (!macdData) return { min: -1, max: 1, range: 2 };
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < macdData.macd.length; i++) {
      for (const arr of [macdData.macd, macdData.signal, macdData.histogram]) {
        if (arr[i] != null) {
          if (arr[i] < mn) mn = arr[i];
          if (arr[i] > mx) mx = arr[i];
        }
      }
    }
    if (mn === Infinity) return { min: -1, max: 1, range: 2 };
    const pad = (mx - mn) * 0.1 || 1;
    return { min: mn - pad, max: mx + pad, range: (mx + pad) - (mn - pad) };
  }, [macdData]);

  // Crosshair handler
  const handlePointerMove = useCallback((e) => {
    if (!data.length || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const relX = (clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (data.length - 1));
    const clampedIdx = Math.max(0, Math.min(data.length - 1, idx));
    setHover({ index: clampedIdx, clientX: clientX - rect.left, clientY: clientY - rect.top });
  }, [data]);

  const handlePointerLeave = useCallback(() => setHover(null), []);

  const gridColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const textColor = dark ? '#6b7280' : '#9ca3af';

  // Loading
  if (loading) {
    return (
      <div className={`animate-pulse bg-surface-200 dark:bg-surface-800 rounded-xl ${className || ''}`}
           style={{ aspectRatio: `800/${vbH}` }}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className || ''}`}>
        <p className="text-surface-500 text-sm">{error}</p>
        <button onClick={refetch} className="btn-primary text-sm px-4 py-2">
          {t('chart.retry')}
        </button>
      </div>
    );
  }

  // No data
  if (!data.length) {
    return (
      <div className={`flex items-center justify-center py-16 ${className || ''}`}>
        <p className="text-surface-500 text-sm">{t('chart.noData')}</p>
      </div>
    );
  }

  const hoverPoint = hover ? data[hover.index] : null;
  const hoverX = hover ? toX(hover.index) : 0;
  const candleW = Math.max(1, Math.min(8, (CHART_W / data.length) - 1));

  // Helper: RSI Y scale
  const rsiToY = (v) => rsiPanelTop + PANEL_H * (1 - v / 100);
  // Helper: MACD Y scale
  const macdToY = (v) => macdPanelTop + PANEL_H * (1 - (v - macdScale.min) / macdScale.range);

  // Tooltip indicator values
  const tooltipIndicators = [];
  if (hover) {
    const i = hover.index;
    if (sma20Data?.[i] != null) tooltipIndicators.push({ label: 'SMA 20', value: sma20Data[i], color: COLORS.sma20 });
    if (sma50Data?.[i] != null) tooltipIndicators.push({ label: 'SMA 50', value: sma50Data[i], color: COLORS.sma50 });
    if (ema12Data?.[i] != null) tooltipIndicators.push({ label: 'EMA 12', value: ema12Data[i], color: COLORS.ema12 });
    if (ema26Data?.[i] != null) tooltipIndicators.push({ label: 'EMA 26', value: ema26Data[i], color: COLORS.ema26 });
    if (rsiData?.[i] != null) tooltipIndicators.push({ label: 'RSI', value: rsiData[i], color: COLORS.rsi });
    if (macdData?.macd[i] != null) tooltipIndicators.push({ label: 'MACD', value: macdData.macd[i], color: COLORS.macdLine });
    if (macdData?.signal[i] != null) tooltipIndicators.push({ label: 'Signal', value: macdData.signal[i], color: COLORS.macdSignal });
  }

  return (
    <div className={className || ''}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-surface-100/80 dark:bg-surface-900/50">
          {['line', 'candle'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === m
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 dark:border-green-400/20'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              {t(`chart.${m}`)}
            </button>
          ))}
        </div>

        {/* Range pills */}
        <div className="flex gap-1 p-1 rounded-lg bg-surface-100/80 dark:bg-surface-900/50">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                rangeKey === r.key
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 dark:border-green-400/20'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              {t(`chart.${r.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
        {/* Overlays */}
        {OVERLAY_INDICATORS.map(ind => (
          <button
            key={ind.key}
            onClick={() => toggleIndicator(ind.key)}
            className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all border ${
              indicators[ind.key]
                ? 'text-white border-transparent'
                : 'text-surface-500 border-surface-200 dark:border-surface-700 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
            style={indicators[ind.key] ? { backgroundColor: ind.color } : undefined}
          >
            {ind.label}
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-5 bg-surface-300 dark:bg-surface-700 flex-shrink-0 mx-1" />

        {/* Oscillators */}
        {OSCILLATOR_INDICATORS.map(ind => {
          const color = ind.key === 'rsi' ? COLORS.rsi : COLORS.macdLine;
          return (
            <button
              key={ind.key}
              onClick={() => toggleIndicator(ind.key)}
              className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all border ${
                indicators[ind.key]
                  ? 'text-white border-transparent'
                  : 'text-surface-500 border-surface-200 dark:border-surface-700 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
              style={indicators[ind.key] ? { backgroundColor: color } : undefined}
            >
              {ind.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="relative select-none touch-none"
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerLeave}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${vbH}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines + Y labels */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={CHART_L} y1={g.y} x2={CHART_R} y2={g.y}
                    stroke={gridColor} strokeDasharray="4 4" />
              <text x={CHART_L - 6} y={g.y + 3} textAnchor="end"
                    fontSize="10" fill={textColor}>{g.label}</text>
            </g>
          ))}

          {/* X labels */}
          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={xLabelY} textAnchor="middle"
                  fontSize="10" fill={textColor}>{l.label}</text>
          ))}

          {/* Volume bars */}
          {data.map((d, i) => {
            const x = toX(i);
            const h = volToH(d.volume);
            const isUp = d.close >= d.open;
            const barW = Math.max(1, CHART_W / data.length * 0.8);
            return (
              <rect key={`v${i}`} x={x - barW / 2} y={VOL_B - h} width={barW} height={h}
                    fill={isUp ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'} />
            );
          })}

          {/* Price chart */}
          {mode === 'line' ? (
            <>
              <path
                d={
                  data.map((d, i) => {
                    const x = toX(i);
                    const y = priceToY(d.close);
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  }).join(' ') +
                  ` L${CHART_R},${CHART_B} L${CHART_L},${CHART_B} Z`
                }
                fill="url(#lineGradient)"
              />
              <path
                d={data.map((d, i) => {
                  const x = toX(i);
                  const y = priceToY(d.close);
                  return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ')}
                stroke="#22c55e" strokeWidth="1.5" fill="none"
              />
            </>
          ) : (
            data.map((d, i) => {
              const x = toX(i);
              const isUp = d.close >= d.open;
              const color = isUp ? '#22c55e' : '#ef4444';
              const bodyTop = priceToY(Math.max(d.open, d.close));
              const bodyBot = priceToY(Math.min(d.open, d.close));
              const bodyH = Math.max(1, bodyBot - bodyTop);
              return (
                <g key={`c${i}`}>
                  <line x1={x} y1={priceToY(d.high)} x2={x} y2={priceToY(d.low)}
                        stroke={color} strokeWidth="1" />
                  <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH}
                        fill={color} stroke={color} strokeWidth="0.5" />
                </g>
              );
            })
          )}

          {/* === Overlays (after price, before crosshair) === */}

          {/* Bollinger Bands fill */}
          {bollingerData && (() => {
            // Build fill area between upper and lower
            let upper = '', lower = '';
            let started = false;
            for (let i = 0; i < bollingerData.upper.length; i++) {
              if (bollingerData.upper[i] == null) continue;
              const x = toX(i);
              upper += (started ? ' L' : 'M') + `${x},${priceToY(bollingerData.upper[i])}`;
              started = true;
            }
            // Reverse lower for fill path
            const lowerPts = [];
            for (let i = bollingerData.lower.length - 1; i >= 0; i--) {
              if (bollingerData.lower[i] == null) continue;
              lowerPts.push(`L${toX(i)},${priceToY(bollingerData.lower[i])}`);
            }
            return (
              <>
                <path d={upper + ' ' + lowerPts.join(' ') + ' Z'}
                      fill={COLORS.bollinger} fillOpacity="0.08" stroke="none" />
                <path d={buildLinePath(bollingerData.middle, toX, priceToY)}
                      stroke={COLORS.bollinger} strokeWidth="1" fill="none" />
                <path d={buildLinePath(bollingerData.upper, toX, priceToY)}
                      stroke={COLORS.bollinger} strokeOpacity="0.4" strokeWidth="1"
                      strokeDasharray="3 3" fill="none" />
                <path d={buildLinePath(bollingerData.lower, toX, priceToY)}
                      stroke={COLORS.bollinger} strokeOpacity="0.4" strokeWidth="1"
                      strokeDasharray="3 3" fill="none" />
              </>
            );
          })()}

          {sma20Data && (
            <path d={buildLinePath(sma20Data, toX, priceToY)}
                  stroke={COLORS.sma20} strokeWidth="1.5" fill="none" />
          )}
          {sma50Data && (
            <path d={buildLinePath(sma50Data, toX, priceToY)}
                  stroke={COLORS.sma50} strokeWidth="1.5" fill="none" />
          )}
          {ema12Data && (
            <path d={buildLinePath(ema12Data, toX, priceToY)}
                  stroke={COLORS.ema12} strokeWidth="1.5" fill="none" />
          )}
          {ema26Data && (
            <path d={buildLinePath(ema26Data, toX, priceToY)}
                  stroke={COLORS.ema26} strokeWidth="1.5" fill="none" />
          )}

          {/* === RSI Panel === */}
          {indicators.rsi && rsiData && (
            <g>
              {/* Separator */}
              <line x1={CHART_L} y1={rsiPanelTop - PANEL_GAP / 2} x2={CHART_R} y2={rsiPanelTop - PANEL_GAP / 2}
                    stroke={gridColor} />
              {/* Label */}
              <text x={CHART_L - 6} y={rsiPanelTop + 12} textAnchor="end"
                    fontSize="9" fill={textColor}>RSI (14)</text>
              {/* Overbought/oversold zones */}
              <rect x={CHART_L} y={rsiToY(100)} width={CHART_W}
                    height={rsiToY(70) - rsiToY(100)}
                    fill={COLORS.rsi} fillOpacity="0.06" />
              <rect x={CHART_L} y={rsiToY(30)} width={CHART_W}
                    height={rsiToY(0) - rsiToY(30)}
                    fill={COLORS.rsi} fillOpacity="0.06" />
              {/* Grid lines: 0, 30, 50, 70, 100 */}
              {[0, 30, 50, 70, 100].map(v => (
                <g key={`rsi-g-${v}`}>
                  <line x1={CHART_L} y1={rsiToY(v)} x2={CHART_R} y2={rsiToY(v)}
                        stroke={gridColor} strokeDasharray="4 4" />
                  <text x={CHART_L - 6} y={rsiToY(v) + 3} textAnchor="end"
                        fontSize="9" fill={textColor}>{v}</text>
                </g>
              ))}
              {/* RSI line */}
              <path d={buildLinePath(rsiData, toX, rsiToY)}
                    stroke={COLORS.rsi} strokeWidth="1.5" fill="none" />
            </g>
          )}

          {/* === MACD Panel === */}
          {indicators.macd && macdData && (
            <g>
              {/* Separator */}
              <line x1={CHART_L} y1={macdPanelTop - PANEL_GAP / 2} x2={CHART_R} y2={macdPanelTop - PANEL_GAP / 2}
                    stroke={gridColor} />
              {/* Label */}
              <text x={CHART_L - 6} y={macdPanelTop + 12} textAnchor="end"
                    fontSize="9" fill={textColor}>MACD</text>
              {/* Zero line */}
              <line x1={CHART_L} y1={macdToY(0)} x2={CHART_R} y2={macdToY(0)}
                    stroke={gridColor} strokeDasharray="4 4" />
              {/* Histogram bars */}
              {macdData.histogram.map((v, i) => {
                if (v == null) return null;
                const x = toX(i);
                const barW = Math.max(1, CHART_W / data.length * 0.7);
                const y0 = macdToY(0);
                const yv = macdToY(v);
                return (
                  <rect key={`mh${i}`}
                        x={x - barW / 2}
                        y={Math.min(y0, yv)}
                        width={barW}
                        height={Math.abs(yv - y0) || 0.5}
                        fill={v >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'} />
                );
              })}
              {/* MACD line */}
              <path d={buildLinePath(macdData.macd, toX, macdToY)}
                    stroke={COLORS.macdLine} strokeWidth="1.5" fill="none" />
              {/* Signal line */}
              <path d={buildLinePath(macdData.signal, toX, macdToY)}
                    stroke={COLORS.macdSignal} strokeWidth="1.5" fill="none" />
            </g>
          )}

          {/* Crosshair */}
          {hover && (
            <line x1={hoverX} y1={CHART_T} x2={hoverX} y2={crosshairBottom}
                  stroke={dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                  strokeDasharray="4 4" />
          )}
        </svg>

        {/* Tooltip (HTML overlay) */}
        {hover && hoverPoint && (
          <div
            className="absolute bg-surface-900/95 dark:bg-surface-100/95 text-white dark:text-surface-900
                       text-xs rounded-lg shadow-xl px-3 py-2 pointer-events-none z-50 whitespace-nowrap"
            style={{
              left: Math.min(hover.clientX + 12, (containerRef.current?.clientWidth || 300) - 180),
              top: Math.max(8, hover.clientY - 80),
            }}
          >
            <div className="font-semibold mb-1">{hoverPoint.date}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono">
              <span className="text-surface-400 dark:text-surface-500">{t('chart.open')}</span>
              <span>{hoverPoint.open.toFixed(2)}</span>
              <span className="text-surface-400 dark:text-surface-500">{t('chart.high')}</span>
              <span>{hoverPoint.high.toFixed(2)}</span>
              <span className="text-surface-400 dark:text-surface-500">{t('chart.low')}</span>
              <span>{hoverPoint.low.toFixed(2)}</span>
              <span className="text-surface-400 dark:text-surface-500">{t('chart.close')}</span>
              <span>{hoverPoint.close.toFixed(2)}</span>
              <span className="text-surface-400 dark:text-surface-500">{t('chart.volume')}</span>
              <span>{hoverPoint.volume.toLocaleString()}</span>
              {tooltipIndicators.map(ind => (
                <React.Fragment key={ind.label}>
                  <span style={{ color: ind.color }}>{ind.label}</span>
                  <span>{ind.value.toFixed(2)}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StockChart = React.memo(StockChartInner);
export default StockChart;
