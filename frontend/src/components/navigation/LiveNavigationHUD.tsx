import React from 'react';
import { RouteAnalytics } from '../../types';

interface LiveNavigationHUDProps {
  analytics: RouteAnalytics | null;
  currentStepManeuver?: string;
  currentStreetName?: string;
  distanceToTurnMeters?: number;
  onExitNavigation: () => void;
  onTriggerSimulatedHazard: () => void;
}

export const LiveNavigationHUD: React.FC<LiveNavigationHUDProps> = ({
  analytics,
  currentStepManeuver = 'turn_right',
  currentStreetName = 'Janpath Road / Master Canteen Corridor',
  distanceToTurnMeters = 250,
  onExitNavigation,
  onTriggerSimulatedHazard,
}) => {
  return (
    <div className="absolute inset-x-0 top-20 z-30 pointer-events-none px-4 md:px-8 flex justify-between items-start">
      {/* Turn-by-Turn Card (Top Left) */}
      <div className="glass-panel w-full max-w-sm rounded-3xl p-5 pointer-events-auto shadow-2xl relative overflow-hidden border border-white/15 animate-fadeIn">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-tertiary to-secondary" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container/30 border border-secondary/40 flex items-center justify-center text-secondary shadow-lg">
            <span className="material-symbols-outlined text-3xl font-bold">
              {currentStepManeuver}
            </span>
          </div>

          <div className="flex-1">
            <div className="text-2xl font-black text-white tracking-tight">
              {distanceToTurnMeters} m
            </div>
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              In 250 meters turn onto
            </div>
          </div>
        </div>

        <div className="mt-3 text-base font-bold text-white leading-snug">
          {currentStreetName}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_#4edea3]" />
            <span className="text-xs font-bold text-tertiary">Safe Route Active</span>
          </div>

          <div className="text-right text-xs text-on-surface-variant">
            Safety Score: <strong className="text-white">{analytics?.safety_score !== undefined && analytics?.safety_score !== null ? `${analytics.safety_score.toFixed(0)}/100` : 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* Top Right: Simulation Trigger & Exit Controls */}
      <div className="pointer-events-auto flex flex-col gap-2.5 items-end">
        <button
          onClick={onTriggerSimulatedHazard}
          title="Simulate a new dynamic flood/traffic hazard ahead on route"
          className="glass-panel px-4 py-2.5 rounded-xl text-xs font-bold text-error border border-error/40 hover:bg-error-container/30 shadow-lg transition-all flex items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">flood</span>
          Simulate Road Hazard Ahead
        </button>

        <button
          onClick={onExitNavigation}
          className="glass-panel px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:text-white border border-white/10 hover:bg-white/10 shadow-lg transition-all flex items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">close</span>
          Exit Navigation
        </button>
      </div>
    </div>
  );
};
