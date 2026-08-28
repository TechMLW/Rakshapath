import { Compass, Flag, Map, Shield, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Explore", icon: Compass },
  { to: "/routes", label: "Routes", icon: Map },
  { to: "/safety", label: "Safety", icon: Shield },
  { to: "/reports", label: "Reports", icon: Flag },
  { to: "/profile", label: "Profile", icon: UserRound }
] as const;

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[800] grid h-16 grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden shadow-lg">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}