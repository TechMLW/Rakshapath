import { useState } from "react";
import {
  LocateFixed,
  RefreshCw,
  AlertTriangle,
  Volume2,
  VolumeX,
  Navigation as NavIcon,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { useRoutePlanner } from "../hooks/useRoutePlanner";

export default function NavigationPage() {
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
    plan,
    triggerDemoHazard,
    clearHazard
  } = useRoutePlanner();

  const [voiceMuted, setVoiceMuted] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(true);

  return (
    <main className="relative h-[calc(100vh-64px)] lg:h-screen w-full overflow-hidden bg-slate-900">
      {/* Fullscreen Map */}
      <MapView
        routes={routes}
        selectedId={selectedId}
        origin={originCoord}
        destination={destinationCoord}
        activeHazard={activeHazard}
        className="absolute inset-0 h-full w-full"
      />

      {/* Top Turn-by-Turn Guidance Banner */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-col md:flex-row items-start justify-between gap-3 pointer-events-none">
        <div className="glass-card p-4 bg-slate-900/95 text-white shadow-2xl border-slate-700 max-w-md w-full pointer-events-auto rounded-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/routes")}
              className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white"
            >
              <ArrowLeft size={15} />
              <span>Back to Routes</span>
            </button>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              GPS LOCKED
            </span>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shrink-0 shadow-md">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <div className="text-sm font-extrabold leading-tight text-white">
                In 450m, continue on Janpath Arterial
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Next verified safe haven: Saheed Nagar Police Booth (1.2 km)
              </div>
            </div>
          </div>
        </div>

        {/* Floating Quick Action Controls (Voice / Locate / Hazard Demo) */}
        <div className="flex flex-row md:flex-col gap-2 pointer-events-auto self-end md:self-auto">
          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            className="map-control bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800"
            title={voiceMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
          >
            {voiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={() => setGpsLocked(!gpsLocked)}
            className={`map-control ${
              gpsLocked
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800"
            }`}
            title="Recenter GPS"
          >
            <LocateFixed size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Navigation Dashboard HUD */}
      <div className="absolute bottom-6 left-4 right-4 z-30 mx-auto max-w-2xl pointer-events-auto">
        <GlassCard className="p-4 md:p-5 bg-white/95 shadow-2xl border-slate-200 rounded-3xl backdrop-blur-md">
          {/* Active Hazard Warning in Navigation Mode */}
          {activeHazard && (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <span>Hazard simulation active: {activeHazard.message}</span>
              </div>
              <button
                onClick={clearHazard}
                className="text-[11px] font-extrabold text-blue-600 hover:underline shrink-0 ml-2"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {selectedRoute?.analytics.durationSeconds
                    ? `${Math.round(selectedRoute.analytics.durationSeconds / 60)}`
                    : "—"}
                </span>
                <span className="text-sm font-bold text-slate-500">min</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                <span>
                  {selectedRoute?.analytics.distanceMeters
                    ? `${(selectedRoute.analytics.distanceMeters / 1000).toFixed(1)} km`
                    : "No route"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <ShieldCheck size={14} />
                  Safety {selectedRoute?.analytics.safetyScore ?? "—"}/100
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => plan(origin, destination, preference)}
                disabled={loading}
                className="secondary-button py-2.5 px-3.5 text-xs"
                title="Recalculate"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Reroute</span>
              </button>

              {!activeHazard && (
                <button
                  onClick={() => triggerDemoHazard("Waterlogging")}
                  className="secondary-button py-2.5 px-3 text-xs text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100"
                  title="Simulate Hazard Reroute"
                >
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span className="hidden sm:inline">Test Hazard</span>
                </button>
              )}

              <button
                onClick={() => navigate("/routes")}
                className="primary-button py-2.5 px-4 text-xs"
              >
                <span>Overview</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}