"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Booking {
  id: string;
  student: string;
  email: string;
  examiner: string;
  date: string;
  time: string;
  track: string;
  duration: string;
  status: string;
  band?: number | null;
  scheduled_at_raw?: string;  // original ISO string for reschedule
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  Confirmed: { bg: "#dff1e8", color: "#2a9350" },
  Pending:   { bg: "#fff2b3", color: "#7a6000" },
  Completed: { bg: "#efe7ff", color: "#6a45d0" },
  Cancelled: { bg: "#fff0f0", color: "#ff4d59" },
};

const days = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"];
const slots = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];
const bookedSlots: Record<string, string> = {
  "May 15_10:00 AM": "Fatima Al-Hassan",
  "May 15_11:30 AM": "Marco Rossi",
  "May 15_2:00 PM":  "Yu Jin Park",
  "May 16_9:00 AM":  "Aisha Rahman",
  "May 16_11:00 AM": "Carlos Mendez",
  "May 13_3:00 PM":  "Li Wei",
};

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapBooking(b: any): Booking {
  const dt = b.scheduled_at ? new Date(b.scheduled_at) : null;
  const date = dt
    ? dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
  const time = dt
    ? dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : "";
  const rawStatus = b.status ? capitalize(b.status) : "Pending";
  return {
    id:       String(b.id),
    student:  b.student_name  ?? "",
    email:    b.student_email ?? "",
    examiner: b.examiner_name ?? "—",
    date,
    time,
    track:    b.track ? capitalize(b.track) : "Academic",
    duration: "15 min",
    status:   rawStatus,
    band:     b.band != null ? Number(b.band) : null,
    scheduled_at_raw: b.scheduled_at ?? "",
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [view, setView]         = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState("All");

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [newDateTime, setNewDateTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  async function loadBookings() {
    try {
      setLoading(true);
      setError(null);
      const raw = await api.get<any[]>("/api/admin/bookings");
      setBookings((raw ?? []).map(mapBooking));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBookings(); }, []);

  async function handleConfirm(id: string) {
    try {
      await api.patch(`/api/admin/bookings/${id}`, { status: "confirmed" });
      await loadBookings();
    } catch (e: any) {
      alert(e?.message ?? "Failed to confirm booking");
    }
  }

  async function handleCancel(id: string) {
    try {
      await api.patch(`/api/admin/bookings/${id}`, { status: "cancelled" });
      await loadBookings();
    } catch (e: any) {
      alert(e?.message ?? "Failed to cancel booking");
    }
  }

  function openReschedule(b: Booking) {
    // Pre-fill with existing scheduled time in local datetime-local format
    const existing = b.scheduled_at_raw
      ? new Date(b.scheduled_at_raw).toISOString().slice(0, 16)
      : "";
    setNewDateTime(existing);
    setRescheduleError("");
    setRescheduleTarget(b);
  }

  async function handleReschedule() {
    if (!rescheduleTarget || !newDateTime) return;
    setRescheduling(true);
    setRescheduleError("");
    try {
      // Send the new scheduled_at as ISO string
      const iso = new Date(newDateTime).toISOString();
      await api.patch(`/api/admin/bookings/${rescheduleTarget.id}`, {
        scheduled_at: iso,
        status: "confirmed",   // keep/restore confirmed status
      });
      setRescheduleTarget(null);
      await loadBookings();
    } catch (e: any) {
      setRescheduleError(e?.message ?? "Failed to reschedule booking");
    } finally {
      setRescheduling(false);
    }
  }

  const filtered = bookings.filter(
    (b) => statusFilter === "All" || b.status === statusFilter
  );
  const upcomingCount = bookings.filter(
    (b) => b.status === "Confirmed" || b.status === "Pending"
  ).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Speaking Bookings</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">{upcomingCount} upcoming sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-[14px]" style={{ background: "#f6f7fb" }}>
            {(["list", "calendar"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer capitalize transition-all"
                style={view === v ? { background: "white", color: "#222225", boxShadow: "0 2px 8px rgba(32,28,54,0.08)" } : { color: "#7b7b8d" }}>
                {v}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
            style={statusFilter === s
              ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" }
              : { background: "white", color: "#434552", border: "1px solid #dedee8" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {error}
        </div>
      )}

      {view === "list" ? (
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f1f7", background: "#f6f7fb" }}>
                <th className="text-left text-xs font-bold text-[#7b7b8d] px-6 py-3">Student</th>
                <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Date &amp; Time</th>
                <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Examiner</th>
                <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Track</th>
                <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Band</th>
                <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Status</th>
                <th className="text-right text-xs font-bold text-[#7b7b8d] px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "#f1f1f7" }} />
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                          <div className="h-2.5 w-20 rounded animate-pulse" style={{ background: "#f6f7fb" }} />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 w-16 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <div className="h-3 w-16 rounded animate-pulse ml-auto" style={{ background: "#f1f1f7" }} />
                    </td>
                  </tr>
                ))
              ) : (
                filtered.map((b, i) => (
                  <tr key={b.id} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}
                        >
                          {b.student.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#222225]">{b.student}</p>
                          <p className="text-xs text-[#7b7b8d]">{b.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-[#222225]">{b.date}</p>
                      <p className="text-xs text-[#7b7b8d]">{b.time} · {b.duration}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#353741]">{b.examiner}</td>
                    <td className="px-4 py-4 text-xs text-[#7b7b8d]">{b.track}</td>
                    <td className="px-4 py-4">
                      {b.band != null && b.band > 0
                        ? <span className="text-sm font-bold text-[#222225]">{b.band}</span>
                        : <span className="text-xs" style={{ color: "#d0d0dc" }}>—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={statusStyle[b.status] ?? { bg: "#f6f7fb", color: "#7b7b8d" }}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === "Pending" && (
                          <button
                            onClick={() => handleConfirm(b.id)}
                            className="text-xs font-bold cursor-pointer" style={{ color: "#34ba65" }}>
                            Confirm
                          </button>
                        )}
                        {(b.status === "Confirmed" || b.status === "Pending") && (
                          <>
                            <span style={{ color: "#d0d0dc" }}>·</span>
                            <button
                              onClick={() => openReschedule(b)}
                              className="text-xs font-bold cursor-pointer" style={{ color: "#7b7b8d" }}>
                              Reschedule
                            </button>
                            <span style={{ color: "#d0d0dc" }}>·</span>
                            <button
                              onClick={() => handleCancel(b.id)}
                              className="text-xs font-bold cursor-pointer" style={{ color: "#ff4d59" }}>
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === "Completed" && (
                          <button className="text-xs font-bold cursor-pointer" style={{ color: "#9a72ff" }}>View Result</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-sm" style={{ color: "#a4a4b5" }}>No bookings found</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div className="grid grid-cols-8" style={{ borderBottom: "1px solid #f1f1f7" }}>
            <div className="p-3 text-xs font-medium" style={{ background: "#f6f7fb", color: "#a4a4b5" }} />
            {days.map((d) => (
              <div key={d} className="p-3 text-center" style={{ background: d === "May 16" ? "#efe7ff" : "#f6f7fb", borderLeft: "1px solid #f1f1f7" }}>
                <p className="text-xs font-bold text-[#222225]">{d.split(" ")[1]}</p>
                <p className="text-xs text-[#a4a4b5]">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][days.indexOf(d)]}</p>
              </div>
            ))}
          </div>
          <div>
            {slots.map((slot, si) => (
              <div key={slot} className="grid grid-cols-8" style={{ borderTop: si > 0 ? "1px solid #f6f7fb" : undefined }}>
                <div className="p-2 text-xs text-right pr-3 flex items-center justify-end" style={{ background: "#f6f7fb", color: "#a4a4b5" }}>{slot}</div>
                {days.map((day) => {
                  const key = `${day}_${slot}`;
                  const student = bookedSlots[key];
                  return (
                    <div key={day} className="p-1 min-h-[40px]" style={{ borderLeft: "1px solid #f1f1f7", background: day === "May 16" ? "rgba(239,231,255,0.2)" : undefined }}>
                      {student && (
                        <div className="text-white text-xs font-semibold rounded-[10px] px-2 py-1 leading-tight cursor-pointer transition-opacity hover:opacity-80"
                          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
                          {student.split(" ")[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ──────────────────────────────────────── */}
      {rescheduleTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-sm" style={{ boxShadow: "0 32px 64px rgba(32,28,54,0.18)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f1f7" }}>
              <h2 className="text-sm font-bold text-[#222225]">Reschedule Booking</h2>
              <button onClick={() => setRescheduleTarget(null)} className="text-[#a4a4b5] hover:text-[#7b7b8d] cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-[14px] p-4" style={{ background: "#f6f7fb", border: "1px solid #ececf3" }}>
                <p className="text-xs font-bold text-[#353741] mb-1">{rescheduleTarget.student}</p>
                <p className="text-xs text-[#7b7b8d]">Current: {rescheduleTarget.date} at {rescheduleTarget.time}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#353741] mb-1.5">New Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={e => setNewDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 text-sm rounded-[12px] outline-none cursor-pointer"
                  style={{ border: "1px solid #ececf3", background: "#fafafe", color: "#222225" }}
                />
              </div>
              {rescheduleError && (
                <div className="rounded-[12px] px-4 py-3 text-xs font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
                  {rescheduleError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setRescheduleTarget(null)} className="flex-1 text-sm font-bold py-2.5 rounded-[14px] cursor-pointer" style={{ border: "1px solid #dedee8", color: "#353741" }}>
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!newDateTime || rescheduling}
                  className="flex-1 text-white text-sm font-bold py-2.5 rounded-[14px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
                >
                  {rescheduling ? "Saving…" : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
