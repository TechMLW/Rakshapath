import React from 'react';

interface SafetyScoreGaugeProps {
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SafetyScoreGauge: React.FC<SafetyScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const isAvailable = score !== null && score !== undefined && !isNaN(score);
  const clampedScore = isAvailable ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDashoffset = isAvailable ? circumference - (clampedScore / 100) * circumference : circumference;

  let strokeColor = '#7e7d7f';
  let labelText = 'No AI Data';
  let badgeBg = 'bg-white/10 text-on-surface-variant border-white/10';

  if (isAvailable) {
    if (clampedScore >= 80) {
      strokeColor = '#4edea3'; // Safe Green
      labelText = 'Very Safe';
      badgeBg = 'bg-tertiary-container/30 text-tertiary border-tertiary/20';
    } else if (clampedScore >= 60) {
      strokeColor = '#fbbc04'; // Moderate Yellow
      labelText = 'Moderate';
      badgeBg = 'bg-[#fbbc04]/20 text-[#fbbc04] border-[#fbbc04]/30';
    } else {
      strokeColor = '#ffb4ab'; // Danger Red
      labelText = 'High Risk';
      badgeBg = 'bg-error-container/30 text-error border-error/20';
    }
  }

  const dimensions = {
    sm: { box: 'w-12 h-12', icon: 'text-[14px]', font: 'text-sm' },
    md: { box: 'w-16 h-16', icon: 'text-[18px]', font: 'text-xl' },
    lg: { box: 'w-24 h-24', icon: 'text-[24px]', font: 'text-3xl' },
  }[size];

  return (
    <div className="flex items-center gap-3">
      {/* Circular Gauge */}
      <div className={`relative ${dimensions.box} flex items-center justify-center`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-surface-highest"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={strokeColor}
            strokeDasharray="100, 100"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth="3"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>

        <span
          className={`absolute material-symbols-outlined ${dimensions.icon}`}
          style={{ color: strokeColor, fontVariationSettings: "'FILL' 1" }}
        >
          shield
        </span>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className={`font-bold ${dimensions.font}`} style={{ color: strokeColor }}>
              {isAvailable ? clampedScore : 'N/A'}
            </span>
            {isAvailable && <span className="text-xs text-on-surface-variant">/100</span>}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border mt-0.5 ${badgeBg}`}>
            {labelText}
          </span>
        </div>
      )}
    </div>
  );
};
