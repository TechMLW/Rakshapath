import { Compass, Flag, Map, Shield, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  ["/", "Explore", Compass], ["/routes", "Routes", Map], ["/reports", "Reports", Flag], ["/safety", "Safety", Shield], ["/profile", "Profile", UserRound]
] as const;

export function MobileNav() {
  return <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-[68px] grid-cols-5 border-t border-white/[.08] bg-rp-bg/90 backdrop-blur-xl lg:hidden">
    {items.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive}) => `grid place-items-center text-[10px] ${isActive ? "text-white" : "text-rp-outline"}`}>
      <Icon size={19}/><span>{label}</span>
    </NavLink>)}
  </nav>;
}