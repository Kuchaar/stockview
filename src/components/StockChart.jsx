import React, { useState, useMemo, useCallback, useRef } from 'react';
import useHistoricalPrices from '../hooks/useHistoricalPrices';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { Loader2 } from 'lucide-react';

// SVG layout constants
const VB_W = 800, VB_H = 450;
const CHART_L = 60, CHART_R = 790, CHART_T = 10, CHART_B = 330;
const VOL_T = 350, VOL_B = 430;
const CHART_W = CHART_R - CHART_L;
const CHART_H = CHART_B - CHART_T;
const VOL_H = VOL_B - VOL_T;

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

function formatDateLabel(dateStr, rangeKey, lang) {
  const [y, m, d] = dateStr.split('-');
  const months = lang === 'pl' ? MONTHS_PL : MONTHS_EN;
  if (rangeKey === '1m' || rangeKey === '3m') {
    return `${d}.${m}`;
  }
  if (rangeKey === '6m' || rangeKey === '1y') {
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
  }
  return y;
}

function filterByRange(data, rangeKey) {
  if (rangeKey === 'max' || !data.length) return data;
  const range = RANGES.find(r => r.key === rangeKey);
  if (!range) return data;
  return data.slice(Math.max(0, data.length - range.days));
}

function StockChartInner({ ticker, className }) {
  const { t, lang } = useLang();
  const { dark } = useTheme();
  const { data: allData, loading, error, refetch } = useHistoricalPrices(ticker);

  const [mode, setMode] = useState('line');
  const [rangeKey, setRangeKey] = useState('1y');
  const [hover, setHover] = useState(null); // { index, clientX, clientY }

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const data = useMemo(() => filterByRange(allData, rangeKey), [allData, rangeKey]);

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
    const pad = (mx - mn) * 0.05 || 1;
    return { minPrice: mn - pad, maxPrice: mx + pad, maxVol: mv || 1, priceRange: (mx + pad) - (mn - pad) };
  }, [data, mode]);

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
      const x = CHART_L + (i / (data.length - 1 || 1)) * CHART_W;
      labels.push({ x, label: formatDateLabel(data[i].date, rangeKey, lang) });
    }
    return labels;
  }, [data, rangeKey, lang]);

  // Crosshair handler
  const handlePointerMove = useCallback((e) => {
    if (!data.length || !containerRef.current || !svgRef.current) return;
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
           style={{ aspectRatio: '800/450' }}>
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
  const hoverX = hover ? CHART_L + (hover.index / (data.length - 1 || 1)) * CHART_W : 0;

  // Candle width
  const candleW = Math.max(1, Math.min(8, (CHART_W / data.length) - 1));

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
          viewBox={`0 0 ${VB_W} ${VB_H}`}
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
            <text key={i} x={l.x} y={440} textAnchor="middle"
                  fontSize="10" fill={textColor}>{l.label}</text>
          ))}

          {/* Volume bars */}
          {data.map((d, i) => {
            const x = CHART_L + (i / (data.length - 1 || 1)) * CHART_W;
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
              {/* Gradient fill */}
              <path
                d={
                  data.map((d, i) => {
                    const x = CHART_L + (i / (data.length - 1 || 1)) * CHART_W;
                    const y = priceToY(d.close);
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  }).join(' ') +
                  ` L${CHART_R},${CHART_B} L${CHART_L},${CHART_B} Z`
                }
                fill="url(#lineGradient)"
              />
              {/* Line */}
              <path
                d={data.map((d, i) => {
                  const x = CHART_L + (i / (data.length - 1 || 1)) * CHART_W;
                  const y = priceToY(d.close);
                  return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ')}
                stroke="#22c55e" strokeWidth="1.5" fill="none"
              />
            </>
          ) : (
            /* Candle mode */
            data.map((d, i) => {
              const x = CHART_L + (i / (data.length - 1 || 1)) * CHART_W;
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

          {/* Crosshair */}
          {hover && (
            <line x1={hoverX} y1={CHART_T} x2={hoverX} y2={VOL_B}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StockChart = React.memo(StockChartInner);
export default StockChart;
