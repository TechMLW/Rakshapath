import React, { useState } from 'react';

interface ProfilePageProps {
  onBack: () => void;
  onSOSClick: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, onSOSClick }) => {
  const [womensSafety, setWomensSafety] = useState(true);
  const [nightSafety, setNightSafety] = useState(true);
  const [cctvPriority, setCctvPriority] = useState(true);

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto pt-20 md:pt-24 px-4 md:px-8 pb-24 bg-[#121415]/95 backdrop-blur-3xl animate-fadeIn">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back navigation header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#1e2021] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-white">Profile & Safety Preferences</h1>
        </div>

        {/* User Card */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-secondary to-tertiary flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shrink-0 border-4 border-surface-container-high">
            PS
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <h2 className="text-2xl font-bold text-white">Priya Sharma</h2>
              <span className="bg-tertiary-container/30 text-tertiary border border-tertiary/20 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
                Guardian Badge
              </span>
            </div>

            <p className="text-xs text-on-surface-variant">Active Community Safety Contributor • Odisha Region</p>

            <div className="flex items-center justify-center md:justify-start gap-6 pt-3">
              <div>
                <div className="text-xl font-extrabold text-white">128</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Contributions
                </div>
              </div>

              <div className="w-px h-8 bg-white/10" />

              <div>
                <div className="text-xl font-extrabold text-secondary">1,250</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Safety Points
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Preferences Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <span className="material-symbols-outlined text-tertiary text-[22px]">health_and_safety</span>
            <h3 className="text-base font-bold text-white">Safety Protocols & Preferences</h3>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1e2021]/60 border border-white/5">
              <div>
                <div className="text-sm font-bold text-white">Women's Safety Routing Mode</div>
                <div className="text-xs text-on-surface-variant">
                  Strictly avoids dimly lit alleys and prioritizes high-pedestrian corridors.
                </div>
              </div>
              <input
                type="checkbox"
                checked={womensSafety}
                onChange={(e) => setWomensSafety(e.target.checked)}
                className="accent-tertiary w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1e2021]/60 border border-white/5">
              <div>
                <div className="text-sm font-bold text-white">Night Travel Protocols</div>
                <div className="text-xs text-on-surface-variant">
                  Automatically activates high-security routing profiles past 7:00 PM.
                </div>
              </div>
              <input
                type="checkbox"
                checked={nightSafety}
                onChange={(e) => setNightSafety(e.target.checked)}
                className="accent-tertiary w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1e2021]/60 border border-white/5">
              <div>
                <div className="text-sm font-bold text-white">Municipal CCTV & Police Coverage Priority</div>
                <div className="text-xs text-on-surface-variant">
                  Weights paths with active police patrol points higher during route generation.
                </div>
              </div>
              <input
                type="checkbox"
                checked={cctvPriority}
                onChange={(e) => setCctvPriority(e.target.checked)}
                className="accent-tertiary w-5 h-5"
              />
            </div>
          </div>
        </div>

        {/* Emergency SOS Button */}
        <div className="pt-2">
          <button
            onClick={onSOSClick}
            className="w-full py-4 px-6 rounded-2xl bg-[#93000a] hover:bg-[#b00020] text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 border border-error/50"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              sos
            </span>
            Test SOS Emergency Broadcast
          </button>
        </div>
      </div>
    </div>
  );
};
