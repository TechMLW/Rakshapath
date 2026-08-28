import { Clock3, Gauge, IndianRupee, ShieldCheck, Zap } from "lucide-react";
import type { RouteOption } from "../types/api";
import { colorForRoute } from "./MapView";

function formatMinutes(seconds?: number): string {
  if (seconds == null) return "—";
  return `${Math.round(seconds / 60)} min`;
}

function formatKm(meters?: number): string {
  if (meters == null) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function RouteCard({
  route,
  selected,
  onClick
}: {
  route: RouteOption;
  selected: boolean;
  onClick: () => void;
}) {
  const safetyScore = route.analytics.safetyScore ?? 0;
  const isHighSafety = safetyScore >= 90;
  const isModerateSafety = safetyScore >= 80 && safetyScore < 90;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all duration-150 ${
        selected
          ? "border-blue-600 bg-blue-50/60 shadow-[0_4px_20px_rgba(37,99,235,0.12)] ring-2 ring-blue-500/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: colorForRoute(route) }}
              aria-hidden="true"
            />
            <span className="font-bold text-slate-900">{route.label}</span>
            {route.isRecommended && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{route.description}</p>
        </div>

        {/* Safety Score Pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${
            isHighSafety
              ? "bg-emerald-100 text-emerald-800"
              : isModerateSafety
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          <ShieldCheck size={14} />
          <span>{safetyScore}/100</span>
        </div>
      </div>

      {/* Route Quick Stats */}
      <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Clock3 size={15} className="text-slate-400" />
          <span className="font-semibold">{formatMinutes(route.analytics.durationSeconds)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <Gauge size={15} className="text-slate-400" />
          <span className="font-semibold">{formatKm(route.analytics.distanceMeters)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <IndianRupee size={14} className="text-slate-400" />
          <span className="font-semibold">₹{route.analytics.cost}</span>
        </div>
      </div>

      {/* Safety Highlights */}
      {route.analytics.safetyHighlights && route.analytics.safetyHighlights.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1">
          {route.analytics.safetyHighlights.slice(0, 2).map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            >
              <Zap size={11} className="text-blue-500" />
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}