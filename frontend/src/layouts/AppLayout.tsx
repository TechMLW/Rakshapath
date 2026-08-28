import type { ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { MobileNav } from "../components/MobileNav";
import { SOSModal } from "../components/SOSModal";
import { RoutePlannerProvider } from "../context/RoutePlannerContext";
import { AlertTriangle } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [sosOpen, setSosOpen] = useState(false);

  return (
    <RoutePlannerProvider>
      <div className="app-shell min-h-screen">
        <Sidebar onSOS={() => setSosOpen(true)} />
        
        <div className="app-content min-w-0 flex-1">
          {children}
        </div>

        <MobileNav />

        {/* Floating SOS button for mobile screens */}
        <button
          onClick={() => setSosOpen(true)}
          className="fixed bottom-20 right-4 z-[750] flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-red-500/30 lg:hidden hover:bg-red-700 active:scale-95"
          aria-label="Emergency SOS"
        >
          <AlertTriangle size={15} />
          <span>SOS</span>
        </button>

        <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
      </div>
    </RoutePlannerProvider>
  );
}
