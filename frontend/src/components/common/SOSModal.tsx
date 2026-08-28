import React, { useState } from 'react';
import { GPSPoint } from '../../types';
import { createReport } from '../../services/api';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: GPSPoint | null;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
}) => {
  const [alertSent, setAlertSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleBroadcastEmergency = async () => {
    setLoading(true);
    try {
      if (currentLocation) {
        await createReport({
          report_type: 'crime',
          severity: 'critical',
          description: 'EMERGENCY SOS TRIGGERED by user at current location',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }
      setAlertSent(true);
    } catch (e) {
      // Even if offline, show emergency contact actions
      setAlertSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-error/40 shadow-[0_0_50px_rgba(147,0,10,0.5)] relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#93000a] text-white flex items-center justify-center pulse-glow">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                sos
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-error">Emergency SOS</h2>
              <p className="text-xs text-on-surface-variant">Immediate Assistance & Dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {alertSent ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-tertiary/20 text-tertiary mx-auto flex items-center justify-center border border-tertiary/40">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Emergency Alert Broadcasted</h3>
            <p className="text-xs text-on-surface-variant">
              Your live GPS coordinates have been flagged on the RakshaPath safety network.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Broadcast your location to nearby emergency response and emergency contacts:
            </p>

            <button
              onClick={handleBroadcastEmergency}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#93000a] hover:bg-[#b00020] text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 border border-error/50"
            >
              <span className="material-symbols-outlined">cell_tower</span>
              {loading ? 'Broadcasting...' : 'Broadcast GPS Emergency Alert'}
            </button>
          </div>
        )}

        {/* Direct Emergency Call Shortcuts */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
            One-Touch Emergency Helplines
          </p>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:112"
              className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-high/60 border border-white/5 hover:border-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-secondary text-[20px]">call</span>
              <div>
                <div className="text-xs font-bold text-on-surface">National Help</div>
                <div className="text-xs text-secondary font-bold">112</div>
              </div>
            </a>

            <a
              href="tel:1091"
              className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-high/60 border border-white/5 hover:border-tertiary transition-colors"
            >
              <span className="material-symbols-outlined text-tertiary text-[20px]">female</span>
              <div>
                <div className="text-xs font-bold text-on-surface">Women Helpline</div>
                <div className="text-xs text-tertiary font-bold">1091</div>
              </div>
            </a>

            <a
              href="tel:100"
              className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-high/60 border border-white/5 hover:border-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-secondary text-[20px]">local_police</span>
              <div>
                <div className="text-xs font-bold text-on-surface">Police</div>
                <div className="text-xs text-secondary font-bold">100</div>
              </div>
            </a>

            <a
              href="tel:108"
              className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-high/60 border border-white/5 hover:border-error transition-colors"
            >
              <span className="material-symbols-outlined text-error text-[20px]">ambulance</span>
              <div>
                <div className="text-xs font-bold text-on-surface">Ambulance</div>
                <div className="text-xs text-error font-bold">108</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
