import { useState } from "react";
import { ShieldCheck, User, Phone, Plus, Bell, HeartHandshake, CheckCircle2 } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary?: boolean;
}

export default function Profile() {
  const [nightMode, setNightMode] = useState(true);
  const [dynamicReroute, setDynamicReroute] = useState(true);
  const [lowBatterySOS, setLowBatterySOS] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(true);

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Mom", relation: "Primary Trusted Contact", phone: "+91 98765 43210", isPrimary: true },
    { id: "2", name: "Dad", relation: "Primary Trusted Contact", phone: "+91 98765 43211" }
  ]);

  const [newContactModal, setNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("Friend");

  function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setContacts([
      ...contacts,
      {
        id: Date.now().toString(),
        name: newContactName,
        relation: newContactRelation,
        phone: newContactPhone
      }
    ]);
    setNewContactName("");
    setNewContactPhone("");
    setNewContactModal(false);
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="eyebrow">SAFETY ACCOUNT</span>
        </div>
        <h1 className="page-title">Safety profile & preferences</h1>

        {/* User Card */}
        <GlassCard className="mt-6 flex flex-wrap items-center gap-4 p-6">
          <div className="avatar h-16 w-16 text-lg bg-blue-100 text-blue-700 font-black shadow-inner">
            SA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Saumya Anand</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
                <ShieldCheck size={14} />
                Guardian Level 3
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Active Member • 42 Safe Trips Logged • Verified Community Contributor
            </div>
          </div>
        </GlassCard>

        {/* Settings Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Safety Settings */}
          <GlassCard className="p-6">
            <div className="eyebrow">AI SAFETY NAVIGATION PREFERENCES</div>
            <div className="mt-2 divide-y divide-slate-100">
              <SettingRow
                title="Night Safety Corridor"
                description="Automatically prioritize illuminated routes with verified municipal CCTV after 7:00 PM."
                enabled={nightMode}
                onToggle={() => setNightMode(!nightMode)}
              />
              <SettingRow
                title="Dynamic Hazard Avoidance"
                description="Prompt and auto-recalculate when community reports detect waterlogging or road blocks."
                enabled={dynamicReroute}
                onToggle={() => setDynamicReroute(!dynamicReroute)}
              />
              <SettingRow
                title="Low-Battery Emergency Beacon"
                description="Send location ping to trusted contacts if phone battery drops below 10% during active trip."
                enabled={lowBatterySOS}
                onToggle={() => setLowBatterySOS(!lowBatterySOS)}
              />
              <SettingRow
                title="Spoken Hazard Prompts"
                description="Play voice advisory when navigating through low-visibility corridors."
                enabled={voiceGuidance}
                onToggle={() => setVoiceGuidance(!voiceGuidance)}
              />
            </div>
          </GlassCard>

          {/* Trusted Emergency Contacts */}
          <GlassCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="eyebrow">TRUSTED EMERGENCY CONTACTS</div>
                <span className="text-xs font-bold text-slate-500">{contacts.length} added</span>
              </div>

              <div className="mt-3 space-y-3">
                {contacts.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar bg-slate-200 text-slate-700 font-bold">
                        {c.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <b className="text-sm text-slate-800">{c.name}</b>
                          {c.isPrimary && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[9px] font-bold text-blue-700">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 block">{c.relation} • {c.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setNewContactModal(true)}
                className="secondary-button w-full justify-center py-2.5 text-xs font-bold"
              >
                <Plus size={15} />
                <span>Add Emergency Contact</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Modal for adding contact */}
        {newContactModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="glass-card w-full max-w-sm p-6 bg-white shadow-2xl rounded-2xl">
              <h3 className="text-base font-extrabold text-slate-900">Add Trusted Contact</h3>
              <form onSubmit={handleAddContact} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="label">Contact Name</label>
                  <input
                    className="field-input"
                    value={newContactName}
                    onChange={e => setNewContactName(e.target.value)}
                    placeholder="e.g. Papa, Sister"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    className="field-input"
                    value={newContactPhone}
                    onChange={e => setNewContactPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    required
                  />
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <input
                    className="field-input"
                    value={newContactRelation}
                    onChange={e => setNewContactRelation(e.target.value)}
                    placeholder="Family / Friend / Coworker"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button type="submit" className="primary-button flex-1 py-2.5">
                    Save Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewContactModal(false)}
                    className="secondary-button py-2.5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <b className="text-sm font-bold text-slate-800">{title}</b>
        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      <div
        role="switch"
        aria-checked={enabled}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && onToggle()}
        className={`toggle shrink-0 ${enabled ? "toggle-on" : ""}`}
      >
        <span />
      </div>
    </div>
  );
}