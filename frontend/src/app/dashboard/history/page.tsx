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

function getBand(attempt: Attempt): number | null {
  if (!attempt.results?.length) return null;
  const scores = attempt.results.map((r) => r.band_score).filter((s): s is number => s !== null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then((d) => setAttempts(d?.attempts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = attempts.filter((a) => a.status === "completed");
  const bands = completed.map(getBand).filter((b): b is number => b !== null);
  const avgBand = bands.length ? (bands.reduce((a, b) => a + b, 0) / bands.length).toFixed(1) : null;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Test History</h1>
          <p className="text-sm text-[#7b7b8d] font-medium mt-0.5">
            {loading ? "Loading…" : `${attempts.length} tests · ${avgBand ? `Avg band ${avgBand}` : "No results yet"}`}
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

      {/* Progress chart */}
      {bands.length > 0 && (
        <div className="bg-white rounded-[20px] p-6 mb-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#222225]">Band score over time</h2>
            <span className="text-xs font-semibold text-[#7b7b8d]">{completed.length} completed</span>
          </div>
          <div className="flex items-end gap-3 h-24">
            {completed.slice().reverse().map((t) => {
              const band = getBand(t);
              if (!band) return null;
              return (
                <div key={t.id} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-xs font-bold text-[#222225]">{band}</span>
                  <div
                    className="w-full rounded-t-xl"
                    style={{ height: `${((band - 4) / 5) * 72}px`, background: "linear-gradient(180deg, #9f79ff 0%, #8f69f7 100%)" }}
                  />
                  <span className="text-[10px] font-semibold text-[#7b7b8d] whitespace-nowrap">
                    {new Date(t.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-[20px]" style={{ border: "1px solid #f1f1f7" }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && attempts.length === 0 && (
        <div className="bg-white rounded-[20px] p-12 text-center" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <p className="text-[#7b7b8d] text-sm mb-4">No tests taken yet</p>
          <Link href="/start-test" className="text-sm font-bold text-[#9a72ff] cursor-pointer">
            Start your first test
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && attempts.length > 0 && (
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f1f7", background: "#f6f7fb" }}>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#7b7b8d] ">Test</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#7b7b8d] ">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#7b7b8d] ">Track</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-[#7b7b8d] ">Band</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#7b7b8d] ">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f1f7]">
                {attempts.map((t) => {
                  const band = getBand(t);
                  const cfg = statusConfig[t.status] ?? statusConfig.in_progress;
                  const label = t.tests?.title ?? (t.format === "single" ? `Single Module — ${t.module ?? ""}` : "Mock Test");
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-[#f6f7fb]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#222225] truncate max-w-[200px]">{label}</p>
                        <p className="text-xs text-[#7b7b8d] font-medium capitalize mt-0.5">{t.format} · {t.track}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#7b7b8d] whitespace-nowrap">{formatDate(t.started_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          t.track === "academic"
                            ? "bg-[#efe7ff] text-[#6a45d0]"
                            : "bg-[#dff1e8] text-[#2a9350]"
                        }`}>
                          {t.track.charAt(0).toUpperCase() + t.track.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {band !== null ? (
                          <span className="text-lg font-extrabold text-[#222225]">{band}</span>
                        ) : (
                          <span className="text-[#ececf3]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {t.status === "completed" && (
                          <Link href={`/results?attemptId=${t.id}`} className="text-sm font-bold text-[#9a72ff] hover:text-[#8f69f7] cursor-pointer">
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
