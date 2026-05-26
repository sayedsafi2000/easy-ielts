"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Test {
  id: string;
  name: string;
  type: string;
  track: string;
  modules: { listening: boolean; reading: boolean; writing: boolean; speaking: boolean };
  status: string;
  attempts: number;
  created: string;
  difficulty: string;
}

const moduleTag = (label: string, active: boolean) =>
  active ? (
    <span key={label} className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#efe7ff", color: "#6a45d0" }}>{label}</span>
  ) : (
    <span key={label} className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#f6f7fb", color: "#d0d0dc" }}>{label}</span>
  );

const diffStyle: Record<string, { bg: string; color: string }> = {
  Easy:   { bg: "#dff1e8", color: "#2a9350" },
  Medium: { bg: "#fff2b3", color: "#7a6000" },
  Hard:   { bg: "#fff0f0", color: "#ff4d59" },
};

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapTest(t: any): Test {
  const modulesList: string[] = Array.isArray(t.modules)
    ? t.modules.map((m: any) => (typeof m === "string" ? m.toLowerCase() : String(m).toLowerCase()))
    : Object.keys(t.modules ?? {});

  const isFull = modulesList.length >= 4;
  const type   = isFull ? "Full Mock" : "Single Module";

  const rawTrack = t.type ?? "";
  let track = "Academic";
  if (rawTrack.toLowerCase() === "general") track = "General";
  else if (rawTrack.toLowerCase() === "academic") track = "Academic";

  const rawDifficulty = t.difficulty ? capitalize(t.difficulty) : "Medium";

  const rawStatus = t.status ? capitalize(t.status) : "Draft";

  const created = t.created_at
    ? new Date(t.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "";

  return {
    id:         String(t.id),
    name:       t.title ?? "",
    type,
    track,
    modules: {
      listening: modulesList.includes("listening"),
      reading:   modulesList.includes("reading"),
      writing:   modulesList.includes("writing"),
      speaking:  modulesList.includes("speaking"),
    },
    status:     rawStatus,
    attempts:   t.attempts ?? 0,
    created,
    difficulty: rawDifficulty,
  };
}

export default function TestsPage() {
  const [tests, setTests]       = useState<Test[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [typeFilter, setTypeFilter]     = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [trackFilter, setTrackFilter]   = useState("All");

  async function loadTests() {
    try {
      setLoading(true);
      setError(null);
      const raw = await api.get<any[]>("/api/admin/tests");
      setTests((raw ?? []).map(mapTest));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTests(); }, []);

  async function handleToggleStatus(t: Test) {
    try {
      await api.patch(`/api/tests/${t.id}`, {
        status: t.status === "Published" ? "draft" : "published",
      });
      await loadTests();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update test status");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/tests/${id}`);
      await loadTests();
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete test");
    }
  }

  const filtered = tests.filter((t) => {
    const matchType   = typeFilter   === "All" || t.type   === typeFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchTrack  = trackFilter  === "All" || t.track.includes(trackFilter);
    return matchType && matchStatus && matchTrack;
  });

  const published     = tests.filter((t) => t.status === "Published").length;
  const drafts        = tests.filter((t) => t.status === "Draft").length;
  const totalAttempts = tests.reduce((a, t) => a + t.attempts, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Mock Tests</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">
            {published} published · {drafts} drafts · {totalAttempts.toLocaleString()} total attempts
          </p>
        </div>
        <Link
          href="/admin/tests/new"
          className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Test
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Full Mock Tests",     value: tests.filter((t) => t.type === "Full Mock").length, bg: "#efe7ff", iconColor: "#6a45d0",
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
          { label: "Single Module Tests", value: tests.filter((t) => t.type === "Single Module").length, bg: "#d7e6ff", iconColor: "#2a55a0",
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
          { label: "Published",           value: published, bg: "#dff1e8", iconColor: "#2a9350",
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: "Total Attempts",      value: totalAttempts.toLocaleString(), bg: "#fff2b3", iconColor: "#7a6000",
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        ].map((c) => (
          <div key={c.label} className="rounded-[20px] flex items-center gap-4 p-5" style={{ background: c.bg, boxShadow: "0 14px 28px rgba(32,28,54,0.06)", minHeight: "96px" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.52)", color: c.iconColor }}>
              {c.icon}
            </div>
            <div>
              <p className="text-[1.75rem] font-bold text-[#222225] leading-none mb-1" style={{ letterSpacing: "-0.05em" }}>{c.value}</p>
              <p className="text-xs font-semibold text-[#4b4d58]">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[20px] p-4 flex flex-wrap gap-3" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
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
          {["All", "Published", "Draft"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
              style={statusFilter === s ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All", "Academic", "General"].map((t) => (
            <button key={t} onClick={() => setTrackFilter(t)}
              className="px-3 py-1.5 text-xs font-bold rounded-[10px] cursor-pointer transition-all"
              style={trackFilter === t ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
              {t}
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

      {/* Tests list */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f1f7", background: "#f6f7fb" }}>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-6 py-3">Test</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Modules</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Track</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Difficulty</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Attempts</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Status</th>
              <th className="text-left text-xs font-bold text-[#7b7b8d] px-4 py-3">Created</th>
              <th className="text-right text-xs font-bold text-[#7b7b8d] px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="h-3 w-48 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                      <div className="h-2.5 w-28 rounded animate-pulse" style={{ background: "#f6f7fb" }} />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {["L","R","W","S"].map((l) => (
                        <div key={l} className="h-5 w-7 rounded-full animate-pulse" style={{ background: "#f1f1f7" }} />
                      ))}
                    </div>
                  </td>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3 w-14 rounded animate-pulse" style={{ background: "#f1f1f7" }} />
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="h-3 w-24 rounded animate-pulse ml-auto" style={{ background: "#f1f1f7" }} />
                  </td>
                </tr>
              ))
            ) : (
              filtered.map((t, i) => (
                <tr key={t.id} style={{ borderTop: i > 0 ? "1px solid #f6f7fb" : undefined }}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#222225]">{t.name}</p>
                    <p className="text-xs text-[#a4a4b5] mt-0.5">{t.id} · {t.type}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {moduleTag("L", t.modules.listening)}
                      {moduleTag("R", t.modules.reading)}
                      {moduleTag("W", t.modules.writing)}
                      {moduleTag("S", t.modules.speaking)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{t.track}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={diffStyle[t.difficulty] ?? diffStyle["Medium"]}>
                      {t.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#353741]">{t.attempts.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={t.status === "Published" ? { background: "#dff1e8", color: "#2a9350" } : { background: "#f6f7fb", color: "#7b7b8d" }}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7b7b8d]">{t.created}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/tests/${t.id}`} className="text-xs font-bold cursor-pointer" style={{ color: "#9a72ff" }}>Edit</Link>
                      <span style={{ color: "#d0d0dc" }}>·</span>
                      <button
                        onClick={() => handleToggleStatus(t)}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: t.status === "Published" ? "#7b7b8d" : "#34ba65" }}>
                        {t.status === "Published" ? "Unpublish" : "Publish"}
                      </button>
                      <span style={{ color: "#d0d0dc" }}>·</span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: "#ff4d59" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: "#a4a4b5" }}>No tests found</div>
        )}
      </div>
    </div>
  );
}
