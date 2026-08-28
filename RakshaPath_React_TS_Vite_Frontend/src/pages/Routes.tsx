import { ArrowRight, CloudRain, Loader2, MapPin, RefreshCw, ShieldAlert } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { RouteCard } from "../components/RouteCard";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import { useLocationField } from "../hooks/useLocationField";
import { ROUTE_PRESETS } from "../services/geocoding";
import { useState } from "react";
import type { Coordinate, RoutePreference } from "../types/api";

const REGIONS = [
  { id: "bhubaneswar", label: "Bhubaneswar (Odisha)" },
  { id: "assam", label: "Assam (Guwahati)" },
  { id: "meghalaya", label: "Meghalaya (Shillong)" },
  { id: "arunachal_pradesh", label: "Arunachal Pradesh (Itanagar)" },
  { id: "nagaland", label: "Nagaland (Kohima)" },
  { id: "manipur", label: "Manipur (Imphal)" },
  { id: "mizoram", label: "Mizoram (Aizawl)" },
  { id: "tripura", label: "Tripura (Agartala)" },
  { id: "sikkim", label: "Sikkim (Gangtok)" },
  { id: "northeast", label: "North East Region (Combined)" },
];

const DEFAULT_PRESET = ROUTE_PRESETS[0];

function fieldStatusLine(field: ReturnType<typeof useLocationField>) {
  if (field.status === "resolving") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-rp-outline">
        <Loader2 size={11} className="animate-spin" /> Resolving location…
      </span>
    );
  }
  if (field.status === "resolved" && field.displayName) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-rp-green truncate" title={field.displayName}>
        <MapPin size={11} /> {field.displayName}
      </span>
    );
  }
  if (field.status === "not_found") {
    return <span className="text-[11px] text-rp-red">{field.errorMessage ?? "Location not found."}</span>;
  }
  if (field.status === "error") {
    return <span className="text-[11px] text-rp-red">{field.errorMessage ?? "Could not resolve location."}</span>;
  }
  return null;
}

