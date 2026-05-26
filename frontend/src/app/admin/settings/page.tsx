"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const TOGGLE_ON  = "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)";
const TOGGLE_OFF = "#e0e0ea";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative flex-shrink-0 w-12 h-7 rounded-full cursor-pointer transition-all duration-200 focus:outline-none"
      style={{ background: checked ? TOGGLE_ON : TOGGLE_OFF }}
    >
      <span
        className="absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-200"
        style={{ left: checked ? "calc(100% - 28px)" : "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [tab,       setTab]       = useState("General");
  const [settings,  setSettings]  = useState<Record<string, string>>({});

  // General fields
  const [platformName, setPlatformName] = useState("IELTS Journal");
  const [supportEmail, setSupportEmail] = useState("support@ieltsjournal.com");
  const [contactNumber, setContactNumber] = useState("+880 1234 567890");
  const [timezone, setTimezone] = useState("UTC+6 (Dhaka)");
  const [description, setDescription] = useState("");

  // Test fields
  const [listeningDuration, setListeningDuration] = useState("40");
  const [readingDuration, setReadingDuration] = useState("60");
  const [writingDuration, setWritingDuration] = useState("60");
  const [speakingDuration, setSpeakingDuration] = useState("15");
  const [writingSla, setWritingSla] = useState("48");
  const [maxPending, setMaxPending] = useState("10");

  const [prefToggles, setPrefToggles]   = useState([true, true, true, false, false]);
  const [notifToggles, setNotifToggles] = useState([true, true, true, true, true, true, true]);
  const [secToggles, setSecToggles]     = useState([false, false, true]);

  const tabs = ["General", "Tests", "Notifications", "Billing", "Security"];

  // Load settings from API on mount
  useEffect(() => {
    api.get<Record<string, string>>("/api/admin/settings").then(s => {
      setSettings(s ?? {});
      if (s.platform_name)     setPlatformName(s.platform_name);
      if (s.support_email)     setSupportEmail(s.support_email);
      if (s.contact_number)    setContactNumber(s.contact_number);
      if (s.timezone)          setTimezone(s.timezone);
      if (s.platform_description) setDescription(s.platform_description);
      if (s.listening_duration)   setListeningDuration(s.listening_duration);
      if (s.reading_duration)     setReadingDuration(s.reading_duration);
      if (s.writing_duration)     setWritingDuration(s.writing_duration);
      if (s.speaking_duration)    setSpeakingDuration(s.speaking_duration);
      if (s.writing_review_sla)   setWritingSla(s.writing_review_sla);
      if (s.max_pending_per_examiner) setMaxPending(s.max_pending_per_examiner);

      // Pref toggles
      setPrefToggles([
        s.allow_registration !== 'false',
        s.require_email_verification !== 'false',
        s.show_auto_score !== 'false',
        s.allow_same_day_retake === 'true',
        s.maintenance_mode === 'true',
      ]);
      // Sec toggles
      setSecToggles([
        s.two_factor_auth === 'true',
        s.ip_restriction === 'true',
        s.session_timeout !== 'false',
      ]);
    }).catch(() => {});
  }, []);

  async function save() {
    setSaveError("");
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        platform_name:            platformName,
        support_email:            supportEmail,
        contact_number:           contactNumber,
        timezone,
        platform_description:     description,
        listening_duration:       listeningDuration,
        reading_duration:         readingDuration,
        writing_duration:         writingDuration,
        speaking_duration:        speakingDuration,
        writing_review_sla:       writingSla,
        max_pending_per_examiner: maxPending,
        allow_registration:            String(prefToggles[0]),
        require_email_verification:    String(prefToggles[1]),
        show_auto_score:               String(prefToggles[2]),
        allow_same_day_retake:         String(prefToggles[3]),
        maintenance_mode:              String(prefToggles[4]),
        two_factor_auth:               String(secToggles[0]),
        ip_restriction:                String(secToggles[1]),
        session_timeout:               String(secToggles[2]),
      };
      await api.patch("/api/admin/settings", payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Settings</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">Platform configuration and preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-[14px]"
            style={{ background: "#dff1e8", border: "1px solid #b6e4c8", color: "#2a9350" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Settings saved
          </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-[14px] w-fit" style={{ background: "#f6f7fb" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 text-sm font-semibold rounded-[10px] cursor-pointer transition-all"
            style={tab === t ? { background: "white", color: "#222225", boxShadow: "0 2px 8px rgba(32,28,54,0.08)" } : { color: "#7b7b8d" }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "General" && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] p-6 space-y-5" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Platform Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Platform Name</label>
                <input type="text" value={platformName} onChange={e => setPlatformName(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Support Email</label>
                <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Contact Number</label>
                <input type="text" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Default Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none cursor-pointer bg-white" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }}>
                  <option>UTC+0 (London)</option>
                  <option>UTC+6 (Dhaka)</option>
                  <option>UTC+5:30 (Mumbai)</option>
                  <option>UTC+8 (Beijing)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#353741] mb-1.5">Platform Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none resize-none"
                style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-6 space-y-4" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Preferences</h2>
            {[
              { label: "Allow new registrations", desc: "Students can sign up without an invite" },
              { label: "Require email verification", desc: "Students must verify email before taking a test" },
              { label: "Show band scores immediately for auto-marked modules", desc: "Listening and Reading scores are shown right after submission" },
              { label: "Allow students to retake tests on the same day", desc: "If disabled, students must wait 24h between tests" },
              { label: "Maintenance mode", desc: "Temporarily disable student access to the platform" },
            ].map((p, i) => (
              <div key={p.label} className="flex items-start gap-4 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#222225]">{p.label}</p>
                  <p className="text-xs text-[#7b7b8d] mt-0.5">{p.desc}</p>
                </div>
                <Toggle checked={prefToggles[i]} onChange={() => setPrefToggles((prev) => prev.map((v, j) => j === i ? !v : v))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Tests" && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] p-6 space-y-5" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Test Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Listening duration (minutes)</label>
                <input type="number" value={listeningDuration} onChange={e => setListeningDuration(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Reading duration (minutes)</label>
                <input type="number" value={readingDuration} onChange={e => setReadingDuration(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Writing duration (minutes)</label>
                <input type="number" value={writingDuration} onChange={e => setWritingDuration(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Speaking duration (minutes)</label>
                <input type="number" value={speakingDuration} onChange={e => setSpeakingDuration(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Number of Listening questions</label>
                <input type="number" defaultValue="40" className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Number of Reading questions</label>
                <input type="number" defaultValue="40" className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] p-6 space-y-5" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Writing Review SLA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Target review turnaround (hours)</label>
                <input type="number" value={writingSla} onChange={e => setWritingSla(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Max pending per examiner</label>
                <input type="number" value={maxPending} onChange={e => setMaxPending(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="bg-white rounded-[20px] p-6 space-y-4" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Email Notifications</h2>
          {[
            { label: "New student registration", desc: "Send admin alert when a new student signs up" },
            { label: "Writing submission received", desc: "Notify assigned examiner when writing is submitted" },
            { label: "Writing review completed", desc: "Email student when examiner submits writing feedback" },
            { label: "Speaking booking confirmed", desc: "Send confirmation email to student and examiner" },
            { label: "Speaking 24h reminder", desc: "Remind student and examiner 24h before session" },
            { label: "Speaking session completed", desc: "Notify student when speaking result is published" },
            { label: "Overdue review alert", desc: "Alert admin when a submission exceeds the SLA" },
          ].map((n, i) => (
            <div key={n.label} className="flex items-start gap-4 py-2" style={{ borderBottom: "1px solid #f6f7fb" }}>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#222225]">{n.label}</p>
                <p className="text-xs text-[#7b7b8d] mt-0.5">{n.desc}</p>
              </div>
              <Toggle checked={notifToggles[i]} onChange={() => setNotifToggles((prev) => prev.map((v, j) => j === i ? !v : v))} />
            </div>
          ))}
        </div>
      )}

      {tab === "Billing" && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] p-6 space-y-4" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Subscription Plans</h2>
            {[
              { name: "Starter", price: "19", tests: "2", writing: false, speaking: false, bg: "#f6f7fb", color: "#7b7b8d" },
              { name: "Pro", price: "39", tests: "Unlimited", writing: true, speaking: "2/month", bg: "#efe7ff", color: "#6a45d0" },
              { name: "Intensive", price: "69", tests: "Unlimited", writing: true, speaking: "Daily", bg: "#d7e6ff", color: "#2a55a0" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-4 p-4 rounded-[14px]" style={{ border: "1px solid #ececf3" }}>
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: p.bg }}>
                  <span className="text-xs font-bold" style={{ color: p.color }}>{p.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#222225]">{p.name}</p>
                  <p className="text-xs text-[#7b7b8d] mt-0.5">
                    {p.tests} mock tests · Writing: {p.writing ? "Yes" : "No"} · Speaking: {typeof p.speaking === "string" ? p.speaking : "No"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-[#7b7b8d]">$</span>
                    <input type="number" defaultValue={p.price}
                      className="w-16 text-sm font-bold text-[#222225] text-center rounded-[10px] px-2 py-1.5 outline-none"
                      style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
                    <span className="text-xs text-[#a4a4b5]">/mo</span>
                  </div>
                  <button className="text-xs font-bold cursor-pointer" style={{ color: "#9a72ff" }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] p-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3 mb-4" style={{ borderBottom: "1px solid #f1f1f7" }}>Payment Gateway</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Stripe Publishable Key</label>
                <input defaultValue="pk_live_••••••••••••••••••••" className="w-full font-mono px-4 py-2.5 text-sm rounded-[12px] outline-none"
                  style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Stripe Secret Key</label>
                <input type="password" defaultValue="sk_live_••••••••••••••••••••" className="w-full font-mono px-4 py-2.5 text-sm rounded-[12px] outline-none"
                  style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Security" && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] p-6 space-y-5" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Admin Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Admin Name</label>
                <input defaultValue="Admin User" className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none"
                  style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Admin Email</label>
                <input defaultValue="admin@ieltsjournal.com" className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none"
                  style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none"
                  style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 text-sm rounded-[12px] outline-none"
                  style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] p-6 space-y-4" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-sm font-bold text-[#222225] pb-3" style={{ borderBottom: "1px solid #f1f1f7" }}>Security Options</h2>
            {[
              { label: "Two-factor authentication (2FA)", desc: "Require 2FA for admin login" },
              { label: "Login IP restriction", desc: "Only allow logins from whitelisted IP addresses" },
              { label: "Session timeout (30 min)", desc: "Auto log out admin after 30 minutes of inactivity" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-start gap-4 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#222225]">{s.label}</p>
                  <p className="text-xs text-[#7b7b8d] mt-0.5">{s.desc}</p>
                </div>
                <Toggle checked={secToggles[i]} onChange={() => setSecToggles((prev) => prev.map((v, j) => j === i ? !v : v))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {saveError && <span className="text-xs font-semibold text-red-500">{saveError}</span>}
        <button
          onClick={save}
          disabled={saving}
          className="text-white text-sm font-bold px-8 py-3 rounded-[14px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
