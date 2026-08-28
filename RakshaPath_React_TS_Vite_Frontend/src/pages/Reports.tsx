import { useState } from "react";
import { Check, LocateFixed, Upload } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { submitIncident } from "../services/api";
import { GeocodeError, geocodeLocation } from "../services/geocoding";

export default function Reports() {
  const [location, setLocation] = useState("Janpath Road, Master Canteen");
  const [type, setType] = useState("Hazard");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Moderate");
  const [file, setFile] = useState<File>();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function locateUser() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (GPS)`);
      },
      () => {}
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe the incident details.");
      setState("error");
      return;
    }

    setState("loading");
    setError("");

    try {
      const resolved = await geocodeLocation(location);
      await submitIncident({
        location,
        type,
        report_type: type.toLowerCase(),
        description: description.trim(),
        severity: severity.toLowerCase(),
        latitude: resolved.lat,
        longitude: resolved.lng,
        photo: file,
      });
      setState("success");
    } catch (err: any) {
      setError(err instanceof GeocodeError ? err.message : err instanceof Error ? err.message : "REPORT_FAILED");
      setState("error");
    }
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-3xl">
        <div className="eyebrow">COMMUNITY SAFETY NETWORK</div>
        <h1 className="page-title">Report an Incident</h1>
        <p className="body-muted">
          Your report updates real-time hazard maps and alerts community responders.
        </p>

        <GlassCard className="mt-6 p-5 md:p-7 shadow-2xl">
          {state === "success" ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rp-green/10 text-rp-green">
                <Check />
              </div>
              <h2 className="mt-5 text-xl font-bold text-rp-text">Report Verified & Broadcasted</h2>
              <p className="mt-2 text-sm text-rp-outline">
                The incident has been recorded in the spatial database and safety layers updated.
              </p>
              <button
                onClick={() => {
                  setState("idle");
                  setDescription("");
                }}
                className="primary-button mx-auto mt-6"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="label">Incident Location</label>
                <div className="flex items-center gap-2">
                  <input
                    className="field-input flex-1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Janpath Road or lat, lon"
                  />
                  <button
                    type="button"
                    onClick={locateUser}
                    title="Use GPS"
                    className="secondary-button whitespace-nowrap"
                  >
                    <LocateFixed size={15} /> GPS
                  </button>
                </div>
              </div>

              <div>
                <span className="label">Incident Category</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {["Hazard", "Flood", "Accident", "Lighting", "Crime", "Medical", "Blockage", "Other"].map((x) => (
                    <button
                      type="button"
                      key={x}
                      onClick={() => setType(x)}
                      className={`rounded-xl border p-3 text-xs font-semibold transition-all ${
                        type === x
                          ? "border-rp-blue/60 bg-rp-blue/10 text-rp-blue shadow"
                          : "border-white/[.07] bg-white/[.025] text-rp-outline hover:text-rp-text"
                      }`}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Incident Description</label>
                <textarea
                  className="field-input min-h-28"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Heavy waterlogging over 2 feet deep near underpass, road impassable..."
                />
              </div>

              <div>
                <span className="label">Severity Level</span>
                <div className="flex flex-wrap gap-2">
                  {["Low", "Moderate", "High", "Critical"].map((x) => (
                    <button
                      type="button"
                      key={x}
                      onClick={() => setSeverity(x)}
                      className={`chip uppercase text-[11px] font-bold ${severity === x ? "chip-active" : ""}`}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 p-4 text-sm text-rp-outline hover:border-white/30 transition-all">
                <Upload size={17} />
                <span>{file?.name ?? "Attach photo or evidence (optional)"}</span>
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </label>

              {state === "error" && (
                <div className="error-box">Submission Notice: {error}</div>
              )}

              <button
                disabled={state === "loading"}
                className="primary-button w-full justify-center py-3.5"
              >
                {state === "loading" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-rp-bg border-t-transparent rounded-full animate-spin" />
                    Submitting to Safety Network…
                  </>
                ) : (
                  "Broadcast Safety Report"
                )}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}