export default function RoutesPage() {
  const origin = useLocationField({
    query: DEFAULT_PRESET.origin.query,
    status: "resolved",
    coord: { lat: DEFAULT_PRESET.origin.lat, lng: DEFAULT_PRESET.origin.lng },
    displayName: DEFAULT_PRESET.origin.query,
    errorMessage: null,
  });
  const destination = useLocationField({
    query: DEFAULT_PRESET.destination.query,
    status: "resolved",
    coord: { lat: DEFAULT_PRESET.destination.lat, lng: DEFAULT_PRESET.destination.lng },
    displayName: DEFAULT_PRESET.destination.query,
    errorMessage: null,
  });

  const [region, setRegion] = useState(DEFAULT_PRESET.region);
  const [preference, setPreference] = useState<RoutePreference>("safest");
  const [clickTarget, setClickTarget] = useState<"origin" | "destination">("destination");

  const planner = useRoutePlanner();
  const resolving = origin.status === "resolving" || destination.status === "resolving";

  async function calculate() {
    if (!origin.query.trim() || !destination.query.trim()) return;
    const originCoord = await origin.resolve(region);
    if (!originCoord) return;
    const destCoord = await destination.resolve(region);
    if (!destCoord) return;
    await planner.plan(originCoord, destCoord, preference, region);
  }

  async function triggerHazardReroute() {
    if (!origin.coord || !destination.coord) return;
    await planner.replan(origin.coord, destination.coord, preference, region, {
      hazard_type: "flood",
      penalty_factor: 3.5,
    });
  }

  function handleMapClick(coords: Coordinate) {
    const formatted = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
    if (clickTarget === "origin") {
      origin.setResolved(formatted, coords, formatted);
      setClickTarget("destination");
    } else {
      destination.setResolved(formatted, coords, formatted);
      setClickTarget("origin");
    }
  }

  function applyPreset(preset: (typeof ROUTE_PRESETS)[number]) {
    origin.setResolved(preset.origin.query, { lat: preset.origin.lat, lng: preset.origin.lng }, preset.origin.query);
    destination.setResolved(preset.destination.query, { lat: preset.destination.lat, lng: preset.destination.lng }, preset.destination.query);
    setRegion(preset.region);
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="eyebrow">AI ROUTE OPTIMIZATION</div>
            <h1 className="page-title">Compare & Select Route</h1>
            <p className="body-muted">
              Type any real place name — it's geocoded via OpenStreetMap, then routed through the live A* backend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-rp-outline font-semibold">Region:</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-rp-surface border border-white/10 text-xs rounded-xl px-3 py-2 text-rp-text outline-none"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Card */}
        <GlassCard className="mt-6 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="field flex-col items-start !gap-1">
              <div className="flex w-full items-center gap-2">
                <span className="text-rp-green font-bold">●</span>
                <input
                  value={origin.query}
                  onChange={(e) => origin.setQuery(e.target.value)}
                  placeholder="Origin (any place name, or lat, lng)"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setClickTarget("origin")}
                  title="Click map to pick origin"
                  className={`text-[10px] px-2 py-1 rounded border ${
                    clickTarget === "origin" ? "border-rp-green text-rp-green" : "border-white/10 text-rp-outline"
                  }`}
                >
                  Pick Map
                </button>
              </div>
              {fieldStatusLine(origin) && <div className="pl-5">{fieldStatusLine(origin)}</div>}
            </label>

            <label className="field flex-col items-start !gap-1">
              <div className="flex w-full items-center gap-2">
                <span className="text-rp-blue font-bold">●</span>
                <input
                  value={destination.query}
                  onChange={(e) => destination.setQuery(e.target.value)}
                  placeholder="Destination (any place name, or lat, lng)"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setClickTarget("destination")}
                  title="Click map to pick destination"
                  className={`text-[10px] px-2 py-1 rounded border ${
                    clickTarget === "destination" ? "border-rp-blue text-rp-blue" : "border-white/10 text-rp-outline"
                  }`}
                >
                  Pick Map
                </button>
              </div>
              {fieldStatusLine(destination) && <div className="pl-5">{fieldStatusLine(destination)}</div>}
            </label>

            <button
              onClick={calculate}
              disabled={planner.loading || resolving}
              className="primary-button min-w-[140px] self-start"
            >
              {resolving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-rp-bg border-t-transparent rounded-full animate-spin" />
                  Resolving…
                </>
              ) : planner.loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-rp-bg border-t-transparent rounded-full animate-spin" />
                  Calculating…
                </>
              ) : (
                <>
                  Find Routes
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Quick Presets & Profile Selector */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-rp-outline font-semibold">Presets:</span>
              {ROUTE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="chip text-[10px] hover:border-white/20"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {(["safest", "fastest", "balanced"] as RoutePreference[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreference(p)}
                  className={`chip capitalize ${preference === p ? "chip-active" : ""}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {planner.error && (
          <div className="error-box mt-4 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>Calculation Notice: {planner.error}</span>
          </div>
        )}

        {/* Map & Results Grid */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
          <div className="overflow-hidden rounded-2xl border border-white/[.08] shadow-2xl relative min-h-[500px]">
            <MapView
              routes={planner.routes}
              selectedId={planner.selectedId}
              origin={origin.coord}
              destination={destination.coord}
              hazards={planner.hazards}
              onMapClick={handleMapClick}
              className="h-[520px] lg:h-[650px]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="eyebrow">COMPUTED ROUTES</div>
              {planner.hazards.length > 0 && (
                <span className="text-[10px] font-bold text-rp-red bg-rp-redStrong/20 px-2 py-0.5 rounded border border-rp-red/30">
                  {planner.hazards.length} Active Hazard(s)
                </span>
              )}
            </div>

            {planner.routes.length === 0 ? (
              <GlassCard className="p-5 text-sm leading-6 text-rp-outline">
                Enter any real origin/destination and click <strong>Find Routes</strong>, or select a preset above. Real A* paths with GeoJSON polylines, travel durations, and safety scores will be rendered from the FastAPI backend.
              </GlassCard>
            ) : (
              planner.routes.map((r) => (
                <RouteCard
                  key={r.id}
                  route={r}
                  selected={planner.selectedId === r.id}
                  onClick={() => planner.setSelectedId(r.id)}
                />
              ))
            )}

            {/* Dynamic Rerouting Action Box */}
            {planner.selectedRoute && (
              <GlassCard className="p-4 border-rp-blue/30 mt-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-rp-blue mb-1">
                  <CloudRain size={16} />
                  <span>Dynamic Hazard Simulation</span>
                </div>
                <p className="text-[11px] text-rp-outline mb-3 leading-snug">
                  Simulates a sudden flood or severe congestion along the current route to verify A* cost recalculation and dynamic bypass generation.
                </p>
                <button
                  onClick={triggerHazardReroute}
                  disabled={planner.loading}
                  className="secondary-button w-full justify-center bg-rp-surface hover:bg-white/10"
                >
                  <RefreshCw size={14} className={planner.loading ? "animate-spin" : ""} />
                  Simulate Road Hazard & Reroute
                </button>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
