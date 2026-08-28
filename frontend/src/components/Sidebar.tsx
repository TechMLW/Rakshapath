import { Compass, Flag, Map, Shield, UserRound, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Brand } from "./Brand";

const NAV_ITEMS = [
  { to: "/", label: "Explore", icon: Compass },
  { to: "/routes", label: "Routes", icon: Map },
  { to: "/safety", label: "Safety Intel", icon: Shield },
  { to: "/reports", label: "Report Issue", icon: Flag },
  { to: "/profile", label: "Safety Profile", icon: UserRound }
] as const;

export function Sidebar({ onSOS }: { onSOS: () => void }) {
  return (
    <aside className="map-sidebar hidden lg:flex">
      <div className="px-2 py-2">
        <Brand />
      </div>

      <nav className="mt-7 space-y-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `map-nav-item ${isActive ? "map-nav-active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        {/* Emergency SOS */}
        <button
          onClick={onSOS}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-700 active:scale-[0.98]"
        >
          <AlertTriangle size={17} />
          <span>Emergency SOS</span>
        </button>

        {/* User Card */}
        <NavLink
          to="/profile"
          className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 text-inherit no-underline hover:opacity-90"
        >
          <div className="avatar bg-blue-100 text-blue-800">SA</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800 truncate">Saumya Anand</div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Guardian Active
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
