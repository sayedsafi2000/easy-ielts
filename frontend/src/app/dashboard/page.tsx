"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardData, Attempt } from "@/types";

const statusConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  completed:   { label: "Results ready",   bg: "#dff1e8", color: "#2a9350", dot: "#34ba65"  },
  submitted:   { label: "Awaiting review", bg: "#fff2b3", color: "#7a6000", dot: "#c89a00"  },
  reviewing:   { label: "Under review",    bg: "#d7e6ff", color: "#2a55a0", dot: "#6a9de0"  },
  in_progress: { label: "In progress",     bg: "#efe7ff", color: "#6a45d0", dot: "#9a72ff"  },
};

const moduleConfig = [
  { key: "listening", label: "Listening", bg: "#efe7ff", color: "#6a45d0" },
  { key: "reading",   label: "Reading",   bg: "#d7e6ff", color: "#2a55a0" },
  { key: "writing",   label: "Writing",   bg: "#dff1e8", color: "#2a9350" },
  { key: "speaking",  label: "Speaking",  bg: "#fff2b3", color: "#7a6000" },
];

function getBand(attempt: Attempt): number | null {
  if (!attempt.results?.length) return null;
  const scores = attempt.results.map((r) => r.band_score).filter((s): s is number => s !== null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const profile  = data?.profile;
  const attempts = data?.attempts ?? [];
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const completedAttempts = attempts.filter((a) => a.status === "completed");
  const bands = completedAttempts.map(getBand).filter((b): b is number => b !== null);
  const overallBand = bands.length ? (Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 2) / 2).toFixed(1) : "—";
  const bestBand = bands.length ? Math.max(...bands).toFixed(1) : "—";
  const targetBand = profile?.target_band ?? 7.0;
  const progressToTarget = bands.length ? Math.min((parseFloat(overallBand) / targetBand) * 100, 100) : 0;
  const recentAttempts = attempts.slice(0, 5);
  const activeAttempt = attempts[0]?.status === "in_progress" ? attempts[0] : null;

  if (loading) {
    return (
      <div className="p-7">
        <div className="animate-pulse space-y-5">
          <div className="h-7 bg-[#ececf3] rounded-xl w-56" />
          <div className="h-44 bg-[#ececf3] rounded-[24px]" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-[#ececf3] rounded-[20px]" />)}
          </div>
          <div className="h-64 bg-[#ececf3] rounded-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-5">

      <div className="flex items-center justify-between h-[72px] border-b border-[#ececf3] -mt-7 -mx-7 px-7 mb-2">
        <h1 className="text-[1.15rem] font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>
          Welcome back, {firstName} 👋
        </h1>
        <Link
          href="/start-test"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Test
        </Link>
      </div>

      <div className="rounded-[24px] overflow-hidden relative" style={{ background: "#2d2c31", boxShadow: "0 14px 28px rgba(32,28,54,0.10)" }}>
        <div className="absolute w-44 h-44 rounded-full left-[-34px] bottom-[-58px]" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute w-28 h-28 rounded-full left-[260px] top-[-34px]" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="relative z-10 flex items-center justify-between gap-6 p-8">
          <div className="flex-1">
            <span className="text-[0.8rem] font-bold uppercase tracking-widest opacity-60 text-white block mb-3">
              Your IELTS Journey
            </span>
            <h2 className="text-[1.9rem] font-extrabold text-white mb-1 leading-tight" style={{ letterSpacing: "-0.05em" }}>
              {overallBand === "—" ? "No tests yet" : <>Avg Band: <span style={{ color: "#b798ff" }}>{overallBand}</span></>}
            </h2>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {bands.length
                ? `You're ${Math.round(progressToTarget)}% of the way to your target — keep pushing!`
                : "Take your first test to track progress"}
            </p>
            <div className="mb-6 max-w-xs">
              <div className="flex justify-between text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span>Progress to target</span>
                <span style={{ color: "#b798ff" }}>{Math.round(progressToTarget)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressToTarget}%`, background: "linear-gradient(90deg, #9f79ff 0%, #8f69f7 100%)" }} />
              </div>
            </div>
            <Link href="/start-test" className="inline-flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-[18px] cursor-pointer" style={{ background: "#fff", color: "#2a2a2f", boxShadow: "0 10px 22px rgba(0,0,0,0.16)" }}>
              Start a test
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="shrink-0 hidden lg:flex flex-col items-center justify-center w-28 h-28 rounded-[22px] border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <span className="text-4xl font-extrabold" style={{ color: "#b798ff", letterSpacing: "-0.05em" }}>{targetBand}</span>
            <span className="text-xs font-semibold mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Target Band</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Tests Taken", value: String(attempts.length), bg: "#fff0a8", iconColor: "#a08a1f",
            icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3" /></svg>,
          },
          {
            label: "Best Band", value: bestBand, bg: "#dfeade", iconColor: "#75867c",
            icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
          },
          {
            label: "Target Band", value: String(targetBand), bg: "#d7e6ff", iconColor: "#7b9dd1",
            icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-[20px] flex items-center gap-4 p-6" style={{ background: card.bg, boxShadow: "0 14px 28px rgba(32,28,54,0.06)", minHeight: "128px" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.52)", color: card.iconColor }}>
              {card.icon}
            </div>
            <div>
              <strong className="block text-[2rem] font-bold text-[#222225] leading-none mb-1" style={{ letterSpacing: "-0.05em" }}>{card.value}</strong>
              <span className="text-sm font-semibold" style={{ color: "#4b4d58" }}>{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {activeAttempt && (
        <div className="bg-white rounded-[20px] overflow-hidden border border-[#f1f1f7]" style={{ boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div className="px-6 py-4 flex items-center justify-between border-b border-[#f1f1f7]">
            <div>
              <h2 className="font-bold text-[#222225]" style={{ letterSpacing: "-0.03em" }}>Current Test</h2>
              <p className="text-xs text-[#7b7b8d] font-medium mt-0.5">
                {activeAttempt.tests?.title ?? "Mock Test"} · {activeAttempt.track.charAt(0).toUpperCase() + activeAttempt.track.slice(1)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold" style={{ background: "#efe7ff", color: "#6a45d0" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#9a72ff]" />
              In progress
            </span>
          </div>
          <div className="px-6 py-4">
            <div className="flex gap-2 flex-wrap">
              {moduleConfig.map((m) => (
                <span key={m.key} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: m.bg, color: m.color }}>
                  {m.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#7b7b8d] mt-3">Complete all modules to get your results.</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[1.05rem] text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Recent Tests</h3>
          <Link href="/dashboard/history" className="h-10 px-4 rounded-[14px] border border-[#dedee8] bg-white text-sm font-bold text-[#434552] inline-flex items-center hover:bg-[#f6f7fb] transition-colors cursor-pointer">
            See all
          </Link>
        </div>

        <div className="bg-white rounded-[20px] overflow-hidden border border-[#f1f1f7]" style={{ boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div className="grid px-7 py-4 border-b border-[#f1f1f7] text-sm font-bold text-[#5b5d68]" style={{ gridTemplateColumns: "minmax(0,1.35fr) 160px 150px 40px", background: "#f6f7fb" }}>
            <span>Test</span>
            <span>Date</span>
            <span>Status</span>
            <span />
          </div>

          {recentAttempts.length === 0 ? (
            <div className="px-7 py-12 text-center">
              <p className="text-sm text-[#7b7b8d] mb-3">No tests yet</p>
              <Link href="/start-test" className="text-sm font-bold cursor-pointer" style={{ color: "#9a72ff" }}>
                Start your first test
              </Link>
            </div>
          ) : (
            recentAttempts.map((t) => {
              const band = getBand(t);
              const cfg  = statusConfig[t.status] ?? statusConfig.in_progress;
              return (
                <div key={t.id} className="grid px-7 border-t border-[#f1f1f7] hover:bg-[#fafafe] transition-colors items-center" style={{ gridTemplateColumns: "minmax(0,1.35fr) 160px 150px 40px", minHeight: "88px" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0" style={{ background: "#f8f7fc" }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: "#9a72ff" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#222225] mb-1" style={{ letterSpacing: "-0.02em" }}>
                        {t.tests?.title ?? (t.format === "single" ? `Single — ${t.module}` : "Mock Test")}
                      </p>
                      <p className="text-xs font-medium text-[#7b7b8d]">
                        {t.track.charAt(0).toUpperCase() + t.track.slice(1)}
                        {band !== null && <> · <span className="font-bold text-[#222225]">Band {band}</span></>}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-[#7b7b8d] font-medium">{formatDate(t.started_at)}</span>
                  <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold w-fit" style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                  <Link href={t.status === "completed" ? `/results?attemptId=${t.id}` : "#"} className="w-8 h-8 rounded-[10px] border border-[#ececf3] bg-white flex items-center justify-center hover:border-[#9a72ff] transition-colors" style={{ color: "#7b7b8d" }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
