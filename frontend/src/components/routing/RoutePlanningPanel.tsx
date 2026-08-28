import React, { useState } from 'react';
import { GPSPoint, RouteProfile, RouteOption } from '../../types';
import { RouteCard } from './RouteCard';

export interface RegionConfig {
  id: string;
  name: string;
  landmarks: GPSPoint[];
}

export const ALL_REGIONS: RegionConfig[] = [
  {
    id: 'bhubaneswar',
    name: 'Bhubaneswar (Odisha)',
    landmarks: [
      { name: 'Master Canteen Square', latitude: 20.2644, longitude: 85.8402 },
      { name: 'Infocity / Patia', latitude: 20.3537, longitude: 85.8195 },
      { name: 'KIIT University Campus', latitude: 20.3540, longitude: 85.8180 },
      { name: 'Biju Patnaik Airport', latitude: 20.2528, longitude: 85.8178 },
      { name: 'Jaydev Vihar Overbridge', latitude: 20.3012, longitude: 85.8211 },
      { name: 'Rasulgarh Square', latitude: 20.2905, longitude: 85.8654 },
      { name: 'AIIMS Bhubaneswar', latitude: 20.2312, longitude: 85.7761 },
    ],
  },
  {
    id: 'assam',
    name: 'Assam (Guwahati)',
    landmarks: [
      { name: 'Guwahati Hub', latitude: 26.1445, longitude: 91.7362 },
      { name: 'Dispur Secretariat', latitude: 26.1408, longitude: 91.7903 },
    ],
  },
  {
    id: 'meghalaya',
    name: 'Meghalaya (Shillong)',
    landmarks: [
      { name: 'Shillong Center', latitude: 25.5788, longitude: 91.8933 },
      { name: 'Cherrapunji / Sohra', latitude: 25.2986, longitude: 91.5822 },
    ],
  },
  {
    id: 'arunachal_pradesh',
    name: 'Arunachal Pradesh (Itanagar)',
    landmarks: [
      { name: 'Itanagar Hub', latitude: 27.0844, longitude: 93.6053 },
      { name: 'Naharlagun', latitude: 27.0987, longitude: 93.6325 },
    ],
  },
  {
    id: 'nagaland',
    name: 'Nagaland (Kohima)',
    landmarks: [
      { name: 'Kohima City', latitude: 25.6751, longitude: 94.1086 },
      { name: 'Dimapur Station', latitude: 25.9068, longitude: 93.7273 },
    ],
  },
  {
    id: 'manipur',
    name: 'Manipur (Imphal)',
    landmarks: [
      { name: 'Imphal Center', latitude: 24.8170, longitude: 93.9368 },
      { name: 'Churachandpur', latitude: 24.4960, longitude: 93.7865 },
    ],
  },
  {
    id: 'mizoram',
    name: 'Mizoram (Aizawl)',
    landmarks: [
      { name: 'Aizawl Center', latitude: 23.7271, longitude: 92.7176 },
      { name: 'Lengpui Gateway', latitude: 23.7460, longitude: 92.6840 },
    ],
  },
  {
    id: 'tripura',
    name: 'Tripura (Agartala)',
    landmarks: [
      { name: 'Agartala Center', latitude: 23.8315, longitude: 91.2868 },
      { name: 'Udaipur', latitude: 23.5350, longitude: 91.4880 },
    ],
  },
  {
    id: 'sikkim',
    name: 'Sikkim (Gangtok)',
    landmarks: [
      { name: 'Gangtok Hub', latitude: 27.3389, longitude: 88.6065 },
      { name: 'Namchi', latitude: 27.1670, longitude: 88.3630 },
    ],
  },
  {
    id: 'northeast',
    name: 'North East (Combined)',
    landmarks: [
      { name: 'Guwahati Gateway', latitude: 26.1445, longitude: 91.7362 },
      { name: 'Shillong Corridor', latitude: 25.5788, longitude: 91.8933 },
    ],
  },
];

export const PRESET_LOCATIONS: GPSPoint[] = ALL_REGIONS[0].landmarks;

interface RoutePlanningPanelProps {
  origin: GPSPoint | null;
  destination: GPSPoint | null;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  onSetOrigin: (point: GPSPoint) => void;
  onSetDestination: (point: GPSPoint) => void;
  routes: {
    fastest?: RouteOption;
    safest?: RouteOption;
    balanced?: RouteOption;
  } | null;
  selectedProfile: RouteProfile;
  onSelectProfile: (profile: RouteProfile) => void;
  onCalculateRoute: () => void;
  onStartNavigation: () => void;
  loading: boolean;
  error: string | null;
}

