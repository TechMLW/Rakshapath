import React from 'react';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRecenter?: () => void;
  onSOSClick: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  onSOSClick,
}) => {
  return (
    <div className="absolute top-20 right-4 md:right-8 z-30 flex flex-col gap-3 pointer-events-auto">
      {/* Floating Map Tools */}
      <div className="glass-panel rounded-full flex flex-col overflow-hidden shadow-2xl border border-white/10">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="w-11 h-11 flex items-center justify-center text-on-surface hover:bg-white/10 active:bg-white/20 transition-all border-b border-white/10"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="w-11 h-11 flex items-center justify-center text-on-surface hover:bg-white/10 active:bg-white/20 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
      </div>

      <button
        onClick={onRecenter}
        title="Recenter Map"
        className="w-11 h-11 glass-panel rounded-full flex items-center justify-center text-secondary hover:bg-white/10 active:scale-95 transition-all shadow-xl border border-secondary/30"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          my_location
        </span>
      </button>

      {/* Floating SOS Trigger Button */}
      <button
        onClick={onSOSClick}
        title="Emergency SOS"
        className="w-14 h-14 rounded-full bg-[#93000a] text-white flex items-center justify-center shadow-[0_0_25px_rgba(147,0,10,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 relative group mt-4 border border-error/50"
      >
        <div className="absolute inset-0 rounded-full bg-[#93000a] animate-ping opacity-60 -z-10" />
        <span className="font-bold text-sm tracking-wider flex items-center justify-center">
          SOS
        </span>
      </button>
    </div>
  );
};
