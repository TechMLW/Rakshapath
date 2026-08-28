import React from 'react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSOSClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onSOSClick,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-[#121415]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] flex justify-around items-center h-20 px-4 pb-3 md:hidden transition-all duration-300">
      <button
        onClick={() => onSelectTab('explore')}
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
          activeTab === 'explore' ? 'text-secondary font-bold scale-105' : 'text-on-surface-variant opacity-70'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: activeTab === 'explore' ? "'FILL' 1" : "'FILL' 0" }}
        >
          explore
        </span>
        <span className="text-[11px]">Explore</span>
      </button>

      <button
        onClick={() => onSelectTab('routes')}
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
          activeTab === 'routes' ? 'text-secondary font-bold scale-105' : 'text-on-surface-variant opacity-70'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: activeTab === 'routes' ? "'FILL' 1" : "'FILL' 0" }}
        >
          directions
        </span>
        <span className="text-[11px]">Routes</span>
      </button>

      {/* Floating Center SOS */}
      <button
        onClick={onSOSClick}
        className="-mt-8 w-14 h-14 rounded-full bg-[#93000a] text-white flex items-center justify-center shadow-[0_0_20px_rgba(147,0,10,0.8)] border-2 border-error/50 active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          sos
        </span>
      </button>

      <button
        onClick={() => onSelectTab('reports')}
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
          activeTab === 'reports' ? 'text-secondary font-bold scale-105' : 'text-on-surface-variant opacity-70'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: activeTab === 'reports' ? "'FILL' 1" : "'FILL' 0" }}
        >
          report_problem
        </span>
        <span className="text-[11px]">Reports</span>
      </button>

      <button
        onClick={() => onSelectTab('safety')}
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
          activeTab === 'safety' ? 'text-secondary font-bold scale-105' : 'text-on-surface-variant opacity-70'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: activeTab === 'safety' ? "'FILL' 1" : "'FILL' 0" }}
        >
          verified_user
        </span>
        <span className="text-[11px]">Safety</span>
      </button>
    </nav>
  );
};
