import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import HealthMethodology from './HealthMethodology';
import { Shield, TrendingUp, Droplets, Scale, Zap, BarChart3 } from 'lucide-react';

// Pięć obszarów oceny — kolejność i etykiety te same, co w `HEALTH_CRITERIA`. Wyceny tu
// nie ma celowo: ocena kondycji nie wypowiada się o cenie akcji (P8+D10e).
const CATEGORIES = [
  { key: 'profitability', labelKey: 'stock.profitability', icon: TrendingUp },
  { key: 'leverage',      labelKey: 'stock.leverage',      icon: Scale },
  { key: 'growth',        labelKey: 'stock.growthScore',   icon: BarChart3 },
  { key: 'liquidity',     labelKey: 'stock.liquidity',     icon: Droplets },
  { key: 'efficiency',    labelKey: 'stock.efficiency',    icon: Zap },
];

export default function HealthScore({ health, loading = false }) {
  const { t } = useLang();
  const { dark } = useTheme();

  const { score = null, label = null, categories = {}, usedWeight = 0 } = health || {};

  // Brak oceny to osobny stan, nie zero punktów. Pierścień z zerem i podpisem „Krytyczna"
  // byłby werdyktem o spółce, o której nie mamy danych (P1 §3).
  if (score == null) {
    return (
      <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
        {loading ? t('stock.healthLoading') : t('stock.healthNoData')}
      </p>
    );
  }

  const colorMap = {
    strong: { bg: 'bg-up/10', text: 'text-up' },
    good: { bg: 'bg-up/10', text: 'text-up' },
    neutral: { bg: 'bg-warn/10', text: 'text-warn' },
    weak: { bg: 'bg-down/10', text: 'text-down' },
    critical: { bg: 'bg-down/10', text: 'text-down' },
  };
  const colors = colorMap[label];
  const accent =
    label === 'strong' || label === 'good' ? '#10b981'
    : label === 'neutral' ? '#f59e0b'
    : '#ef4444';

  const rows = CATEGORIES.map(c => ({ ...c, score: categories[c.key]?.score ?? null }));
  const complete = rows.every(r => r.score != null);
  const areasWithData = rows.filter(r => r.score != null).length;

  const coverage = complete
    ? t('stock.healthCoverageFull')
    : t('stock.healthCoveragePartial')
        .replace('{used}', String(areasWithData))
        .replace('{total}', String(rows.length))
        .replace('{weight}', String(usedWeight));

  // Radar rysujemy **tylko przy pełnych pięciu obszarach**. Wielokąt poprowadzony przez
  // trzy z pięciu osi dociskałby brakujące do środka, czyli pokazywałby zero tam, gdzie nie
  // mamy danych — a to dokładnie ta pomyłka, którą całe zadanie usuwa.
  const cx = 130, cy = 130, r = 95;
  const angles = rows.map((_, i) => (Math.PI * 2 * i) / rows.length - Math.PI / 2);
  const points = rows.map((c, i) => {
    const ratio = (c.score ?? 0) / 100;
    return {
      x: cx + r * ratio * Math.cos(angles[i]),
      y: cy + r * ratio * Math.sin(angles[i]),
    };
  });
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridStroke = dark ? '#252840' : '#e4e7f0';

  return (
    <div className="space-y-8">
      {/* Main score */}
      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Circular score */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={dark ? '#1a1d2e' : '#e4e7f0'}
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 327} 327`}
              transform="rotate(-90 60 60)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display font-bold text-3xl ${colors.text}`}>
              {score}
            </span>
            <span className="text-xs text-surface-500">/100</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-5 h-5 ${colors.text}`} />
            <span className="font-display font-bold text-xl">
              {t('stock.healthScore')}
            </span>
          </div>
          <span className={`badge ${colors.bg} ${colors.text} text-sm`}>
            {t(`stock.${label}`)}
          </span>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-3 max-w-md leading-relaxed">
            {t(`stock.healthDesc.${label}`)}
          </p>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-2 max-w-md leading-relaxed">
            {coverage}
          </p>
        </div>
      </div>

      {/* Radar + category bars */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {complete && (
          <div className="w-64 h-64 flex-shrink-0">
            <svg viewBox="0 0 260 260" role="img" aria-label={t('stock.healthScore')}>
              {/* Grid */}
              {gridLevels.map(level => (
                <polygon
                  key={level}
                  points={angles.map(a =>
                    `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`
                  ).join(' ')}
                  fill="none"
                  stroke={gridStroke}
                  strokeWidth="1"
                />
              ))}
              {/* Axis lines */}
              {angles.map((a, i) => (
                <line
                  key={i}
                  x1={cx} y1={cy}
                  x2={cx + r * Math.cos(a)}
                  y2={cy + r * Math.sin(a)}
                  stroke={gridStroke}
                  strokeWidth="1"
                />
              ))}
              {/* Data polygon */}
              <polygon
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill={accent}
                fillOpacity="0.15"
                stroke={accent}
                strokeWidth="2"
              />
              {/* Data points */}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill={accent} />
              ))}
              {/* Labels */}
              {rows.map((c, i) => (
                <text
                  key={c.key}
                  x={cx + (r + 22) * Math.cos(angles[i])}
                  y={cy + (r + 22) * Math.sin(angles[i])}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-medium fill-surface-500"
                >
                  {t(c.labelKey)}
                </text>
              ))}
            </svg>
          </div>
        )}

        {/* Category bars */}
        <div className="flex-1 w-full space-y-4">
          {rows.map(c => {
            const Icon = c.icon;
            const missing = c.score == null;
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-surface-400" />
                    <span className="text-sm font-medium">{t(c.labelKey)}</span>
                  </div>
                  <span className={`font-mono text-sm font-medium ${missing ? 'text-surface-400 dark:text-surface-500' : ''}`}>
                    {missing ? t('stock.band.noData') : `${c.score}/100`}
                  </span>
                </div>
                <div className="h-2 bg-surface-200/60 dark:bg-surface-800/60 rounded-full overflow-hidden">
                  {!missing && (
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        c.score >= 65 ? 'bg-up' : c.score >= 40 ? 'bg-warn' : 'bg-down'
                      }`}
                      style={{ width: `${c.score}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <HealthMethodology />
    </div>
  );
}
