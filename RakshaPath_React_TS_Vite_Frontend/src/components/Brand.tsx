import { ShieldCheck } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-rp-high text-rp-text">
        <ShieldCheck size={19} strokeWidth={1.8} />
      </div>
      <div>
        <div className="font-semibold tracking-tight">RakshaPath</div>
        <div className="text-[10px] uppercase tracking-[.18em] text-rp-outline">AI Safety Navigator</div>
      </div>
    </div>
  );
}