export const RoutePlanningPanel: React.FC<RoutePlanningPanelProps> = ({
  origin,
  destination,
  selectedRegion,
  onSelectRegion,
  onSetOrigin,
  onSetDestination,
  routes,
  selectedProfile,
  onSelectProfile,
  onCalculateRoute,
  onStartNavigation,
  loading,
  error,
}) => {
  const [womensSafetyMode, setWomensSafetyMode] = useState(true);
  const [nightTravelMode, setNightTravelMode] = useState(false);

  const activeRegion = ALL_REGIONS.find((r) => r.id === selectedRegion) || ALL_REGIONS[0];

  const handleSwap = () => {
    if (origin && destination) {
      const temp = { ...origin };
      onSetOrigin(destination);
      onSetDestination(temp);
    }
  };

  return (
    <aside className="glass-panel w-full md:w-[420px] rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-white/10 max-h-[calc(100vh-120px)] transition-all">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-[#1e2021]/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">alt_route</span>
            Plan Route
          </h2>
          <span className="text-[10px] font-semibold text-tertiary bg-tertiary-container/30 border border-tertiary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            AI Guard Active
          </span>
        </div>

        {/* Region Selector */}
        <div className="mb-3">
          <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">
            Active Regional Graph
          </label>
          <div className="bg-[#121415]/90 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[16px]">public</span>
            <select
              value={selectedRegion}
              onChange={(e) => {
                const regId = e.target.value;
                onSelectRegion(regId);
                const reg = ALL_REGIONS.find((r) => r.id === regId);
                if (reg && reg.landmarks.length >= 2) {
                  onSetOrigin(reg.landmarks[0]);
                  onSetDestination(reg.landmarks[1]);
                }
              }}
              className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              {ALL_REGIONS.map((reg) => (
                <option key={reg.id} value={reg.id} className="bg-[#1e2021] text-white">
                  {reg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Origin & Destination Form */}
        <div className="relative flex flex-col gap-3">
          {/* Vertical route guide line */}
          <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-outline-variant/40 flex flex-col justify-between items-center">
            <div className="w-2 h-2 rounded-full bg-secondary -mt-1 -ml-[3px]" />
            <div className="w-2 h-2 rounded-full bg-tertiary -mb-1 -ml-[3px]" />
          </div>

          {/* Origin Input */}
          <div className="pl-8 relative">
            <div className="bg-[#121415]/80 border border-white/10 focus-within:border-secondary rounded-xl px-3 py-2.5 flex items-center gap-2 transition-all">
              <span className="material-symbols-outlined text-secondary text-[18px]">my_location</span>
              <input
                type="text"
                readOnly
                value={origin ? origin.name || `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}` : ''}
                placeholder="Choose starting point (or click map)..."
                className="w-full bg-transparent text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-end pr-2 -my-2 relative z-10">
            <button
              onClick={handleSwap}
              title="Swap Origin and Destination"
              className="w-7 h-7 rounded-full bg-[#282a2b] border border-white/10 text-on-surface-variant hover:text-white flex items-center justify-center hover:bg-white/10 transition-all active:rotate-180 duration-200"
            >
              <span className="material-symbols-outlined text-[16px]">swap_vert</span>
            </button>
          </div>

          {/* Destination Input */}
          <div className="pl-8 relative">
            <div className="bg-[#121415]/80 border border-white/10 focus-within:border-tertiary rounded-xl px-3 py-2.5 flex items-center gap-2 transition-all">
              <span className="material-symbols-outlined text-tertiary text-[18px]">location_on</span>
              <input
                type="text"
                readOnly
                value={destination ? destination.name || `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}` : ''}
                placeholder="Choose destination (or click map)..."
                className="w-full bg-transparent text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>
        </div>

        {/* Quick Landmark Presets */}
        <div className="mt-3.5">
          <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-2">
            Quick {activeRegion.name.split(' ')[0]} Locations:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {activeRegion.landmarks.map((loc) => (
              <button
                key={loc.name}
                onClick={() => {
                  if (!origin) {
                    onSetOrigin({ latitude: loc.latitude, longitude: loc.longitude, name: loc.name });
                  } else {
                    onSetDestination({ latitude: loc.latitude, longitude: loc.longitude, name: loc.name });
                  }
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#282a2b]/70 hover:bg-secondary-container/40 hover:text-white text-xs text-on-surface-variant border border-white/5 transition-colors"
              >
                {loc.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Route List & Options (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {error && (
          <div className="bg-error-container/20 border border-error/40 text-error p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {routes ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
              <span>Optimized Routes</span>
              <span className="text-tertiary">Real-time Graphs</span>
            </div>

            {routes.safest && (
              <RouteCard
                profile="safest"
                option={routes.safest}
                isSelected={selectedProfile === 'safest'}
                onSelect={() => onSelectProfile('safest')}
              />
            )}

            {routes.balanced && (
              <RouteCard
                profile="balanced"
                option={routes.balanced}
                isSelected={selectedProfile === 'balanced'}
                onSelect={() => onSelectProfile('balanced')}
              />
            )}

            {routes.fastest && (
              <RouteCard
                profile="fastest"
                option={routes.fastest}
                isSelected={selectedProfile === 'fastest'}
                onSelect={() => onSelectProfile('fastest')}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline opacity-40">
              map
            </span>
            <p className="text-xs">
              Select origin and destination to compute AI-ranked routes over real OSM graph networks.
            </p>
          </div>
        )}

        {/* Safety Mode Toggles */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">female</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Women's Safety Mode</p>
                <p className="text-[10px] text-on-surface-variant">Prioritizes populated, well-lit corridors</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={womensSafetyMode}
                onChange={(e) => setWomensSafetyMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tertiary" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">dark_mode</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Night Travel Protocols</p>
                <p className="text-[10px] text-on-surface-variant">Avoids isolated road segments</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={nightTravelMode}
                onChange={(e) => setNightTravelMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary-container" />
            </label>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 border-t border-white/10 bg-[#121415]/90">
        {!routes ? (
          <button
            onClick={onCalculateRoute}
            disabled={!origin || !destination || loading}
            className="w-full bg-secondary-container hover:bg-secondary-container/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/10"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Computing Ranked Routes...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">psychology</span>
                Find Safest Routes
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onStartNavigation}
            className="w-full bg-tertiary text-[#003824] hover:bg-tertiary-fixed font-bold py-3.5 px-6 rounded-2xl shadow-[0_0_25px_rgba(78,222,163,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">navigation</span>
            Start Safe Navigation
          </button>
        )}
      </div>
    </aside>
  );
};
