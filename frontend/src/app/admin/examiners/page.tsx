"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Examiner {
  id: string;
  name: string;
  email: string;
  speciality: string;
  sessions: number;
  avgBand: number | null;
  status: string;
  joined: string;
  upcomingToday: number;
  pendingReviews: number;
}

interface ScheduleRow {
  time: string;
  student: string;
  examiner: string;
  status: string;
}

function mapExaminer(e: any): Examiner {
  const spec: string[] = Array.isArray(e.specialization)
    ? e.specialization
    : e.specialization ? [String(e.specialization)] : [];
  return {
    id:             String(e.id),
    name:           e.full_name ?? "",
    email:          e.email     ?? "",
    speciality:     spec.length > 0 ? spec.join(" & ") : "Writing & Speaking",
    sessions:       e.total_sessions  ?? 0,
    avgBand:        e.rating != null  ? Number(e.rating) : null,
    status:         "Active",
    joined:         e.created_at ? new Date(e.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "",
    upcomingToday:  e.upcoming_today  ?? 0,
    pendingReviews: e.pending_reviews ?? 0,
  };
}

export default function ExaminersPage() {
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleRow[]>([]);

  // Modal form
  const [mFirstName,  setMFirstName]  = useState("");
  const [mLastName,   setMLastName]   = useState("");
  const [mEmail,      setMEmail]      = useState("");
  const [mSpeciality, setMSpeciality] = useState("Writing & Speaking");
  const [mTrack,      setMTrack]      = useState("Academic & General");
  const [mSaving,     setMSaving]     = useState(false);
  const [mError,      setMError]      = useState("");
  const [mSuccess,    setMSuccess]    = useState("");

  async function loadExaminers() {
    try {
      setLoading(true);
      setError(null);
      const raw = await api.get<any[]>("/api/admin/examiners");
      setExaminers((raw ?? []).map(mapExaminer));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load examiners");
    } finally {
      setLoading(false);
    }
  }

  // Load today's bookings for the schedule widget
  async function loadTodaySchedule() {
    try {
      const raw = await api.get<any[]>("/api/admin/bookings");
      const today = new Date();
      const todayStr = today.toDateString();
      const rows = (raw ?? [])
        .filter((b: any) => {
          if (!b.scheduled_at) return false;
          const d = new Date(b.scheduled_at);
          return d.toDateString() === todayStr && (b.status === "confirmed" || b.status === "pending");
        })
        .slice(0, 4)
        .map((b: any) => ({
          time:     new Date(b.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
          student:  b.student_name ?? "—",
          examiner: b.examiner_name ?? "Unassigned",
          status:   (b.status ?? "").charAt(0).toUpperCase() + (b.status ?? "").slice(1),
        }));
      setTodaySchedule(rows);
    } catch { /* non-critical */ }
  }

  useEffect(() => {
    loadExaminers();
    loadTodaySchedule();
  }, []);

  function openModal() {
    setMFirstName(""); setMLastName(""); setMEmail("");
    setMSpeciality("Writing & Speaking"); setMTrack("Academic & General");
    setMError(""); setMSuccess(""); setMSaving(false);
    setShowModal(true);
  }

  async function handleCreateExaminer() {
    if (!mEmail) { setMError("Email is required."); return; }
    setMError(""); setMSaving(true);
    try {
      const res = await api.post<{ message: string; data: { tempPassword: string } }>(
        "/api/admin/examiners",
        { first_name: mFirstName, last_name: mLastName, email: mEmail, speciality: mSpeciality, track: mTrack }
      );
      setMSuccess(`✅ Examiner created!\nTemp password: ${res.data?.tempPassword ?? "sent via email"}`);
      await loadExaminers();
    } catch (e: any) {
      setMError(e?.message ?? "Failed to create examiner.");
    } finally {
      setMSaving(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Examiners</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">{examiners.length} active examiners</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Examiner
        </button>
      </div>

      {/* Today's schedule — real data */}
      <div className="rounded-[20px] p-5" style={{ background: "#efe7ff", border: "1px solid #ddd0ff" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#222225]">Today&apos;s Speaking Schedule</h2>
          <Link href="/admin/bookings" className="text-xs font-semibold cursor-pointer" style={{ color: "#6a45d0" }}>View all bookings →</Link>
        </div>
        {todaySchedule.length === 0 ? (
          <p className="text-xs text-[#7b7b8d] py-2">No sessions scheduled for today.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {todaySchedule.map((s, i) => (
              <div key={i} className="bg-white rounded-[16px] p-4 flex items-center gap-3" style={{ border: "1px solid #f1f1f7" }}>
                <div className="flex-shrink-0">
                  <p className="text-xs font-bold text-[#222225]">{s.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#222225] truncate">{s.student}</p>
                  <p className="text-xs text-[#7b7b8d] truncate">{s.examiner}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={s.status === "Confirmed" ? { background: "#dff1e8", color: "#2a9350" } : { background: "#fff2b3", color: "#7a6000" }}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {error}
        </div>
      )}

      {/* Examiner cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[20px] p-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-[16px] animate-pulse flex-shrink-0" style={{ background: "#f1f1f7" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                  <div className="h-2.5 w-48 rounded animate-pulse" style={{ background: "#f6f7fb" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : examiners.length === 0 ? (
        <div className="bg-white rounded-[20px] p-12 text-center" style={{ border: "1px solid #f1f1f7" }}>
          <p className="text-sm text-[#7b7b8d]">No examiners found. Add one with the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {examiners.map((e) => (
            <div key={e.id} className="bg-white rounded-[20px] p-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-[16px] flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}
                >
                  {e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#222225]">{e.name}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "#dff1e8", color: "#2a9350" }}>
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#7b7b8d] mt-0.5">{e.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#efe7ff", color: "#6a45d0" }}>{e.speciality}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#f6f7fb", color: "#7b7b8d" }}>Joined {e.joined}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mt-5 pt-4" style={{ borderTop: "1px solid #f1f1f7" }}>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#222225]">{e.sessions}</p>
                  <p className="text-xs text-[#a4a4b5]">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#222225]">{e.avgBand ?? "—"}</p>
                  <p className="text-xs text-[#a4a4b5]">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#c89a00" }}>{e.pendingReviews}</p>
                  <p className="text-xs text-[#a4a4b5]">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#9a72ff" }}>{e.upcomingToday}</p>
                  <p className="text-xs text-[#a4a4b5]">Today</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Link
                  href="/admin/bookings"
                  className="flex-1 text-xs font-bold py-2 rounded-[12px] cursor-pointer transition-colors text-center"
                  style={{ border: "1px solid #dedee8", color: "#353741" }}
                >
                  View Bookings
                </Link>
                <Link
                  href={`/admin/submissions?examiner=${encodeURIComponent(e.name)}`}
                  className="flex-1 text-xs font-bold py-2 rounded-[12px] cursor-pointer transition-colors text-center"
                  style={{ border: "1px solid #dedee8", color: "#353741" }}
                >
                  View Queue
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add examiner modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md" style={{ boxShadow: "0 32px 64px rgba(32,28,54,0.18)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f1f7" }}>
              <h2 className="text-sm font-bold text-[#222225]">Add New Examiner</h2>
              <button onClick={() => setShowModal(false)} className="text-[#a4a4b5] hover:text-[#7b7b8d] cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {mSuccess && (
                <div className="rounded-[12px] px-4 py-3 text-xs font-medium whitespace-pre-wrap" style={{ background: "#dff1e8", color: "#2a9350", border: "1px solid #b6e4c8" }}>
                  {mSuccess}
                </div>
              )}
              {mError && (
                <div className="rounded-[12px] px-4 py-3 text-xs font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
                  {mError}
                </div>
              )}
              {!mSuccess && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#353741] mb-1.5">First Name</label>
                      <input type="text" value={mFirstName} onChange={e => setMFirstName(e.target.value)} placeholder="Sarah"
                        className="w-full px-3 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#353741] mb-1.5">Last Name</label>
                      <input type="text" value={mLastName} onChange={e => setMLastName(e.target.value)} placeholder="Mills"
                        className="w-full px-3 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#353741] mb-1.5">Email Address <span className="text-[#ff4d59]">*</span></label>
                    <input type="email" value={mEmail} onChange={e => setMEmail(e.target.value)} placeholder="examiner@example.com"
                      className="w-full px-3 py-2.5 text-sm rounded-[12px] outline-none" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#353741] mb-1.5">Speciality</label>
                    <select value={mSpeciality} onChange={e => setMSpeciality(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-[12px] outline-none cursor-pointer" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }}>
                      <option>Writing &amp; Speaking</option>
                      <option>Writing only</option>
                      <option>Speaking only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#353741] mb-1.5">Track</label>
                    <select value={mTrack} onChange={e => setMTrack(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-[12px] outline-none cursor-pointer" style={{ border: "1px solid #ececf3", background: "#f6f7fb" }}>
                      <option>Academic &amp; General</option>
                      <option>Academic only</option>
                      <option>General Training only</option>
                    </select>
                  </div>
                  <p className="text-xs text-[#a4a4b5]">A temporary password will be generated. Share it securely with the examiner.</p>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowModal(false)} className="flex-1 text-sm font-bold py-2.5 rounded-[14px] cursor-pointer" style={{ border: "1px solid #dedee8", color: "#353741" }}>Cancel</button>
                    <button onClick={handleCreateExaminer} disabled={mSaving}
                      className="flex-1 text-white text-sm font-bold py-2.5 rounded-[14px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
                      {mSaving ? "Creating…" : "Create Examiner"}
                    </button>
                  </div>
                </>
              )}
              {mSuccess && (
                <button onClick={() => setShowModal(false)}
                  className="w-full text-white text-sm font-bold py-2.5 rounded-[14px] cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
