import React from 'react';

interface ReportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number | null;
}

export const ReportSuccessModal: React.FC<ReportSuccessModalProps> = ({
  isOpen,
  onClose,
  reportId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 relative overflow-hidden">
        {/* Glowing Success Icon */}
        <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-tertiary/20 rounded-full safe-pulse" />
          <div className="relative z-10 w-16 h-16 bg-tertiary-container/60 rounded-full flex items-center justify-center shadow-lg border border-tertiary/40">
            <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl font-bold text-white mb-2">Report Submitted</h2>
        <p className="text-xs text-on-surface-variant max-w-xs mb-6">
          Thank you for making your city safer. Your report #{reportId || 'RP-1042'} is now registered with the RakshaPath network.
        </p>

        {/* AI Verification Status Card */}
        <div className="w-full bg-[#1a1c1d] rounded-2xl p-4 mb-6 border border-white/5 relative overflow-hidden text-left">
          <div className="flex items-center gap-3 relative z-10">
            <span className="material-symbols-outlined text-secondary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              smart_toy
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">AI Verification Active</span>
              <span className="text-[10px] text-on-surface-variant">
                Cross-referencing satellite and nearby community reports...
              </span>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-secondary to-tertiary w-full animate-pulse" />
        </div>

        {/* Done Action */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-secondary-container hover:bg-secondary-container/90 text-white font-bold text-sm shadow-md transition-all active:scale-95 border border-white/10"
        >
          Done
        </button>
      </div>
    </div>
  );
};
