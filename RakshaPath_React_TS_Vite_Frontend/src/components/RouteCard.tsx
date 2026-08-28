import { Clock3, Gauge, ShieldCheck, Zap } from "lucide-react";
import type { RouteOption } from "../types/api";

function formatMinutes(seconds?: number, mins?: number) {
  if (mins != null) return `${Math.round(mins)} min`;
  if (seconds != null) return `${Math.round(seconds / 60)} min`;
  return "—";
}

function formatKm(meters?: number, kmVal?: number) {
  if (kmVal != null) return `${kmVal.toFixed(1)} km`;
  if (meters != null) return `${(meters / 1000).toFixed(1)} km`;
  return "—";
}

export function RouteCard({
  route,
  selected,
  onClick,
}: {
  route: RouteOption;
  selected: boolean;
  onClick: () => void;
}) {
  const profileSubtitles: Record<string, string> = {
    safest: "Prioritizes street surveillance & hazard avoidance",
    fastest: "Optimized for minimal travel duration",
    balanced: "Balanced compromise between speed and safety",
    rerouted: "Active Dynamic Hazard Bypass Route",
  };

  const isSafest = route.id === "safest" || route.id === "rerouted";
  const subtitle = profileSubtitles[route.id] || "Optimized road network corridor";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-rp-green/60 bg-rp-green/[.06] shadow-[0_0_24px_rgba(78,222,163,.08)]"
          : "border-white/[.07] bg-white/[.025] hover:bg-white/[.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-rp-text flex items-center gap-1.5">
            {route.label}
            {isSafest && (
              <span className="rounded-md bg-rp-green/15 text-rp-green text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                AI Best
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-rp-outline">{subtitle}</div>
        </div>
        {selected && (
          <span className="rounded-full bg-rp-green/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-rp-green border border-rp-green/20">
            Active
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
        <div className="stat">
          <Clock3 size={14} className="text-rp-blue" />
          <span>{formatMinutes(route.analytics.durationSeconds, route.analytics.estimated_time_minutes)}</span>
        </div>
        <div className="stat">
          <Gauge size={14} className="text-rp-outline" />
          <span>{formatKm(route.analytics.distanceMeters, route.analytics.actual_distance_km)}</span>
        </div>
        <div className="stat">
          <ShieldCheck size={14} className="text-rp-green" />
          <span>
            Safety: <strong>{route.analytics.safety_score ?? route.analytics.safetyScore ?? "—"}/100</strong>
          </span>
        </div>
        <div className="stat">
          <Zap size={14} className="text-rp-outline" />
          <span>Cost Metric: {route.analytics.cost ? route.analytics.cost.toFixed(1) : "—"}</span>
        </div>
      </div>
    </button>
  );
}