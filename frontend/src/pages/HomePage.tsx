import React from 'react';
import { GPSPoint, RouteOption } from '../types';
import { SafetyScoreGauge } from '../components/common/SafetyScoreGauge';
import { PRESET_LOCATIONS } from '../components/routing/RoutePlanningPanel';

interface HomePageProps {
  origin: GPSPoint | null;
  destination: GPSPoint | null;
  onSetOrigin: (point: GPSPoint) => void;
  onSetDestination: (point: GPSPoint) => void;
  onNavigateToRoutes: () => void;
  onStartNavigation: () => void;
  routes: {
    fastest?: RouteOption;
    safest?: RouteOption;
    balanced?: RouteOption;
  } | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  origin,
  destination,
  onSetOrigin,
  onSetDestination,
  onNavigateToRoutes,
  onStartNavigation,
  routes,
}) => {
  const currentRoute = routes?.safest || routes?.balanced || routes?.fastest;

  return (
    <>
      {/* Floating Search Bar (Top Left) */}
      <div className="absolute top-20 md:top-24 left-4 md:left-8 z-30 w-full max-w-sm pointer-events-auto">
        <div className="glass-panel rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5 border border-white/10">
          <div className="flex items-center gap-2.5 bg-[#121415]/70 rounded-xl px-3 py-2 border border-white/10">
            <span className="material-symbols-outlined text-secondary text-[18px]">my_location</span>
            <input
              type="text"
              readOnly
              value={origin?.name || 'Master Canteen Square'}
              placeholder="Origin"
              className="w-full bg-transparent text-xs text-white focus:outline-none"
            />
          </div>

          <div
            onClick={onNavigateToRoutes}
            className="flex items-center gap-2.5 bg-[#121415]/70 rounded-xl px-3 py-2 border border-white/10 cursor-pointer hover:border-tertiary transition-colors"
          >
            <span className="material-symbols-outlined text-tertiary text-[18px]">search</span>
            <input
              type="text"
              readOnly
              value={destination?.name || 'Where to? (e.g. Infocity, KIIT)'}
              placeholder="Where to?"
              className="w-full bg-transparent text-xs text-on-surface-variant cursor-pointer focus:outline-none"
            />
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5 overflow-x-auto pt-1 scrollbar-none">
            {PRESET_LOCATIONS.slice(0, 4).map((loc) => (
              <button
                key={loc.name}
                onClick={() => {
                  onSetDestination({ latitude: loc.latitude, longitude: loc.longitude, name: loc.name });
                  onNavigateToRoutes();
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#282a2b]/70 hover:bg-secondary-container/40 hover:text-white text-[11px] text-on-surface-variant border border-white/5 transition-colors"
              >
                {loc.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Route Summary Card (Matching Stitch Desktop & Mobile Home) */}
      <div className="absolute bottom-24 md:bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 z-30 pointer-events-auto">
        <div className="glass-panel rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden border border-white/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tertiary to-transparent" />

          {/* Left Details */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="bg-tertiary-container/30 text-tertiary px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-tertiary/20 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">psychology</span>
                AI Recommended Safe Corridor
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {destination?.name ? `Route to ${destination.name}` : 'Bhubaneswar Smart Safety Corridor'}
            </h2>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-3 text-xs">
              <div>
                <span className="text-on-surface-variant uppercase text-[10px] block">Est. Time</span>
                <span className="text-lg font-bold text-white">
                  {currentRoute?.analytics?.estimated_time_minutes ? `${currentRoute.analytics.estimated_time_minutes.toFixed(0)} min` : '--'}
                </span>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div>
                <span className="text-on-surface-variant uppercase text-[10px] block">Distance</span>
                <span className="text-lg font-bold text-white">
                  {currentRoute?.analytics?.actual_distance_km ? `${currentRoute.analytics.actual_distance_km.toFixed(1)} km` : '--'}
                </span>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div>
                <span className="text-on-surface-variant uppercase text-[10px] block">Status</span>
                <span className="text-sm font-semibold text-tertiary flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-tertiary" /> {routes ? 'Optimal Route' : 'Ready to Plan'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action & Gauge */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
            <SafetyScoreGauge score={currentRoute?.analytics?.safety_score ?? null} size="md" />

            <button
              onClick={routes ? onStartNavigation : onNavigateToRoutes}
              className="bg-secondary text-on-secondary hover:bg-secondary-fixed font-bold text-xs md:text-sm py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">
                {routes ? 'navigation' : 'route'}
              </span>
              {routes ? 'Start Navigation' : 'View Safe Routes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
