import React, { useState } from 'react';
import { GPSPoint } from '../../types';
import { createReport } from '../../services/api';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reportId: number) => void;
  currentLocation: GPSPoint | null;
}

const INCIDENT_CATEGORIES = [
  { id: 'hazard', label: 'Road Hazard', icon: 'construction' },
  { id: 'accident', label: 'Accident', icon: 'car_crash' },
  { id: 'flood', label: 'Waterlogging', icon: 'water' },
  { id: 'blockage', label: 'Blockage', icon: 'block' },
  { id: 'lighting', label: 'Poor Lighting', icon: 'lightbulb' },
  { id: 'crime', label: 'Safety Risk', icon: 'shield_lock' },
  { id: 'harassment', label: 'Harassment', icon: 'warning' },
  { id: 'other', label: 'Other', icon: 'more_horiz' },
];

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentLocation,
}) => {
  const [selectedType, setSelectedType] = useState('flood');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief description of the incident.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lat = currentLocation?.latitude || 20.2961;
      const lon = currentLocation?.longitude || 85.8245;

      const res = await createReport({
        report_type: selectedType,
        description: description.trim(),
        severity: severity,
        latitude: lat,
        longitude: lon,
      });

      onSuccess(res.report_id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit safety report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">report_problem</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Report an Incident</h2>
              <p className="text-xs text-on-surface-variant">Community Real-Time Alert Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="bg-error-container/20 border border-error/40 text-error p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Field */}
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Incident Location
            </label>
            <div className="bg-[#121415] border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[20px]">location_on</span>
              <div className="flex-1 text-xs">
                <div className="text-white font-semibold">
                  {currentLocation?.name || 'Current GPS Coordinate'}
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono">
                  {currentLocation
                    ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
                    : '20.2961, 85.8245 (Bhubaneswar Hub)'}
                </div>
              </div>
            </div>
          </div>

          {/* Incident Type Grid */}
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
              Select Incident Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {INCIDENT_CATEGORIES.map((cat) => {
                const isSelected = selectedType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedType(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-secondary-container/30 border-secondary text-white shadow-md'
                        : 'bg-[#1a1c1d]/60 border-white/5 text-on-surface-variant hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] mb-1 ${
                        isSelected ? 'text-secondary' : 'text-on-surface-variant'
                      }`}
                      style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {cat.icon}
                    </span>
                    <span className="text-[10px] font-semibold text-center leading-tight">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => {
                const isSelected = severity === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      isSelected
                        ? lvl === 'critical' || lvl === 'high'
                          ? 'bg-[#93000a] text-white border-error shadow-md'
                          : 'bg-secondary-container text-white border-secondary shadow-md'
                        : 'bg-[#1a1c1d] text-on-surface-variant border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Details & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Severe waterlogging over 2 feet deep near underpass, 2 lanes impassable..."
              className="w-full bg-[#121415] border border-white/10 focus:border-secondary rounded-xl p-3 text-xs text-white placeholder:text-on-surface-variant/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-secondary text-on-secondary hover:bg-secondary-fixed font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#002e6a] border-t-transparent rounded-full animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Submit Safety Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
