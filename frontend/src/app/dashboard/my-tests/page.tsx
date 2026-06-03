"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Attempt, DashboardData } from "@/types";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  completed:   { label: "Results ready",   color: "bg-[#dff1e8] text-[#2a9350] border-[#c4e8d4]",   dot: "bg-[#2a9350]" },
  submitted:   { label: "Awaiting review", color: "bg-[#fff2b3] text-[#7a6000] border-[#ffe97a]",   dot: "bg-[#7a6000]"  },
  reviewing:   { label: "Under review",    color: "bg-[#d7e6ff] text-[#2a55a0] border-[#b8d0f8]",   dot: "bg-[#2a55a0]"  },
  in_progress: { label: "In progress",     color: "bg-[#f6f7fb] text-[#7b7b8d] border-[#ececf3]",   dot: "bg-[#7b7b8d]"  },
};

const moduleColors: Record<string, string> = {
  listening: "bg-[#efe7ff] text-[#6a45d0]",
  reading:   "bg-[#d7e6ff] text-[#2a55a0]",
  writing:   "bg-[#dff1e8] text-[#2a9350]",
  speaking:  "bg-[#fff2b3] text-[#7a6000]",
};

function getBand(attempt: Attempt): number | null {
  if (!attempt.results?.length) return null;
  const scores = attempt.results.map((r) => r.band_score).filter((s): s is number => s !== null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyTestsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then((d) => setAttempts(d?.attempts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filters = ["All", "Academic", "General Training", "Full Mock", "Single Module"];

  const filtered = attempts.filter((a) => {
    if (filter === "All") return true;
    if (filter === "Academic") return a.track === "academic";
    if (filter === "General Training") return a.track === "general";
    if (filter === "Full Mock") return a.format === "full";
    if (filter === "Single Module") return a.format === "single";
    return true;
  });

  return (
    <div className="p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>My Tests</h1>
          <p className="text-sm text-[#7b7b8d] font-medium mt-0.5">
            {loading ? "Loading…" : `${attempts.length} test${attempts.length !== 1 ? "s" : ""} taken`}
          </p>
        </div>
        <Link
          href="/start-test"
          className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Test
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs font-bold px-3.5 py-1.5 rounded-[14px] border transition-colors cursor-pointer"
            style={filter === f
              ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white", border: "1px solid #9f79ff", boxShadow: "0 4px 12px rgba(159,121,255,0.22)" }
              : { background: "white", color: "#434552", border: "1px solid #dedee8" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-[20px]" style={{ border: "1px solid #f1f1f7" }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#efe7ff" }}>
            <svg className="w-8 h-8" style={{ color: "#9a72ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#222225]">
              {attempts.length === 0 ? "No tests yet" : "No tests matching this filter"}
            </p>
            {attempts.length === 0 && (
              <p className="text-sm text-[#7b7b8d] mt-1">Take your first test to track your progress</p>
            )}
          </div>
          {attempts.length === 0 && (
            <Link
              href="/start-test"
              className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-[14px] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Start your first test
            </Link>
          )}
        </div>
      )}

      {/* Test cards */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map((t) => {
            const band = getBand(t);
            const cfg = statusConfig[t.status] ?? statusConfig.in_progress;
            const testLabel = t.tests?.title ?? (t.format === "single" ? `Single Module — ${t.module ?? ""}` : "IELTS Mock Test");
            return (
              <div key={t.id} className="bg-white rounded-[20px] overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
                {/* Card header */}
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#efe7ff" }}>
                      <svg className="w-5 h-5" style={{ color: "#9a72ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#222225]">{testLabel}</p>
                      <p className="text-xs text-[#7b7b8d] font-medium mt-0.5">
                        {t.track.charAt(0).toUpperCase() + t.track.slice(1)} · {formatDate(t.started_at)}
                      </p>
                      {/* Tags */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          t.track === "academic" ? "bg-[#efe7ff] text-[#6a45d0]" : "bg-[#dff1e8] text-[#2a9350]"
                        }`}>
                          {t.track.charAt(0).toUpperCase() + t.track.slice(1)}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f6f7fb] text-[#7b7b8d] capitalize">
                          {t.format === "full" ? "Full mock" : "Single module"}
                        </span>
                        {t.module && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${moduleColors[t.module] ?? "bg-[#f6f7fb] text-[#7b7b8d]"}`}>
                            {t.module}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status + band */}
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    {band !== null && (
                      <p className="text-2xl font-extrabold text-[#222225] mt-2">{band}</p>
                    )}
                  </div>
                </div>

                {/* Results row */}
                {t.results?.length > 0 && (
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {t.results.map((r) => (
                        <div key={r.module} className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: "#f6f7fb" }}>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${moduleColors[r.module] ?? "bg-[#f6f7fb] text-[#7b7b8d]"}`}>
                            {r.module}
                          </span>
                          <span className="text-lg font-bold text-[#222225]">{r.band_score ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer action */}
                <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #f1f1f7" }}>
                  <p className="text-xs text-[#7b7b8d] font-medium">
                    {t.submitted_at ? `Submitted ${formatDate(t.submitted_at)}` : "Not submitted yet"}
                  </p>
                  {t.status === "completed" ? (
                    <Link href={`/results?attemptId=${t.id}`} className="text-sm font-bold text-[#9a72ff] hover:text-[#8f69f7] cursor-pointer flex items-center gap-1">
                      View results
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : t.status === "in_progress" ? (
                    <Link href={`/start-test/format?track=${t.track}`} className="text-sm font-bold text-[#9a72ff] hover:text-[#8f69f7] cursor-pointer flex items-center gap-1">
                      Continue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
