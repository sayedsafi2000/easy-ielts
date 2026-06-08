"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Booking {
  id: string;
  student_name: string;
  student_email: string;
  examiner_id: string | null;
  examiner_name: string | null;
  scheduled_at: string | null;
  proposed_at: string | null;
  provider: string | null;
  join_url: string | null;
  status: string;
  track: string;
  band: number | null;
  recording_status: string | null;
  recording_url: string | null;
  transcript_url: string | null;
}

interface Examiner { id: string; full_name: string }

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  requested:     { label: "Requested",     bg: "#fff2b3", color: "#7a6000" },
  assigned:      { label: "Assigned",      bg: "#e8f0ff", color: "#2a55a0" },
  time_proposed: { label: "Time proposed", bg: "#efe7ff", color: "#6a45d0" },
  scheduled:     { label: "Scheduled",     bg: "#dff1e8", color: "#2a9350" },
  completed:     { label: "Completed",     bg: "#efe7ff", color: "#6a45d0" },
  cancelled:     { label: "Cancelled",     bg: "#fff0f0", color: "#ff4d59" },
  declined:      { label: "Declined",      bg: "#fff0f0", color: "#ff4d59" },
};

const FILTERS = ["All", "Requested", "Assigned", "Time proposed", "Scheduled", "Completed", "Cancelled"];

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function BookingsPage() {
  const { user } = useAuth();
  const isExaminer = user?.role === "examiner";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  // per-row assign selection
  const [assignSel, setAssignSel] = useState<Record<string, string>>({});

  // propose-time modal
  const [proposeTarget, setProposeTarget] = useState<Booking | null>(null);
  const [proposeWhen, setProposeWhen] = useState("");
  const [proposeErr, setProposeErr] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [bk, ex] = await Promise.all([
        api.get<Booking[]>("/api/admin/bookings"),
        api.get<Examiner[]>("/api/admin/examiners").catch(() => []),
      ]);
      setBookings(bk ?? []);
      setExaminers((ex ?? []).map((e: any) => ({ id: String(e.id), full_name: e.full_name })));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    try { await fn(); await load(); }
    catch (e: any) { alert(e?.message ?? "Action failed"); }
    finally { setBusyId(null); }
  }

  const assign = (b: Booking) => {
    const examiner_id = assignSel[b.id];
    if (!examiner_id) { alert("Pick an examiner first."); return; }
    return run(b.id, () => api.post(`/api/admin/bookings/${b.id}/assign`, { examiner_id }));
  };
  const cancel = (b: Booking) => run(b.id, () => api.patch(`/api/admin/bookings/${b.id}`, { status: "cancelled" }));
  const accept = (b: Booking) => run(b.id, () => api.post(`/api/examiner/bookings/${b.id}/accept`));

  async function submitPropose() {
    if (!proposeTarget || !proposeWhen) return;
    setProposeErr("");
    try {
      await api.post(`/api/examiner/bookings/${proposeTarget.id}/propose-time`, {
        proposed_at: new Date(proposeWhen).toISOString(),
      });
      setProposeTarget(null);
      await load();
    } catch (e: any) {
      setProposeErr(e?.message ?? "Failed to propose time");
    }
  }

  const filtered = bookings.filter(
    (b) => statusFilter === "All" || (STATUS[b.status]?.label ?? b.status) === statusFilter
  );
  const mineActionable = bookings.filter(
    (b) => isExaminer && b.examiner_id === user?.id && (b.status === "assigned" || b.status === "scheduled")
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Speaking Bookings</h1>
          <p className="text-xs sm:text-sm text-[#7b7b8d] mt-0.5">
            {isExaminer ? `${mineActionable} sessions need your attention` : `${bookings.length} total bookings`}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
            style={statusFilter === s
              ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" }
              : { background: "white", color: "#434552", border: "1px solid #dedee8" }}>
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {error}
        </div>
      )}

      <div className="bg-white rounded-[20px] overflow-x-auto" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <table className="w-full min-w-[920px]">
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f1f7", background: "#f6f7fb" }}>
              {["Student", "Date & Time", "Examiner", "Platform", "Band", "Status", "Actions"].map((h, i) => (
                <th key={h} className={`text-xs font-bold text-[#7b7b8d] px-4 py-3 ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td colSpan={7} className="px-4 py-5"><div className="h-4 rounded animate-pulse" style={{ background: "#f1f1f7" }} /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-sm" style={{ color: "#a4a4b5" }}>No bookings found</td></tr>
            ) : (
              filtered.map((b, i) => {
                const st = STATUS[b.status] ?? { label: b.status, bg: "#f6f7fb", color: "#7b7b8d" };
                const showTime = b.status === "time_proposed" && b.proposed_at ? b.proposed_at : b.scheduled_at;
                const ownedByMe = isExaminer && b.examiner_id === user?.id;
                return (
                  <tr key={b.id} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-[#222225]">{b.student_name}</p>
                      <p className="text-xs text-[#7b7b8d]">{b.student_email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-[#222225]">{fmt(showTime)}</p>
                      {b.status === "time_proposed" && <p className="text-xs" style={{ color: "#6a45d0" }}>proposed</p>}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#353741]">{b.examiner_name ?? "—"}</td>
                    <td className="px-4 py-4 text-xs text-[#7b7b8d]">{b.provider === "zoom" ? "Zoom" : b.provider === "google" ? "Meet" : "—"}</td>
                    <td className="px-4 py-4">
                      {b.band != null
                        ? <span className="text-sm font-bold text-[#222225]">{b.band}</span>
                        : <span className="text-xs" style={{ color: "#d0d0dc" }}>—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      {b.recording_status === "available" && b.recording_url && (
                        <a href={b.recording_url} target="_blank" rel="noreferrer" className="block text-[11px] font-semibold mt-1 cursor-pointer" style={{ color: "#9a72ff" }}>recording ↗</a>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Admin: assign / reassign */}
                        {!isExaminer && (b.status === "requested" || b.status === "declined") && (
                          <>
                            <select
                              value={assignSel[b.id] ?? ""}
                              onChange={(e) => setAssignSel((s) => ({ ...s, [b.id]: e.target.value }))}
                              className="text-xs rounded-[8px] px-2 py-1 cursor-pointer" style={{ border: "1px solid #dedee8" }}>
                              <option value="">Examiner…</option>
                              {examiners.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                            </select>
                            <button disabled={busyId === b.id} onClick={() => assign(b)}
                              className="text-xs font-bold cursor-pointer disabled:opacity-50" style={{ color: "#34ba65" }}>
                              Assign
                            </button>
                          </>
                        )}
                        {/* Examiner: accept / propose for own assigned sessions */}
                        {ownedByMe && b.status === "assigned" && (
                          <>
                            <button disabled={busyId === b.id} onClick={() => accept(b)}
                              className="text-xs font-bold cursor-pointer disabled:opacity-50" style={{ color: "#34ba65" }}>
                              Accept
                            </button>
                            <span style={{ color: "#d0d0dc" }}>·</span>
                            <button onClick={() => { setProposeTarget(b); setProposeWhen(""); setProposeErr(""); }}
                              className="text-xs font-bold cursor-pointer" style={{ color: "#6a45d0" }}>
                              Propose time
                            </button>
                          </>
                        )}
                        {/* Examiner: mark scheduled own session */}
                        {ownedByMe && b.status === "scheduled" && (
                          <Link href={`/admin/bookings/${b.id}/mark`} className="text-xs font-bold cursor-pointer" style={{ color: "#9a72ff" }}>
                            Give marks
                          </Link>
                        )}
                        {/* Examiner: attach recording/transcript after completion */}
                        {ownedByMe && b.status === "completed" && (
                          <Link href={`/admin/bookings/${b.id}/mark`} className="text-xs font-bold cursor-pointer" style={{ color: "#9a72ff" }}>
                            Add media
                          </Link>
                        )}
                        {b.status === "time_proposed" && (
                          <span className="text-xs" style={{ color: "#a4a4b5" }}>Awaiting student</span>
                        )}
                        {b.status === "scheduled" && b.join_url && (
                          <a href={b.join_url} target="_blank" rel="noreferrer" className="text-xs font-bold cursor-pointer" style={{ color: "#2a55a0" }}>Join</a>
                        )}
                        {b.status === "completed" && (
                          <Link href="/admin/results" className="text-xs font-bold cursor-pointer" style={{ color: "#9a72ff" }}>Result</Link>
                        )}
                        {/* Admin: cancel */}
                        {!isExaminer && ["requested", "assigned", "time_proposed", "scheduled"].includes(b.status) && (
                          <>
                            <span style={{ color: "#d0d0dc" }}>·</span>
                            <button disabled={busyId === b.id} onClick={() => cancel(b)}
                              className="text-xs font-bold cursor-pointer disabled:opacity-50" style={{ color: "#ff4d59" }}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Propose-time modal */}
      {proposeTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm" style={{ boxShadow: "0 32px 64px rgba(32,28,54,0.18)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f1f7" }}>
              <h2 className="text-sm font-bold text-[#222225]">Propose a new time</h2>
              <button onClick={() => setProposeTarget(null)} className="text-[#a4a4b5] hover:text-[#7b7b8d] cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-[14px] p-4" style={{ background: "#f6f7fb", border: "1px solid #ececf3" }}>
                <p className="text-xs font-bold text-[#353741]">{proposeTarget.student_name}</p>
                <p className="text-xs text-[#7b7b8d]">Requested: {fmt(proposeTarget.scheduled_at)}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">New date &amp; time</label>
                <input type="datetime-local" value={proposeWhen} onChange={(e) => setProposeWhen(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 text-sm rounded-[12px] outline-none cursor-pointer"
                  style={{ border: "1px solid #ececf3", background: "#fafafe", color: "#222225" }} />
              </div>
              {proposeErr && (
                <div className="rounded-[12px] px-4 py-3 text-xs font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>{proposeErr}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setProposeTarget(null)} className="flex-1 text-sm font-bold py-2.5 rounded-[14px] cursor-pointer" style={{ border: "1px solid #dedee8", color: "#353741" }}>Cancel</button>
                <button onClick={submitPropose} disabled={!proposeWhen}
                  className="flex-1 text-white text-sm font-bold py-2.5 rounded-[14px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
                  Propose time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
