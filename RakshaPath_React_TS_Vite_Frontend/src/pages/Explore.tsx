import { useState } from "react";
import { ArrowRight, Flag, Navigation, Shield, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import { GeocodeError, geocodeLocation } from "../services/geocoding";
import type { RoutePreference } from "../types/api";

export default function Explore() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("Master Canteen");
  const [to, setTo] = useState("Infocity");
  const [preference, setPreference] = useState<RoutePreference>("safest");
  const [geocodeErrorMsg, setGeocodeErrorMsg] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const { routes, selectedId, setSelectedId, loading, error, plan, hazards } = useRoutePlanner();

  async function submit() {
    if (!from.trim() || !to.trim()) return;
    setGeocodeErrorMsg(null);
    setResolving(true);
    try {
      const originCoord = await geocodeLocation(from, "bhubaneswar");
      const destCoord = await geocodeLocation(to, "bhubaneswar");
      const result = await plan({ lat: originCoord.lat, lng: originCoord.lng }, { lat: destCoord.lat, lng: destCoord.lng }, preference);
      if (result && result.routes.length > 0) {
        navigate("/routes");
      }
    } catch (e) {
      setGeocodeErrorMsg(e instanceof GeocodeError ? e.message : "Could not resolve one of the locations.");
    } finally {
      setResolving(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="eyebrow">AI SAFETY NAVIGATOR</div>
            <h1 className="hero-title">Where are you going?</h1>
            <p className="body-muted">Find an optimized path prioritizing street lighting, surveillance, and flood avoidance.</p>
          </div>
          <div className="status-pill">
            <span /> Real-Time A* Routing Active
          </div>
        </div>

        <GlassCard className="mt-7 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="field">
              <span className="text-rp-green font-bold">●</span>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Origin (e.g. Master Canteen)"
              />
            </label>
            <label className="field">
              <span className="text-rp-blue font-bold">●</span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Destination (e.g. Infocity)"
              />
            </label>
            <button onClick={submit} disabled={loading || resolving} className="primary-button min-w-[140px]">
              {resolving ? "Resolving…" : loading ? "Planning…" : "Plan Safe Route"} <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["safest", "fastest", "balanced"] as RoutePreference[]).map((x) => (
              <button
                key={x}
                onClick={() => setPreference(x)}
                className={`chip capitalize ${preference === x ? "chip-active" : ""}`}
              >
                {x}
              </button>
            ))}
          </div>

          {geocodeErrorMsg && <div className="error-box mt-4">{geocodeErrorMsg}</div>}
          {error && <div className="error-box mt-4">Unable to plan route: {error}</div>}
        </GlassCard>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Plan a route", "Compare Fastest, Safest, Balanced paths", Navigation, "/routes"],
            ["Safety around you", "Inspect active flood & accident risk", Shield, "/safety"],
            ["Report an incident", "Submit community safety alert", Flag, "/reports"],
            ["Live Navigation", "Turn-by-turn safe HUD mode", Navigation, "/navigation"],
          ].map(([title, sub, Icon, toPath]) => (
            <button
              key={title as string}
              onClick={() => navigate(toPath as string)}
              className="glass-card p-5 text-left hover:bg-white/[.045] transition-all"
            >
              <div className="mb-4 grid h-9 w-9 place-items-center rounded-xl bg-white/[.06]">
                <Icon size={18} />
              </div>
              <b className="text-sm">{title as string}</b>
              <p className="mt-1 text-[11px] text-rp-outline">{sub as string}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          <div className="overflow-hidden rounded-2xl border border-white/[.07] min-h-[380px]">
            <MapView
              routes={routes}
              selectedId={selectedId}
              hazards={hazards}
              className="h-[380px] md:h-[500px]"
            />
          </div>

          <GlassCard className="p-5">
            <div className="eyebrow">INTELLIGENT ROUTING</div>
            <h2 className="mt-2 text-lg font-semibold">Route Intelligence</h2>
            {routes.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-rp-outline">
                Enter an origin and destination above and click <strong>Plan Safe Route</strong>. The map renders real OpenStreetMap A* network paths.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {routes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="w-full text-left"
                  >
                    <div
                      className={`rounded-xl border p-3 ${
                        selectedId === r.id
                          ? "border-rp-green/50 bg-rp-green/[.05]"
                          : "border-white/[.06]"
                      }`}
                    >
                      <b className="text-xs">{r.label}</b>
                      <div className="mt-1 text-[10px] text-rp-outline">
                        {r.analytics.safetyScore ?? "—"} Safety Score •{" "}
                        {r.analytics.actual_distance_km
                          ? `${r.analytics.actual_distance_km.toFixed(1)} km`
                          : "—"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </main>
  );
}