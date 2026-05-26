"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Student {
  id: string;
  name: string;
  email: string;
  track: string;
  plan: string;
  tests: number;
  band: number | null;
  status: "Active" | "Suspended";
  joined: string;
}

const planStyle: Record<string, { bg: string; color: string }> = {
  Starter:   { bg: "#f6f7fb", color: "#7b7b8d" },
  Pro:       { bg: "#efe7ff", color: "#6a45d0" },
  Intensive: { bg: "#d7e6ff", color: "#2a55a0" },
};

function mapStudent(s: any): Student {
  return {
    id:     String(s.id),
    name:   s.full_name ?? "",
    email:  s.email ?? "",
    track:  s.track
              ? s.track.charAt(0).toUpperCase() + s.track.slice(1)
              : "Academic",
    plan:   s.plan
              ? s.plan.charAt(0).toUpperCase() + s.plan.slice(1)
              : "Starter",
    tests:  s.test_count ?? 0,
    band:   s.best_band != null ? Number(s.best_band) : null,
    status: s.email_verified === true ? "Active" : "Suspended",
    joined: s.created_at
              ? new Date(s.created_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : "",
  };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [planFilter, setPlanFilter]   = useState("All");

  async function loadStudents() {
    try {
      setLoading(true);
      setError(null);
      const raw = await api.get<any[]>("/api/admin/students");
      setStudents((raw ?? []).map(mapStudent));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudents(); }, []);

  async function handleToggleStatus(s: Student) {
    try {
      await api.patch(`/api/admin/students/${s.id}/status`, {
        suspended: s.status === "Active",
      });
      await loadStudents();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update status");
    }
  }

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchTrack = trackFilter === "All" || s.track === trackFilter;
    const matchPlan  = planFilter  === "All" || s.plan  === planFilter;
    return matchSearch && matchTrack && matchPlan;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Students</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">{students.length} total students</p>
        </div>
        <button className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[20px] p-4" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a4a4b5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-[12px] outline-none"
              style={{ border: "1px solid #ececf3", background: "#f6f7fb" }}
            />
          </div>
          <div className="flex gap-2">
            {["All", "Academic", "General"].map((t) => (
              <button key={t} onClick={() => setTrackFilter(t)}
                className="px-3 py-2 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
                style={trackFilter === t ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {["All", "Starter", "Pro", "Intensive"].map((p) => (
              <button key={p} onClick={() => setPlanFilter(p)}
                className="px-3 py-2 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
                style={planFilter === p ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f1f7", background: "#f6f7fb" }}>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-6 py-3">Student</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Track</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Plan</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Tests</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Best Band</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Status</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Joined</th>
              <th className="text-right text-xs font-bold text-[#7b7b8d] px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "#f1f1f7" }} />
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                        <div className="h-2.5 w-36 rounded animate-pulse" style={{ background: "#f6f7fb" }} />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 6 }).map((_, j) => (
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
              filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}
                      >
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#222225]">{s.name}</p>
                        <p className="text-xs text-[#7b7b8d]">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-[#7b7b8d]">{s.track}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: (planStyle[s.plan] ?? planStyle["Starter"]).bg, color: (planStyle[s.plan] ?? planStyle["Starter"]).color }}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#353741]">{s.tests}</td>
                  <td className="px-4 py-4 text-sm font-bold text-[#222225]">
                    {s.band != null && s.band > 0 ? s.band : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={s.status === "Active" ? { background: "#dff1e8", color: "#2a9350" } : { background: "#fff0f0", color: "#ff4d59" }}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{s.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/students/${s.id}`} className="text-xs font-bold cursor-pointer" style={{ color: "#9a72ff" }}>View</Link>
                      <span style={{ color: "#d0d0dc" }}>·</span>
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: s.status === "Active" ? "#ff4d59" : "#34ba65" }}
                      >
                        {s.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: "#a4a4b5" }}>No students found</div>
        )}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid #f1f1f7" }}>
          <p className="text-xs text-[#7b7b8d]">Showing {filtered.length} of {students.length} students</p>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button key={p} className="w-8 h-8 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
                style={p === 1 ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { color: "#7b7b8d" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
