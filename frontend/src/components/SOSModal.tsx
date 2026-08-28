import { useEffect, useState } from "react";
import { Phone, ShieldAlert, X, CheckCircle2 } from "lucide-react";

export function SOSModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [seconds, setSeconds] = useState(5);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setSeconds(5);
      setSent(false);
      return;
    }
    const id = window.setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-md p-6 bg-white shadow-2xl border border-slate-200 rounded-3xl">
        <div className="flex justify-between items-center">
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
            EMERGENCY PROTOCOL
          </span>
          <button onClick={onClose} className="icon-button" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600 shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Emergency SOS</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            This prototype activates an immediate emergency alert sequence to your trusted contacts and broadcasts live GPS coordinates to local emergency services.
          </p>
        </div>

        {!sent ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-center">
              <div className="text-xs font-semibold text-slate-600">Auto-confirmation window</div>
              <div className="mt-1 text-2xl font-extrabold text-red-600">
                {seconds > 0 ? `${seconds} seconds` : "Ready to Dispatch"}
              </div>
            </div>

            <button
              disabled={seconds > 0}
              onClick={() => setSent(true)}
              className="danger-button w-full justify-center py-3.5 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Phone size={18} />
              <span>{seconds > 0 ? `Hold to Confirm (${seconds}s)` : "Dispatch Emergency Alert Now"}</span>
            </button>

            <button onClick={onClose} className="secondary-button w-full justify-center py-3 text-sm">
              Cancel Alert
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
              <div className="flex justify-center mb-2">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div className="text-sm font-bold">Emergency Signal Simulated</div>
              <p className="mt-1 text-xs text-emerald-700">
                Trusted contacts (Mom, Rahul) notified with live tracking link.
              </p>
            </div>
            <button onClick={onClose} className="primary-button w-full justify-center py-3 text-sm">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}