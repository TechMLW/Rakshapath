import React, { useState } from 'react';
import { HazardReport } from '../types';
import { SafetyScoreGauge } from '../components/common/SafetyScoreGauge';

interface SafetyPageProps {
  hazards: HazardReport[];
  onOpenReportModal: () => void;
}

export const SafetyPage: React.FC<SafetyPageProps> = ({
  hazards,
  onOpenReportModal,
}) => {
  const [filter, setFilter] = useState('all');
  const [womensSafety, setWomensSafety] = useState(true);
  const [nightSafety, setNightSafety] = useState(false);

  const filteredHazards = hazards.filter((h) => {
    if (filter === 'all') return true;
    return h.report_type?.toLowerCase() === filter;
  });

  return (
    <div className="absolute top-20 md:top-24 left-4 md:left-8 z-30 w-full max-w-md pointer-events-auto max-h-[calc(100vh-120px)] flex flex-col">
      <div className="glass-panel rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col overflow-hidden border border-white/10 flex-1">
        {/* Header */}
        <div className="border-b border-white/10 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Safety Around You</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time geospatial analytics based on AI risk prediction and verified citizen reports.
          </p>
        </div>

        {/* AI Score Banner */}
        {(() => {
          const zoneScore = hazards.length > 0 ? Math.max(30, 100 - hazards.length * 10) : 95;
          const isHighSafety = zoneScore >= 80;
          return (
            <div className={`border rounded-2xl p-4 flex items-center justify-between mb-4 ${
              isHighSafety ? 'bg-tertiary-container/20 border-tertiary/30' : 'bg-error-container/20 border-error/30'
            }`}>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${isHighSafety ? 'text-tertiary' : 'text-error'}`}>
                  Local Zone Safety Score
                </div>
                <div className="text-3xl font-extrabold text-white mt-0.5">
                  {zoneScore}<span className={`text-sm font-normal ${isHighSafety ? 'text-tertiary' : 'text-error'}`}>/100</span>
                </div>
                <div className={`text-[11px] flex items-center gap-1 mt-1 ${isHighSafety ? 'text-tertiary' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isHighSafety ? 'verified_user' : 'warning'}
                  </span>
                  {isHighSafety ? 'Low Incident Density Corridor' : `${hazards.length} Active Hazard(s) Nearby`}
                </div>
              </div>

              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg ${
                isHighSafety ? 'bg-tertiary/10 border-tertiary text-tertiary' : 'bg-error/10 border-error text-error'
              }`}>
                <span className="material-symbols-outlined text-[28px]">analytics</span>
              </div>
            </div>
          );
        })()}

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
          {['all', 'flood', 'accident', 'lighting', 'hazard', 'crime'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === cat
                  ? 'bg-secondary-container text-white shadow-md'
                  : 'bg-[#1a1c1d] text-on-surface-variant hover:bg-white/5 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Incident Feed */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            <span>Recent Hazard Alerts</span>
            <span className="text-secondary">{filteredHazards.length} Active</span>
          </div>

          {filteredHazards.length === 0 ? (
            <div className="p-4 text-center text-xs text-on-surface-variant bg-[#121415]/50 rounded-2xl border border-white/5">
              No active {filter !== 'all' ? filter : ''} incidents detected in your vicinity.
            </div>
          ) : (
            filteredHazards.map((h, i) => (
              <div
                key={h.id || i}
                className="bg-[#1a1c1d]/80 rounded-2xl p-3.5 border border-white/5 hover:border-white/10 transition-all flex items-start gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    h.severity === 'critical' || h.severity === 'high'
                      ? 'bg-error-container/30 text-error border border-error/30'
                      : 'bg-[#fbbc04]/20 text-[#fbbc04] border border-[#fbbc04]/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {h.report_type === 'flood' ? 'water' : h.report_type === 'accident' ? 'car_crash' : 'warning'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white capitalize">{h.report_type}</span>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                      {h.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5 line-clamp-2">
                    {h.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Safety Mode Switches */}
        <div className="border-t border-white/10 pt-4 mt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-white block">Women's Safety Protocols</span>
              <span className="text-[10px] text-on-surface-variant">Prioritizes well-lit, active CCTV routes</span>
            </div>
            <input
              type="checkbox"
              checked={womensSafety}
              onChange={(e) => setWomensSafety(e.target.checked)}
              className="accent-secondary w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-white block">Night Travel Protocols</span>
              <span className="text-[10px] text-on-surface-variant">Avoids isolated transit sections</span>
            </div>
            <input
              type="checkbox"
              checked={nightSafety}
              onChange={(e) => setNightSafety(e.target.checked)}
              className="accent-secondary w-4 h-4"
            />
          </div>
        </div>

        {/* Report Button CTA */}
        <div className="pt-4">
          <button
            onClick={onOpenReportModal}
            className="w-full py-3 rounded-2xl bg-secondary-container hover:bg-secondary-container/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add_alert</span>
            Report New Incident
          </button>
        </div>
      </div>
    </div>
  );
};
