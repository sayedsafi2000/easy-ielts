"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Result {
  id: string;
  attempt_id: string;
  student_id: string;
  student: string;
  email: string;
  track: string;
  type: string;
  date: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
  examiner: string;
  module: string;
}

const bandStyle = (b: number): { bg: string; color: string } => {
  if (b >= 8) return { bg: "#dff1e8", color: "#2a9350" };
  if (b >= 7) return { bg: "#efe7ff", color: "#6a45d0" };
  if (b >= 6) return { bg: "#fff2b3", color: "#7a6000" };
  return { bg: "#fff0f0", color: "#ff4d59" };
};

function formatType(format: string): string {
  if (!format) return "Full Mock";
  const f = format.toLowerCase();
  if (f === "full") return "Full Mock";
  if (f === "single") return "Single Module";
  return format.charAt(0).toUpperCase() + format.slice(1);
}

function mapResult(r: any): Result {
  const module: string = r.module ?? "";
  const band = r.band_score != null ? Number(r.band_score) : 0;
  return {
    id:         String(r.id),
    attempt_id: String(r.attempt_id ?? ""),
    student_id: String(r.student_id ?? ""),
    student:    r.student_name  ?? "",
    email:      r.student_email ?? "",
    track:      r.track ? r.track.charAt(0).toUpperCase() + r.track.slice(1) : "Academic",
    type:       formatType(r.format ?? "full"),
    date:       r.published_at
                  ? new Date(r.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "",
    listening: module === "listening" ? band : 0,
    reading:   module === "reading"   ? band : 0,
    writing:   module === "writing"   ? band : 0,
    speaking:  module === "speaking"  ? band : 0,
    overall:   band,
    examiner:  r.reviewer_name ?? "—",
    module,
  };
}

/**
 * Group individual module results by attempt_id so a full mock test
 * (which generates 4 result rows) shows as a single table row with all
 * four module bands filled.
 */
function groupByAttempt(rows: Result[]): Result[] {
  const map = new Map<string, Result>();
  for (const r of rows) {
    const key = r.attempt_id || r.id;
    if (!map.has(key)) {
      map.set(key, { ...r });
    } else {
      const existing = map.get(key)!;
      // Merge module bands
      if (r.listening > 0) existing.listening = r.listening;
      if (r.reading   > 0) existing.reading   = r.reading;
      if (r.writing   > 0) existing.writing   = r.writing;
      if (r.speaking  > 0) existing.speaking  = r.speaking;
      // Overall = average of non-zero bands
      const bands = [existing.listening, existing.reading, existing.writing, existing.speaking].filter(b => b > 0);
      existing.overall = bands.length
        ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 2) / 2
        : 0;
      // Use "Full Mock" type if multiple modules
      const moduleCount = [existing.listening, existing.reading, existing.writing, existing.speaking].filter(b => b > 0).length;
      if (moduleCount > 1) existing.type = "Full Mock";
    }
  }
  return Array.from(map.values());
}

