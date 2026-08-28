import { useState } from "react";
import { CheckCircle2, Upload, AlertCircle, FileText, MapPin, X } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { submitIncident } from "../services/api";

const INCIDENT_TYPES = [
  "Hazard",
  "Road Block",
  "Low Lighting",
  "Accident",
  "Flooding",
  "Outage",
  "Suspicious Activity",
  "Lost & Found",
  "Other"
];

const LOST_FOUND_SUBTYPES = ["Valuables", "Personal Items", "Documents", "Electronics", "Other"];

const SEVERITIES = ["Low", "Moderate", "High", "Critical"];

export default function Reports() {
  const [location, setLocation] = useState("Janpath, Saheed Nagar");
  const [type, setType] = useState("Hazard");
  const [lostFoundSubtype, setLostFoundSubtype] = useState(LOST_FOUND_SUBTYPES[0]);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Moderate");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [reportId, setReportId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim() || !description.trim()) {
      setError("Please fill out both location and incident description.");
      setState("error");
      return;
    }

    setState("loading");
    setError("");

    const reportType = type === "Lost & Found" ? `Lost & Found: ${lostFoundSubtype}` : type;

    try {
      const res = (await submitIncident({
        location,
        type: reportType,
        description,
        severity,
        photo: file || undefined
      })) as { id?: string };

      setReportId(res?.id || `rep-${Date.now().toString(36)}`);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report submission failed.");
      setState("error");
    }
  }

  function handleReset() {
    setDescription("");
    setFile(null);
    setState("idle");
    setError("");
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="eyebrow">COMMUNITY SAFETY NETWORK</span>
        </div>
        <h1 className="page-title">Report a safety incident</h1>
        <p className="body-muted mt-1">
          Crowdsourced incident reports help RakshaPath dynamically route commuters away from unlit zones, road hazards, and emergencies.
        </p>

        <GlassCard className="mt-6 p-6 md:p-8">
          {state === "success" ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Incident Reported Successfully</h2>
              <p className="mx-auto max-w-md text-xs text-slate-500 leading-relaxed">
                Saved to the backend database under report ID <code className="font-bold text-slate-700">{reportId}</code>.
              </p>

              <div className="pt-4">
                <button onClick={handleReset} className="primary-button mx-auto px-6">
                  Submit Another Report
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Location Input */}
              <div>
                <label className="label">Location or Landmark</label>
                <div className="field">
                  <MapPin size={16} className="text-slate-400" />
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Enter street, area, or coordinates"
                    required
                  />
                </div>
              </div>

              {/* Incident Type */}
              <div>
                <label className="label">Incident Category</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INCIDENT_TYPES.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setType(cat)}
                      className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        type === cat
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {type === "Lost & Found" && (
                  <div className="mt-3">
                    <label className="label">Lost & Found Type</label>
                    <div className="flex flex-wrap gap-2">
                      {LOST_FOUND_SUBTYPES.map(sub => (
                        <button
                          type="button"
                          key={sub}
                          onClick={() => setLostFoundSubtype(sub)}
                          className={`chip ${lostFoundSubtype === sub ? "chip-active" : ""}`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="label">Description & Details</label>
                <textarea
                  className="field-input min-h-[100px] resize-y"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what you observed (e.g. fallen branch blocking left lane, dark street with faulty light)..."
                  required
                />
              </div>

              {/* Severity */}
              <div>
                <label className="label">Severity Level</label>
                <div className="flex flex-wrap gap-2">
                  {SEVERITIES.map(sev => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`chip ${severity === sev ? "chip-active" : ""}`}
                    >
                      {sev === "Critical" ? "🚨 " : sev === "High" ? "⚠️ " : ""}
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Attachment */}
              <div>
                <label className="label">Attach Photo Evidence (Optional)</label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Upload size={18} className="text-slate-400" />
                    <span>{file ? file.name : "Upload image (JPEG, PNG)"}</span>
                  </div>
                  {file && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {state === "error" && (
                <div className="error-box flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state === "loading"}
                className="primary-button w-full justify-center py-3.5 text-sm"
              >
                {state === "loading" ? "Submitting Report…" : "Submit Incident Report"}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}