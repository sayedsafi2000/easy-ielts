"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Submission {
  id: string;
  student: string;
  type: string;
  task: string;
  track: string;
  submitted: string;
  status: string;
  examiner: string | null;
  band: number | null;
}

function mapSub(s: any): Submission {
  const mod: string = (s.module ?? "writing");
  const type = mod === "speaking" ? "Speaking" : "Writing";

  let task = "Task 1 + Task 2";
  if (s.answers && typeof s.answers === "object") {
    const keys = Object.keys(s.answers);
    if (keys.length === 1) {
      task = keys[0] === "task1" ? "Task 1 only" : "Task 2 only";
    }
  }

  const dt = s.submitted_at ? new Date(s.submitted_at) : null;
  const now = new Date();
  const diffMs = dt ? now.getTime() - dt.getTime() : 0;
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffH / 24);
  let submitted = "just now";
  if (diffD > 0)      submitted = `${diffD}d ago`;
  else if (diffH > 0) submitted = `${diffH}h ago`;
  else                submitted = "just now";

  const prof = s.profiles ?? {};
  const att  = s.test_attempts ?? {};
  const track = (att.track ?? "academic");

  return {
    id:       String(s.id),
    student:  prof.full_name ?? s.student_name ?? "Unknown",
    type,
    task,
    track:    track.charAt(0).toUpperCase() + track.slice(1),
    submitted,
    status:   (s.status ?? "pending").charAt(0).toUpperCase() + (s.status ?? "pending").slice(1),
    examiner: s.reviewer_name ?? null,
    band:     s.band_score != null ? Number(s.band_score) : null,
  };
}

export default function SubmissionsPage() {
  const [subs, setSubs]     = useState<Submission[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [tab, setTab]       = useState<"All" | "Writing" | "Speaking">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Reviewed">("All");

  useEffect(() => {
    api.get<any[]>("/api/admin/submissions")
      .then(d => setSubs((d ?? []).map(mapSub)))
      .catch(e => setError(e?.message ?? "Failed to load submissions"))
      .finally(() => setLoad(false));
  }, []);

  const filtered = subs.filter(s => {
    const matchTab    = tab === "All" || s.type === tab;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchTab && matchStatus;
  });

  const pendingCount = subs.filter(s => s.status === "Pending").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Submissions</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">
            <span className="font-semibold" style={{ color: "#c89a00" }}>{loading ? "…" : pendingCount} pending</span> · {loading ? "…" : subs.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] px-4 py-2.5" style={{ background: "#fff2b3", border: "1px solid #ffe066" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#c89a00" }} />
          <span className="text-sm font-bold" style={{ color: "#7a6000" }}>{loading ? "…" : pendingCount} awaiting review</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: "#f6f7fb" }}>
          {(["All", "Writing", "Speaking"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 text-sm font-semibold rounded-[10px] cursor-pointer transition-all"
              style={tab === t ? { background: "white", color: "#222225", boxShadow: "0 2px 8px rgba(32,28,54,0.08)" } : { color: "#7b7b8d" }}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["All", "Pending", "Reviewed"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
              style={statusFilter === s
                ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" }
                : { background: "white", color: "#434552", border: "1px solid #dedee8" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[20px] overflow-x-auto" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <table className="w-full min-w-[900px]">
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f1f7", background: "#f6f7fb" }}>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-6 py-3">Student</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Type</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Task</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Track</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Submitted</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Examiner</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Band</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Status</th>
              <th className="text-right text-xs font-bold text-[#7b7b8d] px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "#f1f1f7" }} />
                      <div className="h-3 w-28 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                    </div>
                  </td>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3 w-16 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="h-3 w-12 rounded animate-pulse ml-auto" style={{ background: "#f1f1f7" }} />
                  </td>
                </tr>
              ))
            ) : (
              filtered.map((s, i) => (
                <tr key={s.id} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined, background: s.status === "Pending" ? "rgba(255,242,179,0.15)" : undefined }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}
                      >
                        {s.student.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <p className="text-sm font-semibold text-[#222225]">{s.student}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={s.type === "Writing" ? { background: "#efe7ff", color: "#6a45d0" } : { background: "#dff1e8", color: "#2a9350" }}>
                      {s.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{s.task}</td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{s.track}</td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{s.submitted}</td>
                  <td className="px-4 py-4 text-xs" style={{ color: s.examiner ? "#353741" : "#d0d0dc" }}>{s.examiner ?? "Unassigned"}</td>
                  <td className="px-4 py-4">
                    {s.band ? <span className="text-sm font-bold text-[#222225]">{s.band}</span> : <span className="text-xs" style={{ color: "#d0d0dc" }}>—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={s.status === "Pending" ? { background: "#fff2b3", color: "#7a6000" } : { background: "#dff1e8", color: "#2a9350" }}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/submissions/${s.id}`}
                      className="text-xs font-bold cursor-pointer"
                      style={{ color: s.status === "Pending" ? "#9a72ff" : "#7b7b8d" }}
                    >
                      {s.status === "Pending" ? "Review →" : "View →"}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: "#a4a4b5" }}>No submissions found</div>
        )}
      </div>
    </div>
  );
}