const summaryCards = [
  { label: "Band 8+",    filter: (r: Result) => r.overall >= 8,                          bg: "#dff1e8", color: "#2a9350" },
  { label: "Band 7–7.5", filter: (r: Result) => r.overall >= 7 && r.overall < 8,         bg: "#efe7ff", color: "#6a45d0" },
  { label: "Band 6–6.5", filter: (r: Result) => r.overall >= 6 && r.overall < 7,         bg: "#fff2b3", color: "#7a6000" },
  { label: "Below 6",    filter: (r: Result) => r.overall > 0  && r.overall < 6,         bg: "#fff0f0", color: "#ff4d59" },
];

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState("All");
  const [typeFilter, setTypeFilter]   = useState("All");
  const [bandFilter, setBandFilter]   = useState("All");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const raw = await api.get<any[]>("/api/admin/results");
        setResults(groupByAttempt((raw ?? []).map(mapResult)));
      } catch (e: any) {
        setError(e?.message ?? "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = results.filter((r) => {
    const matchTrack = trackFilter === "All" || r.track === trackFilter;
    const matchType  = typeFilter  === "All" || r.type  === typeFilter;
    const matchBand  =
      bandFilter === "All"
      || (bandFilter === "8+"    && r.overall >= 8)
      || (bandFilter === "7–7.5" && r.overall >= 7 && r.overall < 8)
      || (bandFilter === "6–6.5" && r.overall >= 6 && r.overall < 7)
      || (bandFilter === "<6"    && r.overall > 0  && r.overall < 6);
    return matchTrack && matchType && matchBand;
  });

  const withOverall = results.filter((r) => r.overall > 0);
  const avgOverall  =
    withOverall.length > 0
      ? withOverall.reduce((a, b) => a + b.overall, 0) / withOverall.length
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Results</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">
            {results.length} completed tests · Avg band {avgOverall > 0 ? avgOverall.toFixed(1) : "—"}
          </p>
        </div>
        <button className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-[20px] p-5" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
              <span className="text-lg font-bold" style={{ color: c.color }}>{results.filter(c.filter).length}</span>
            </div>
            <p className="text-2xl font-bold text-[#222225]">{results.filter(c.filter).length}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: c.color }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[20px] p-4 flex flex-wrap gap-3" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <div className="flex gap-2">
          {["All", "Academic", "General"].map((t) => (
            <button key={t} onClick={() => setTrackFilter(t)}
              className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
              style={trackFilter === t ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All", "Full Mock", "Single Module"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
              style={typeFilter === t ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All", "8+", "7–7.5", "6–6.5", "<6"].map((b) => (
            <button key={b} onClick={() => setBandFilter(b)}
              className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
              style={bandFilter === b ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
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
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-6 py-3">Test ID</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Student</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Date</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">L</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">R</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">W</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">S</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Overall</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Examiner</th>
              <th className="text-right text-xs font-bold text-[#7b7b8d] px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td className="px-6 py-4">
                    <div className="h-3 w-16 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full animate-pulse" style={{ background: "#f1f1f7" }} />
                      <div className="space-y-1.5">
                        <div className="h-3 w-24 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                        <div className="h-2.5 w-16 rounded animate-pulse" style={{ background: "#f6f7fb" }} />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3 w-10 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="h-3 w-12 rounded animate-pulse ml-auto" style={{ background: "#f1f1f7" }} />
                  </td>
                </tr>
              ))
            ) : (
              filtered.map((r, i) => (
                <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td className="px-6 py-4 text-xs font-mono text-[#7b7b8d]">{r.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}
                      >
                        {r.student.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#222225]">{r.student}</p>
                        <p className="text-xs text-[#a4a4b5]">{r.track}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{r.date}</td>
                  <td className="px-4 py-4 text-sm text-[#353741]">{r.listening || "—"}</td>
                  <td className="px-4 py-4 text-sm text-[#353741]">{r.reading   || "—"}</td>
                  <td className="px-4 py-4 text-sm text-[#353741]">{r.writing   || "—"}</td>
                  <td className="px-4 py-4 text-sm text-[#353741]">{r.speaking  || "—"}</td>
                  <td className="px-4 py-4">
                    {r.overall > 0 ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={bandStyle(r.overall)}>{r.overall}</span>
                    ) : (
                      <span className="text-xs" style={{ color: "#d0d0dc" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{r.examiner}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/results?attemptId=${r.attempt_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: "#9a72ff" }}
                      >View</a>
                      <span style={{ color: "#d0d0dc" }}>·</span>
                      <button
                        onClick={() => window.open(`/results?attemptId=${r.attempt_id}`, '_blank')}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: "#7b7b8d" }}
                      >PDF</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: "#a4a4b5" }}>No results match current filters</div>
        )}
      </div>
    </div>
  );
}
