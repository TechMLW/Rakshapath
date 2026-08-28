import React from 'react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSOSClick: () => void;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onSOSClick,
  onProfileClick,
}) => {
  return (
    <header className="fixed top-4 left-4 right-4 z-40 rounded-2xl bg-[#121415]/80 backdrop-blur-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] px-5 h-16 hidden md:flex justify-between items-center transition-all duration-300">
      {/* Brand Logo */}
      <div
        onClick={() => onSelectTab('explore')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 border border-tertiary/30 flex items-center justify-center text-tertiary shadow-[0_0_15px_rgba(78,222,163,0.3)]">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            security
          </span>
        </div>
        <div>
          <span className="font-bold text-xl text-primary tracking-tight block">
            RakshaPath
          </span>
          <span className="text-[10px] text-tertiary font-semibold uppercase tracking-widest block -mt-1">
            AI Safety Navigator
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-2 bg-[#1e2021]/60 p-1.5 rounded-xl border border-white/5">
        <button
          onClick={() => onSelectTab('explore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'explore'
              ? 'bg-secondary-container text-white shadow-md'
              : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">explore</span>
          Explore
        </button>

        <button
          onClick={() => onSelectTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'routes'
              ? 'bg-secondary-container text-white shadow-md'
              : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">directions</span>
          Routes
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'reports'
              ? 'bg-secondary-container text-white shadow-md'
              : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">report_problem</span>
          Reports
        </button>

        <button
          onClick={() => onSelectTab('safety')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'safety'
              ? 'bg-secondary-container text-white shadow-md'
              : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          Safety
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSOSClick}
          className="bg-[#93000a] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 pulse-glow hover:bg-[#b00020] transition-colors shadow-lg border border-error/40"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            sos
          </span>
          SOS
        </button>

        <div
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:border-tertiary transition-all shadow-md active:scale-95"
          title="User Profile"
        >
          <div className="w-full h-full bg-gradient-to-tr from-secondary-container to-tertiary flex items-center justify-center font-bold text-white text-sm">
            RP
          </div>
        </div>
      </div>
    </header>
  );
};
