import { useState } from "react";
import {
  ArrowRight,
  RefreshCw,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Navigation,
  Compass,
  Zap,
  MapPin,
  Clock,
  Gauge,
  IndianRupee,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { RouteCard } from "../components/RouteCard";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import type { RoutePreference } from "../types/api";

export default function RoutesPage() {
  const navigate = useNavigate();
  const {
    origin,
    destination,
    originCoord,
    destinationCoord,
    preference,
    routes,
    selectedId,
    selectedRoute,
    loading,
    error,
    activeHazard,
    presets,
    setOrigin,
    setDestination,
    setPreference,
    setSelectedId,
    plan,
    applyPreset,
    triggerDemoHazard,
    clearHazard
  } = useRoutePlanner();

  const [inputOrigin, setInputOrigin] = useState(origin);
  const [inputDest, setInputDest] = useState(destination);

  async function handleCalculate() {
    if (inputOrigin.trim() && inputDest.trim()) {
      setOrigin(inputOrigin);
      setDestination(inputDest);
      await plan(inputOrigin, inputDest, preference);
    }
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">ROUTE INTELLIGENCE</span>
            </div>
            <h1 className="page-title">Choose & compare routes</h1>
            <p className="body-muted mt-1">
              Analyze safety metrics, streetlighting coverage, and estimated travel costs across independent route profiles.
            </p>
          </div>

          {selectedRoute && (
            <button
              onClick={() => navigate("/navigation")}
              className="primary-button self-start md:self-auto py-3 px-5 text-sm"
            >
              <Navigation size={17} />
              <span>Start Live Navigation</span>
            </button>
          )}
        </div>

        {/* Input Bar & Preset Shortcuts */}
        <GlassCard className="mt-6 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="field">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <input
                value={inputOrigin}
                onChange={e => setInputOrigin(e.target.value)}
                placeholder="Origin address or coordinates"
              />
              {inputOrigin && (
                <button
                  type="button"
                  onClick={() => setInputOrigin("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </label>

            <label className="field">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              <input
                value={inputDest}
                onChange={e => setInputDest(e.target.value)}
                placeholder="Destination address or coordinates"
              />
              {inputDest && (
                <button
                  type="button"
                  onClick={() => setInputDest("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </label>

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="primary-button h-[46px] px-6 text-sm"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Computing…</span>
                </>
              ) : (
                <>
                  <span>Calculate</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Preset Buttons & Preference Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Presets:</span>
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setInputOrigin(p.origin);
                    setInputDest(p.destination);
                    applyPreset(p);
                  }}
                  className="chip text-[11px]"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Profile:</span>
              {(["safest", "fastest", "balanced"] as RoutePreference[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setPreference(p);
                    plan(inputOrigin, inputDest, p);
                  }}
                  className={`chip ${preference === p ? "chip-active" : ""}`}
                >
                  {p === "safest" ? (
                    <Shield size={12} className="inline mr-1" />
                  ) : p === "fastest" ? (
                    <Navigation size={12} className="inline mr-1" />
                  ) : (
                    <Compass size={12} className="inline mr-1" />
                  )}
                  {p}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {error && <div className="error-box mt-4">⚠️ {error}</div>}

        {/* Dynamic Hazard Demo Alert / Trigger */}
        <div className="mt-4">
          {activeHazard ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-100 text-red-600 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="font-bold text-red-900 text-sm">
                    Simulated Hazard: {activeHazard.type} ({activeHazard.severity} Severity)
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{activeHazard.message}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Location: {activeHazard.locationName}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button onClick={clearHazard} className="secondary-button py-2 text-xs">
                  Clear Simulation
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-medium">
                <Zap size={16} className="text-amber-600" />
                <span>
                  <b>Dynamic Hazard Simulator:</b> Test how RakshaPath recalculates and safely detours around live road incidents.
                </span>
              </div>
              <button
                onClick={() => triggerDemoHazard("Waterlogging")}
                className="rounded-xl bg-amber-600 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-amber-700 transition-colors shrink-0"
              >
                Simulate Hazard
              </button>
            </div>
          )}
        </div>

        {/* Main Content Grid: Map + Route Cards */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Map View */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm h-[480px] lg:h-[680px] relative">
            <MapView
              routes={routes}
              selectedId={selectedId}
              origin={originCoord}
              destination={destinationCoord}
              activeHazard={activeHazard}
              onSelectRoute={id => setSelectedId(id)}
              className="h-full w-full"
            />
          </div>

          {/* Route Options & Analytics Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="eyebrow">SUGGESTED ROUTE PROFILES</div>
              <span className="text-xs font-semibold text-slate-500">
                {routes.length} options available
              </span>
            </div>

            {/* List of Independent Route Cards */}
            <div className="space-y-2.5">
              {routes.map(r => (
                <RouteCard
                  key={r.id}
                  route={r}
                  selected={selectedId === r.id}
                  onClick={() => setSelectedId(r.id)}
                />
              ))}
            </div>

            {/* Detailed Analytics for the Selected Route */}
            {selectedRoute && selectedRoute.analytics.safetyMetrics && (
              <GlassCard className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedRoute.label} Safety Intel
                    </span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                    {selectedRoute.analytics.safetyTier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="stat-block">
                    <b>{selectedRoute.analytics.safetyMetrics.streetLightingScore}%</b>
                    <span>LED Streetlighting</span>
                  </div>
                  <div className="stat-block">
                    <b>{selectedRoute.analytics.safetyMetrics.patrolFrequency}</b>
                    <span>PCR Police Patrols</span>
                  </div>
                  <div className="stat-block">
                    <b>{selectedRoute.analytics.safetyMetrics.cctvCoverage}</b>
                    <span>CCTV Monitoring</span>
                  </div>
                  <div className="stat-block">
                    <b>{selectedRoute.analytics.safetyMetrics.emergencyResponseMinutes} mins</b>
                    <span>Emergency Response</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed">
                  <b>Corridor Notes:</b> {selectedRoute.description}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}