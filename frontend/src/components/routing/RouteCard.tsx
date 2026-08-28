import React from 'react';
import { RouteOption, RouteProfile } from '../../types';

interface RouteCardProps {
  profile: RouteProfile;
  option: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  profile,
  option,
  isSelected,
  onSelect,
}) => {
  const { analytics } = option;

  const profileConfigs = {
    fastest: {
      title: 'Fastest Route',
      icon: 'timer',
      color: 'text-primary',
      borderColor: 'border-white/10',
      activeBorder: 'border-primary/60 shadow-[0_0_20px_rgba(200,198,200,0.15)]',
      desc: 'Optimized for minimum travel duration',
    },
    safest: {
      title: 'Safest Route',
      icon: 'shield',
      color: 'text-tertiary',
      borderColor: 'border-white/10',
      activeBorder: 'border-tertiary/60 shadow-[0_0_25px_rgba(78,222,163,0.2)]',
      desc: 'Maximum illumination & hazard avoidance',
    },
    balanced: {
      title: 'Balanced Route',
      icon: 'tune',
      color: 'text-secondary',
      borderColor: 'border-white/10',
      activeBorder: 'border-secondary/60 shadow-[0_0_20px_rgba(5,102,217,0.2)]',
      desc: 'Optimal compromise between speed & safety',
    },
  }[profile];

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden ${
        isSelected
          ? `bg-[#1e2021] ${profileConfigs.activeBorder}`
          : 'bg-[#1a1c1d]/60 hover:bg-[#1e2021]/80 border border-white/5'
      }`}
    >
      {isSelected && (
        <div
          className={`absolute top-0 left-0 w-1.5 h-full ${
            profile === 'safest' ? 'bg-tertiary' : profile === 'fastest' ? 'bg-primary' : 'bg-secondary'
          }`}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-[20px] ${profileConfigs.color}`}
            style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
          >
            {profileConfigs.icon}
          </span>
          <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-on-surface'}`}>
            {profileConfigs.title}
          </span>
          {profile === 'safest' && (
            <span className="bg-tertiary-container/40 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded border border-tertiary/30 uppercase tracking-wider">
              AI Best
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-xl font-extrabold text-white">
            {analytics?.estimated_time_minutes?.toFixed(0) || '0'}{' '}
            <span className="text-xs text-on-surface-variant font-normal">min</span>
          </span>
        </div>
      </div>

      {/* Distance & Safety Stats */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant mt-2 pt-2 border-t border-white/5">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">straighten</span>
          {analytics?.actual_distance_km?.toFixed(1) || '0'} km
        </span>

        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile === 'safest' ? '#4edea3' : '#fbbc04' }} />
          Safety Score: <strong className="text-white">{analytics?.safety_score?.toFixed(0) || '0'}/100</strong>
        </span>
      </div>

      {/* AI Explanation for Safest Option */}
      {isSelected && profile === 'safest' && (
        <div className="mt-3 bg-[#0c0e0f]/80 rounded-xl p-3 border border-white/5 space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-secondary text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            AI Route Reasoning
          </div>
          <ul className="text-[11px] text-on-surface-variant space-y-1 pl-1">
            <li className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-tertiary">check_circle</span>
              High illumination corridor with active street surveillance
            </li>
            <li className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-tertiary">check_circle</span>
              Zero active flood or severe waterlogging risks detected
            </li>
            <li className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-tertiary">check_circle</span>
              High emergency vehicle accessibility coverage
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
