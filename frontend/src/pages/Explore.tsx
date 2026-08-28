import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  Bell,
  Compass,
  Crosshair,
  Flag,
  Menu,
  Navigation,
  Search,
  Shield,
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapView } from "../components/MapView";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import type { RoutePreference } from "../types/api";
import { locationService } from "../services/locationService";

export default function Explore() {
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

  const [searchFocused, setSearchFocused] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Update suggestions as destination query changes
  useEffect(() => {
    if (destination.length >= 2) {
      setSuggestions(locationService.getSuggestions(destination));
    } else {
      setSuggestions([]);
    }
  }, [destination]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPresetsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit() {
    if (!origin.trim() || !destination.trim()) return;
    await plan(origin, destination, preference);
  }

  return (
    <main className="map-page">
      {/* Real Interactive Leaflet Map */}
      <MapView
        routes={routes}
        selectedId={selectedId}
        origin={originCoord}
        destination={destinationCoord}
        activeHazard={activeHazard}
        onSelectRoute={id => setSelectedId(id)}
        className="absolute inset-0 h-full w-full"
      />

      {/* Floating Top Search Bar */}
      <header className="map-topbar">
        <button
          onClick={() => navigate("/routes")}
          className="map-menu lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="relative flex-1 max-w-[560px]" ref={dropdownRef}>
          <div className="map-searchbar">
            <Search size={19} className="text-slate-400 shrink-0" />
            <input
              placeholder="Search destination or select preset..."
              value={destination}
              onFocus={() => {
                setSearchFocused(true);
                setShowPresetsDropdown(true);
              }}
              onChange={e => setDestination(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            {destination && (
              <button
                onClick={() => setDestination("")}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete / Preset Suggestions Dropdown */}
          {showPresetsDropdown && (
            <div className="absolute top-14 left-0 right-0 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur-md">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Quick Test Presets (Bhubaneswar)
              </div>
              <div className="mt-1 space-y-1">
                {presets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      applyPreset(preset);
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold">{preset.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{preset.description}</div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>

              {suggestions.length > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Matching Landmarks
                  </div>
                  <div className="mt-1 space-y-1">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          setDestination(s);
                          setShowPresetsDropdown(false);
                          plan(origin, s, preference);
                        }}
                        className="w-full text-left rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 capitalize"
                      >
                        📍 {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button className="map-icon" aria-label="Notifications" title="Notifications">
            <Bell size={18} />
          </button>
          <div className="map-avatar">SA</div>
        </div>
      </header>

      {/* Floating Route Planner Panel */}
      <section className="route-float-panel">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>RakshaPath AI</span>
            </div>
            <h1 className="mt-0.5 text-lg font-bold text-slate-900">Plan a safer journey</h1>
          </div>
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Shield size={20} />
          </div>
        </div>

        {/* Input Fields */}
        <div className="route-fields mt-4">
          <label>
            <span className="route-dot bg-emerald-500" />
            <input
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="Starting point (e.g. Master Canteen)"
            />
            {origin && (
              <button
                type="button"
                onClick={() => setOrigin("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <div className="route-line" />
          <label>
            <span className="route-dot bg-red-500" />
            <input
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Where to? (e.g. Infocity)"
            />
            {destination && (
              <button
                type="button"
                onClick={() => setDestination("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>

        {/* Preference Selector Chips */}
        <div className="mt-3.5 flex gap-1.5 overflow-x-auto pb-1">
          {(["safest", "fastest", "balanced"] as RoutePreference[]).map(pref => (
            <button
              key={pref}
              onClick={() => {
                setPreference(pref);
                plan(origin, destination, pref);
              }}
              className={`map-chip ${preference === pref ? "map-chip-active" : ""}`}
            >
              {pref === "safest" ? (
                <Shield size={13} />
              ) : pref === "fastest" ? (
                <Navigation size={13} />
              ) : (
                <Compass size={13} />
              )}
              <span>{pref}</span>
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="map-directions-btn mt-3.5"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Finding safest route…</span>
            </>
          ) : (
            <>
              <span>Get Directions</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>

        {error && <p className="mt-2.5 text-xs text-red-600 font-medium">⚠️ {error}</p>}

        {/* Demo Hazard Simulation Toggle Banner */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          {activeHazard ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1">
                  <AlertTriangle size={14} className="text-red-600" />
                  Hazard Active: {activeHazard.type}
                </span>
                <button
                  onClick={clearHazard}
                  className="text-[10px] font-extrabold text-blue-600 hover:underline"
                >
                  Reset
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">{activeHazard.message}</p>
            </div>
          ) : (
            <button
              onClick={() => triggerDemoHazard("Waterlogging")}
              className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                Simulate Road Hazard (Demo)
              </span>
              <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                TEST
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Map Action Floating Buttons (Right) */}
      <div className="map-actions">
        <button
          onClick={() => plan(origin, destination, preference)}
          className="map-fab"
          title="Recenter & Refresh"
          aria-label="Recenter and refresh"
        >
          <Crosshair size={20} />
        </button>
        <button
          onClick={() => navigate("/safety")}
          className="map-fab"
          title="Safety Intel"
          aria-label="Safety intelligence"
        >
          <Shield size={20} />
        </button>
        <button
          onClick={() => navigate("/reports")}
          className="map-fab"
          title="Report Issue"
          aria-label="Report issue"
        >
          <Flag size={19} />
        </button>
      </div>

      {/* Bottom Sheet Summary & Route Switcher */}
      <section className="map-bottom-sheet">
        <div className="sheet-handle" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SAFETY ROUTE OPTIONS
            </p>
            <h2 className="text-base font-extrabold text-slate-900">
              {selectedRoute ? selectedRoute.label : "Explore routes"}
            </h2>
          </div>
          <button
            onClick={() => navigate("/routes")}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>Compare all</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Route Preview Badges */}
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {routes.length > 0 ? (
            routes.map(r => {
              const isSelected = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`route-preview ${isSelected ? "route-preview-active" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <b>{r.label}</b>
                    {r.isRecommended && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                        Top
                      </span>
                    )}
                  </div>
                  <span>
                    Safety {r.analytics.safetyScore}/100 •{" "}
                    {Math.round(r.analytics.durationSeconds / 60)} min •{" "}
                    {(r.analytics.distanceMeters / 1000).toFixed(1)} km
                  </span>
                </button>
              );
            })
          ) : (
            <>
              <button onClick={() => navigate("/safety")} className="quick-card">
                <Shield size={18} className="text-blue-600" />
                <span>Safety Insights</span>
              </button>
              <button onClick={() => navigate("/reports")} className="quick-card">
                <Flag size={18} className="text-blue-600" />
                <span>Report an Issue</span>
              </button>
              <button onClick={() => navigate("/routes")} className="quick-card">
                <SlidersHorizontal size={18} className="text-blue-600" />
                <span>Route Compare</span>
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
