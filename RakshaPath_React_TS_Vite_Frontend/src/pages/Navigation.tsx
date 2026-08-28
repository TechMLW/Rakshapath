import { useEffect, useState } from "react";
import { CloudRain, LocateFixed, Navigation, RefreshCw, ShieldCheck, TriangleAlert, Volume2 } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import { GeocodeError, geocodeLocation } from "../services/geocoding";
import type { Coordinate, RoutePreference } from "../types/api";

const DEFAULT_ORIGIN: Coordinate = { lat: 20.2644, lng: 85.8396 }; // Master Canteen preset
const DEFAULT_DEST: Coordinate = { lat: 20.3537, lng: 85.8195 }; // Infocity preset

export default function NavigationPage() {
  const [origin, setOrigin] = useState<Coordinate>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState("Infocity");
  const [destCoord, setDestCoord] = useState<Coordinate | null>(DEFAULT_DEST);
  const [destError, setDestError] = useState<string | null>(null);
  const [preference, setPreference] = useState<RoutePreference>("safest");
  const [region, setRegion] = useState("bhubaneswar");

  const planner = useRoutePlanner();

  // Load initial route on mount (a preset shortcut — pre-vetted coordinates, no geocoding needed)
  useEffect(() => {
    planner.plan(DEFAULT_ORIGIN, DEFAULT_DEST, "safest", "bhubaneswar");
  }, []);

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const userPos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setOrigin(userPos);
        if (destCoord) planner.plan(userPos, destCoord, preference, region);
      },
      () => {}
    );
  }

  async function rerouteNow() {
    if (!destination.trim()) return;
    setDestError(null);
    let coord = destCoord;
    try {
      const resolved = await geocodeLocation(destination, region);
      coord = { lat: resolved.lat, lng: resolved.lng };
      setDestCoord(coord);
    } catch (e) {
      setDestError(e instanceof GeocodeError ? e.message : "Could not resolve destination.");
      return;
    }
    // Send in-transit dynamic hazard penalty
    await planner.replan(
      origin,
      coord,
      preference,
      region,
      { hazard_type: "flood", penalty_factor: 3.5 }
    );
  }

  return (
    <main className="relative h-[calc(100vh-64px)] overflow-hidden">
      <MapView
        routes={planner.routes}
        selectedId={planner.selectedId}
        origin={origin}
        destination={destCoord}
        hazards={planner.hazards}
        className="absolute inset-0 h-full"
      />

      {/* Top Floating Turn-by-Turn HUD */}
      <div className="absolute left-4 right-4 top-4 z-20 flex items-start justify-between gap-3 pointer-events-none">
        <GlassCard className="max-w-sm p-4 pointer-events-auto shadow-2xl border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rp-green/20 border border-rp-green/40 flex items-center justify-center text-rp-green font-bold text-xl">
              <Navigation size={24} />
            </div>
            <div>
              <div className="text-xl font-black text-rp-text">In 250 m</div>
              <div className="text-xs font-semibold text-rp-outline">Turn onto Janpath Corridor</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-rp-green font-bold">
              <ShieldCheck size={16} />
              <span>Safe Corridor Active</span>
            </div>
            <div className="text-rp-outline">
              Score: <strong className="text-rp-text">{planner.selectedRoute?.analytics.safety_score ?? planner.selectedRoute?.analytics.safetyScore ?? "94"}/100</strong>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-2 pointer-events-auto">
          <button onClick={locate} title="Locate via GPS" className="map-control hover:bg-white/15 transition-all">
            <LocateFixed size={17} />
          </button>
          <button title="Voice Guidance" className="map-control hover:bg-white/15 transition-all">
            <Volume2 size={17} />
          </button>
        </div>
      </div>

      {/* Bottom Floating Navigation Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-2xl">
        <GlassCard className="p-4 md:p-5 shadow-2xl border-white/15">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="field-input"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setDestCoord(null);
                setDestError(null);
              }}
              placeholder="Destination (any place name, or lat, lng)"
            />
            <button
              onClick={rerouteNow}
              disabled={planner.loading}
              className="secondary-button whitespace-nowrap bg-rp-surface hover:bg-white/10"
            >
              <CloudRain size={15} />
              Simulate Hazard & Reroute
            </button>
          </div>

          {destError && <div className="error-box mt-3">{destError}</div>}

          {planner.error && <div className="error-box mt-3">{planner.error}</div>}

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <div>
              <div className="text-2xl font-extrabold text-rp-text">
                {planner.selectedRoute?.analytics.estimated_time_minutes
                  ? `${Math.round(planner.selectedRoute.analytics.estimated_time_minutes)} min`
                  : planner.selectedRoute?.analytics.durationSeconds
                  ? `${Math.round(planner.selectedRoute.analytics.durationSeconds / 60)} min`
                  : "—"}
              </div>
              <div className="text-xs text-rp-outline">
                {planner.selectedRoute?.analytics.actual_distance_km
                  ? `${planner.selectedRoute.analytics.actual_distance_km.toFixed(1)} km`
                  : planner.selectedRoute?.analytics.distanceMeters
                  ? `${(planner.selectedRoute.analytics.distanceMeters / 1000).toFixed(1)} km`
                  : "Calculating route..."}
              </div>
            </div>

            <button className="danger-button w-auto px-6 py-2.5 rounded-xl shadow-lg">
              <TriangleAlert size={16} />
              Emergency SOS
            </button>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}