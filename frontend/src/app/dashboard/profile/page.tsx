"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { DashboardData, Profile } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [targetBand, setTargetBand] = useState("7.5");
  const [track,     setTrack]     = useState("academic");

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwSaved,  setPwSaved]    = useState(false);
  const [pwError,  setPwError]    = useState("");

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then((d) => {
        if (d?.profile) {
          const p: Profile = d.profile;
          setProfile(p);
          const parts = (p.full_name ?? "").split(" ");
          setFirstName(parts[0] ?? "");
          setLastName(parts.slice(1).join(" ") ?? "");
          setEmail(p.email ?? "");
          setTargetBand(String(p.target_band ?? 7.5));
          setTrack(p.track ?? "academic");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    try {
      const full_name = `${firstName} ${lastName}`.trim();
      await api.patch("/api/auth/me", {
        full_name,
        target_band: parseFloat(targetBand),
        track,
      });
      // Refresh profile
      const d = await api.get<DashboardData>("/api/dashboard");
      if (d?.profile) setProfile(d.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields required."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (newPw.length < 8)    { setPwError("New password must be at least 8 characters."); return; }
    setPwSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        current_password: currentPw,
        new_password:     newPw,
      });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e: any) {
      setPwError(e?.message ?? "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  const planLabel = profile?.plan
    ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)
    : "Starter";

  const inputClass = "w-full px-3.5 py-2.5 border border-[#ececf3] rounded-xl text-sm text-[#222225] bg-white focus:outline-none focus:ring-2 focus:ring-[#9a72ff] focus:border-transparent disabled:opacity-50 disabled:bg-[#f6f7fb]";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Profile</h1>
        <p className="text-sm text-[#7b7b8d] font-medium mt-0.5">Manage your account details and preferences</p>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="mb-6 bg-[#dff1e8] border border-[#c4e8d4] text-[#2a9350] text-sm font-bold px-4 py-3 rounded-[14px] flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Profile saved
        </div>
      )}
      {saveError && (
        <div className="mb-6 rounded-[14px] px-4 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {saveError}
        </div>
      )}

      {/* Avatar + plan */}
      <div className="bg-white rounded-[20px] p-6 mb-5" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            {loading ? "…" : initials}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-5 bg-[#ececf3] rounded w-32" />
                <div className="h-4 bg-[#ececf3] rounded w-20" />
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-[#222225] truncate">{profile?.full_name ?? "Student"}</p>
                <span className={`mt-1 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                  profile?.plan === "pro"       ? "bg-[#d7e6ff] text-[#2a55a0] border-[#b8d0f8]" :
                  profile?.plan === "premium"   ? "bg-[#efe7ff] text-[#6a45d0] border-[#ddd0ff]" :
                  profile?.plan === "intensive" ? "bg-[#d7e6ff] text-[#2a55a0] border-[#b8d0f8]" :
                  "bg-[#f6f7fb] text-[#7b7b8d] border-[#ececf3]"
                }`}>
                  {planLabel} Plan
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-[20px] p-6 mb-5" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <h2 className="text-sm font-bold text-[#222225] mb-5">Personal information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#222225] mb-1.5">First name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={loading} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#222225] mb-1.5">Last name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} disabled={loading} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#222225] mb-1.5">Email address</label>
            <input type="email" value={email} disabled className={inputClass} />
            <p className="mt-1 text-xs text-[#a4a4b5]">Email address cannot be changed.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#222225] mb-1.5">IELTS track</label>
            <select value={track} onChange={e => setTrack(e.target.value)} className={inputClass + " cursor-pointer"}>
              <option value="academic">Academic</option>
              <option value="general">General Training</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#222225] mb-1.5">Target band score</label>
            <select value={targetBand} onChange={e => setTargetBand(e.target.value)} className={inputClass + " cursor-pointer"}>
              {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(s => (
                <option key={s} value={String(s)}>Band {s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="text-white text-sm font-bold px-6 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-[20px] p-6 mb-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <h2 className="text-sm font-bold text-[#222225] mb-5">Change password</h2>

        {pwSaved && (
          <div className="mb-4 bg-[#dff1e8] border border-[#c4e8d4] text-[#2a9350] text-sm font-bold px-4 py-3 rounded-[14px] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Password updated
          </div>
        )}
        {pwError && (
          <div className="mb-4 rounded-[14px] px-4 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
            {pwError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#222225] mb-1.5">Current password</label>
            <input type="password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#222225] mb-1.5">New password</label>
            <input type="password" placeholder="Min. 8 characters" value={newPw} onChange={e => setNewPw(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#222225] mb-1.5">Confirm new password</label>
            <input type="password" placeholder="Repeat new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handlePasswordChange}
            disabled={pwSaving}
            className="text-white text-sm font-bold px-6 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}
