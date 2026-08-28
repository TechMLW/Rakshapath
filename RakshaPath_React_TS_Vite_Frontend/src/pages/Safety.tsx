import { useEffect, useState } from "react";
import { AlertTriangle, LocateFixed, ShieldCheck } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { getSafety } from "../services/api";
import type { SafetyData } from "../types/api";

export default function Safety() {
  const [data, setData] = useState<SafetyData | null>(null);
  const [error, setError] = useState("");

  async function load(posCoord?: { lat: number; lng: number }) {
    setError("");
    try {
      let lat = posCoord?.lat || 20.2961;
      let lng = posCoord?.lng || 85.8245;

      if (!posCoord && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, {
              enableHighAccuracy: true,
              timeout: 3000,
            })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // fallback to default coordinates
        }
      }

      const res = await getSafety({ lat, lng });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SAFETY_REQUEST_FAILED");
    }
  }

  useEffect(() => {
    load({ lat: 20.2961, lng: 85.8245 });
  }, []);

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        <div className="eyebrow">SAFETY INTELLIGENCE</div>
        <div className="flex flex-col justify-between gap-5 md:flex-row">
          <div>
            <h1 className="page-title">Safety Around You</h1>
            <p className="body-muted">
              Live geospatial analytics integrating AI risk models and verified community hazard alerts.
            </p>
          </div>
          <button onClick={() => load()} className="primary-button self-start">
            <LocateFixed size={16} /> Refresh Local Safety
          </button>
        </div>

        {error && <div className="error-box mt-5">Safety Notice: {error}</div>}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="overflow-hidden rounded-2xl border border-white/[.07] min-h-[500px]">
            <MapView
              routes={[]}
              hazards={data?.hazards || []}
              className="h-[520px]"
            />
          </div>

          <div className="space-y-3">
            <GlassCard className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-rp-green/10 text-rp-green">
                  <ShieldCheck />
                </div>
                <div>
                  <div className="eyebrow">LOCAL SAFETY SCORE</div>
                  <div className="text-3xl font-bold">
                    {data?.score !== null && data?.score !== undefined ? `${data.score}` : "—"}
                    <span className="text-sm text-rp-outline"> / 100</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-rp-outline">
                Confidence Band: {data?.confidence ? `${data.confidence}% (Model Verification)` : "—"}
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="eyebrow">CONDITIONS</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="stat-block">
                  <b>{data?.traffic ?? "Normal"}</b>
                  <span>Traffic Flow</span>
                </div>
                <div className="stat-block">
                  <b>{data?.weather ?? "Clear"}</b>
                  <span>Weather Status</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="eyebrow">ACTIVE HAZARD ALERTS</div>
                <span className="text-xs text-rp-blue font-semibold">
                  {(data?.hazards || []).length} Active
                </span>
              </div>
              {(data?.hazards || []).length > 0 ? (
                <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto">
                  {(data?.hazards || []).map((x, i) => (
                    <div key={i} className="rounded-xl border border-white/[.06] p-3 bg-white/[.02]">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="capitalize flex items-center gap-1.5 text-rp-text">
                          <AlertTriangle size={14} className="text-rp-red" />
                          {x.type || x.report_type || "Hazard"}
                        </span>
                        <span className="text-[10px] text-rp-outline uppercase">{x.severity || "medium"}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-rp-outline">{x.description || x.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-rp-outline">No critical road hazards in this sector.</p>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </main>
  );
}