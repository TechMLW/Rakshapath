import React from 'react';

interface RerouteToastProps {
  isVisible: boolean;
  hazardDescription: string;
  onAcceptReroute: () => void;
  onDismiss: () => void;
  loading: boolean;
}

export const RerouteToast: React.FC<RerouteToastProps> = ({
  isVisible,
  hazardDescription,
  onAcceptReroute,
  onDismiss,
  loading,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-12 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-auto animate-bounce-short">
      <div className="glass-panel rounded-2xl p-4 bg-[#121214]/95 border border-error/40 shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Hazard Message */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-error-container/40 border border-error/50 flex items-center justify-center text-error shrink-0">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <div className="text-xs font-bold text-error uppercase tracking-wider">
              Dynamic Hazard Alert
            </div>
            <p className="text-xs text-on-surface leading-tight mt-0.5">
              {hazardDescription || 'AI detected sudden waterlogging ahead.'}{' '}
              <span className="text-tertiary font-bold">Safer bypass computed.</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onDismiss}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-white/10 transition-colors"
          >
            Ignore
          </button>
          <button
            onClick={onAcceptReroute}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-tertiary text-[#003824] hover:bg-tertiary-fixed font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-[#003824] border-t-transparent rounded-full animate-spin" />
                Rerouting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">alt_route</span>
                Reroute Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
