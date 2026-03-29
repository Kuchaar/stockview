import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { calculateHealthScore, calculateSubScores } from '../data/wig20';
import { Shield, TrendingUp, Droplets, Scale, Zap, DollarSign } from 'lucide-react';

export default function HealthScore({ ratios }) {
  const { t } = useLang();
  const { dark } = useTheme();
  const { score, label } = calculateHealthScore(ratios);
  const subs = calculateSubScores(ratios);

  const colorMap = {
    strong: { ring: 'text-up', bg: 'bg-up/10', text: 'text-up' },
    good: { ring: 'text-up', bg: 'bg-up/10', text: 'text-up' },
    neutral: { ring: 'text-warn', bg: 'bg-warn/10', text: 'text-warn' },
    weak: { ring: 'text-down', bg: 'bg-down/10', text: 'text-down' },
    critical: { ring: 'text-down', bg: 'bg-down/10', text: 'text-down' },
  };
  const colors = colorMap[label];

  const categories = [
    { key: 'profitability', icon: TrendingUp, val: subs.profitability },
    { key: 'liquidity', icon: Droplets, val: subs.liquidity },
    { key: 'leverage', icon: Scale, val: subs.leverage },
    { key: 'efficiency', icon: Zap, val: subs.efficiency },
    { key: 'valuationScore', icon: DollarSign, val: subs.valuation },
  ];

  // SVG radar chart
  const cx = 130, cy = 130, r = 95;
  const angles = categories.map((_, i) => (Math.PI * 2 * i) / categories.length - Math.PI / 2);
  const points = categories.map((c, i) => {
    const ratio = c.val / 100;
    return {
      x: cx + r * ratio * Math.cos(angles[i]),
      y: cy + r * ratio * Math.sin(angles[i]),
    };
  });
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

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
              stroke={
                label === 'strong' || label === 'good' ? '#10b981'
                : label === 'neutral' ? '#f59e0b'
                : '#ef4444'
              }
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
          <p className="text-sm text-surface-500 mt-3 max-w-md leading-relaxed">
            {getDescription(label, t)}
          </p>
        </div>
      </div>

      {/* Radar */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="w-64 h-64 flex-shrink-0">
          <svg viewBox="0 0 260 260">
            {/* Grid */}
            {gridLevels.map(level => (
              <polygon
                key={level}
                points={angles.map(a =>
                  `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`
                ).join(' ')}
                fill="none"
                stroke={dark ? '#252840' : '#e4e7f0'}
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
                stroke={dark ? '#252840' : '#e4e7f0'}
                strokeWidth="1"
              />
            ))}
            {/* Data polygon */}
            <polygon
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill={label === 'strong' || label === 'good' ? 'rgba(16,185,129,0.15)'
                : label === 'neutral' ? 'rgba(245,158,11,0.15)'
                : 'rgba(239,68,68,0.15)'}
              stroke={label === 'strong' || label === 'good' ? '#10b981'
                : label === 'neutral' ? '#f59e0b'
                : '#ef4444'}
              strokeWidth="2"
            />
            {/* Data points */}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4"
                fill={label === 'strong' || label === 'good' ? '#10b981'
                  : label === 'neutral' ? '#f59e0b'
                  : '#ef4444'}
              />
            ))}
            {/* Labels */}
            {categories.map((c, i) => {
              const lx = cx + (r + 22) * Math.cos(angles[i]);
              const ly = cy + (r + 22) * Math.sin(angles[i]);
              return (
                <text
                  key={c.key}
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-medium fill-surface-500"
                >
                  {t(`stock.${c.key}`)}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Category bars */}
        <div className="flex-1 w-full space-y-4">
          {categories.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-surface-400" />
                    <span className="text-sm font-medium">{t(`stock.${c.key}`)}</span>
                  </div>
                  <span className="font-mono text-sm font-medium">{c.val}/100</span>
                </div>
                <div className="h-2 bg-surface-200/60 dark:bg-surface-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      c.val >= 65 ? 'bg-up' : c.val >= 40 ? 'bg-warn' : 'bg-down'
                    }`}
                    style={{ width: `${c.val}%` }}
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

function getDescription(label, t) {
  const map = {
    strong: {
      pl: 'Spółka wykazuje silne fundamenty — wysoka rentowność, zdrowy bilans i atrakcyjna wycena.',
      en: 'The company shows strong fundamentals — high profitability, healthy balance sheet, and attractive valuation.',
    },
    good: {
      pl: 'Spółka jest w dobrej kondycji finansowej z większością wskaźników powyżej średniej.',
      en: 'The company is in good financial health with most metrics above average.',
    },
    neutral: {
      pl: 'Kondycja spółki jest neutralna — niektóre obszary wymagają uwagi.',
      en: 'Company health is neutral — some areas need attention.',
    },
    weak: {
      pl: 'Spółka wykazuje słabości w kilku kluczowych obszarach finansowych.',
      en: 'The company shows weaknesses in several key financial areas.',
    },
    critical: {
      pl: 'Spółka jest w trudnej sytuacji finansowej — należy zachować szczególną ostrożność.',
      en: 'The company is in a difficult financial situation — exercise extreme caution.',
    },
  };
  const lang = t('nav.home') === 'Przegląd' ? 'pl' : 'en';
  return map[label]?.[lang] || '';
}
