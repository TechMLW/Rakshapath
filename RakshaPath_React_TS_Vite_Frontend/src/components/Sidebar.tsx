import { Compass, Flag, Map, Shield, UserRound, TriangleAlert } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Brand } from "./Brand";

const items = [
  ["/", "Explore", Compass],
  ["/routes", "Routes", Map],
  ["/reports", "Reports", Flag],
  ["/safety", "Safety", Shield],
  ["/profile", "Profile", UserRound]
] as const;

export function Sidebar({ onSOS }: { onSOS: () => void }) {
  return (
    <aside className="hidden h-screen w-[252px] shrink-0 flex-col border-r border-white/[.07] bg-black/10 px-4 py-6 lg:flex">
      <div className="px-2 pb-8"><Brand /></div>
      <nav className="space-y-1">
        {items.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className={({isActive}) =>
            `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
              isActive ? "bg-white/[.07] text-white" : "text-rp-muted hover:bg-white/[.04]"
            }`
          }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3">
        <button onClick={onSOS} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rp-redStrong py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(147,0,10,.28)] hover:brightness-110">
          <TriangleAlert size={17}/> Emergency SOS
        </button>
        <div className="flex items-center gap-3 border-t border-white/[.07] pt-4">
          <div className="avatar">PS</div>
          <div><div className="text-xs font-semibold">Priya Sharma</div><div className="text-[10px] text-rp-outline">Guardian Badge</div></div>
        </div>
      </div>
    </aside>
  );
}