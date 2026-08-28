import { useState, useEffect } from "react";
import {
  AlertTriangle,
  LocateFixed,
  ShieldCheck,
  Zap,
  Sun,
  ShieldAlert,
  Car,
  Activity,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { getSafety } from "../services/api";
import type { SafetyData } from "../types/api";

export default function Safety() {
  const [data, setData] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSafetyData() {
    setLoading(true);
    setError("");
    try {
      const result = await getSafety();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load safety intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSafetyData();
  }, []);

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">SAFETY INTELLIGENCE</span>
            </div>
            <h1 className="page-title">Safety around you</h1>
            <p className="body-muted mt-1">
              Community-reported hazards from the live backend. Lighting/patrol/crowd metrics are not shown — the backend has no data source for them.
            </p>
          </div>

          <button
            onClick={loadSafetyData}
            disabled={loading}
            className="primary-button self-start md:self-auto"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <LocateFixed size={16} />
            )}
            <span>{loading ? "Updating…" : "Refresh Live Intel"}</span>
          </button>
        </div>

        {error && <div className="error-box mt-5">⚠️ {error}</div>}

        {/* Content Grid */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Map Section */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm h-[440px] lg:h-[560px]">
            <MapView className="h-full w-full" />
          </div>

          {/* Intel Panels */}
          <div className="space-y-4">
            {/* Safety Score Card */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <div className="eyebrow">OVERALL SAFETY INDEX</div>
                    <div className="text-3xl font-extrabold text-slate-900">
                      {data ? data.score : "—"}
                      <span className="text-base font-bold text-slate-400"> / 100</span>
                    </div>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {data ? `Derived from ${data.hazards.length} open report(s)` : "No data yet"}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 flex items-center justify-between">
                <span>Source: <b>Live backend (GET /reports/)</b></span>
                <span>Area: <b>Bhubaneswar</b></span>
              </div>
            </GlassCard>

            {/* Environmental & Patrol Metrics */}
            <GlassCard className="p-5">
              <div className="eyebrow">CORRIDOR CONDITIONS</div>
              <p className="mt-1 text-[11px] text-slate-500">
                Not available — the backend has no lighting/patrol/traffic/crowd data source. Shown honestly as unavailable rather than a placeholder number.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="stat-block">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Sun size={14} className="text-amber-500" />
                    <span>Lighting Index</span>
                  </div>
                  <b>—</b>
                  <span>Not measured by backend</span>
                </div>

                <div className="stat-block">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <ShieldAlert size={14} className="text-blue-500" />
                    <span>PCR Patrols</span>
                  </div>
                  <b className="text-xs">—</b>
                  <span>Not measured by backend</span>
                </div>

                <div className="stat-block">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Car size={14} className="text-emerald-500" />
                    <span>Traffic Flow</span>
                  </div>
                  <b className="text-xs">—</b>
                  <span>Not measured by backend</span>
                </div>

                <div className="stat-block">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Activity size={14} className="text-indigo-500" />
                    <span>Crowd Density</span>
                  </div>
                  <b className="text-xs">—</b>
                  <span>Not measured by backend</span>
                </div>
              </div>
            </GlassCard>

            {/* Local Alerts & Verified Reports */}
            <GlassCard className="p-5">
              <div className="eyebrow">LOCALIZED SAFETY NOTES & ALERTS</div>
              <div className="mt-3 space-y-2.5">
                {data?.hazards && data.hazards.length > 0 ? (
                  data.hazards.map((h, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                        <span>{h.type} ({h.severity} severity)</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">{h.message}</p>
                    </div>
                  ))
                ) : null}

                {data?.incidents && data.incidents.map((inc, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex items-start gap-2.5"
                  >
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">{inc.type}</div>
                      <p className="mt-0.5 text-[11px] text-slate-600">{inc.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </main>
  );
}