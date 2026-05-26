"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface CriteriaItem { label: string; score: number; note?: string }
interface ResultRow {
  id: string;
  attempt_id: string;
  module: string;
  band_score: string | number | null;
  task1_score: string | number | null;
  task2_score: string | number | null;
  feedback: string | null;
  criteria: Record<string, number | string> | null;
  published_at: string;
  created_at: string;
  test_attempts: {
    track: string;
    format: string;
    tests: { title: string } | null;
  } | null;
  reviewer: { full_name: string } | null;
}

const MODULE_ORDER = ["listening", "reading", "writing", "speaking"];

const MODULE_LABEL: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

const CRITERIA_LABELS: Record<string, string> = {
  task_achievement: "Task Achievement",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range: "Grammatical Range & Accuracy",
  fluency_coherence: "Fluency & Coherence",
  pronunciation: "Pronunciation",
};

function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function ScoreRing({ score, max = 9 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#ececf3" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke="#9a72ff" strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xl font-bold text-[#222225]">{score.toFixed(score % 1 === 0 ? 0 : 1)}</span>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#d9d1ff" }}><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "#efe7ff", borderTopColor: "#9a72ff" }} /></div>}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const paramAttemptId = searchParams.get("attemptId");

  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    api.get<ResultRow[]>("/api/results")
      .then((d) => {
        setRows(d || []);
        // If a specific attemptId was linked, select it; otherwise pick most recent
        if (paramAttemptId && d?.find(r => r.attempt_id === paramAttemptId)) {
          setSelectedAttemptId(paramAttemptId);
        } else if (d && d.length) {
          setSelectedAttemptId(d[0].attempt_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paramAttemptId]);

  // Group results by attempt
  const groupedByAttempt = rows.reduce<Record<string, ResultRow[]>>((acc, r) => {
    (acc[r.attempt_id] = acc[r.attempt_id] || []).push(r);
    return acc;
  }, {});

  const attemptIds = Object.keys(groupedByAttempt);
  const currentAttemptId = selectedAttemptId && groupedByAttempt[selectedAttemptId] ? selectedAttemptId : attemptIds[0];
  const currentResults = currentAttemptId ? groupedByAttempt[currentAttemptId] : [];

  // Build module score list in canonical order
  const moduleScores = MODULE_ORDER.map((mod) => {
    const r = currentResults.find((x) => x.module === mod);
    if (!r) return null;
    const score = num(r.band_score) ?? 0;
    const auto = mod === "listening" || mod === "reading";
    let criteriaList: CriteriaItem[] | null = null;
    if (!auto && r.criteria && typeof r.criteria === "object") {
      criteriaList = Object.entries(r.criteria)
        .filter(([k]) => CRITERIA_LABELS[k])
        .map(([k, v]) => ({
          label: CRITERIA_LABELS[k] || k,
          score: typeof v === "number" ? v : parseFloat(String(v)) || 0,
          note: undefined,
        }));
    }
    return {
      label: MODULE_LABEL[mod],
      module: mod,
      score,
      type: auto ? ("auto" as const) : ("manual" as const),
      criteria: criteriaList,
      feedback: r.feedback || (auto
        ? `Auto-marked. ${r.criteria && (r.criteria as any).rawScore !== undefined
            ? `${(r.criteria as any).rawScore} / ${(r.criteria as any).totalQuestions} correct.`
            : ''}`
        : "Awaiting examiner feedback."),
    };
  }).filter(Boolean) as Array<{
    label: string; module: string; score: number; type: "auto" | "manual";
    criteria: CriteriaItem[] | null; feedback: string;
  }>;

  // Overall band — mean of available module bands, rounded to nearest 0.5
  const allBands = moduleScores.map((m) => m.score).filter((s) => s > 0);
  const overallBand = allBands.length
    ? Math.round((allBands.reduce((a, b) => a + b, 0) / allBands.length) * 2) / 2
    : 0;

  // Hero meta
  const heroMeta = currentResults[0]?.test_attempts;
  const heroTitle = heroMeta?.tests?.title ?? "Mock Test";
  const heroTrack = heroMeta?.track === "general" ? "General Training" : "Academic";
  const heroDate = currentResults[0]?.published_at
    ? new Date(currentResults[0].published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#d9d1ff" }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "#efe7ff", borderTopColor: "#9a72ff" }} />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="min-h-screen" style={{ background: "#d9d1ff" }}>
        <div className="bg-white px-6 h-14 flex items-center justify-between" style={{ borderBottom: "1px solid #ececf3" }}>
          <Link href="/dashboard" className="flex items-center gap-2 text-[#7b7b8d] hover:text-[#222225] transition-colors cursor-pointer text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>
        <div className="max-w-xl mx-auto py-24 text-center">
          <div className="bg-white rounded-[20px] p-12" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "#efe7ff" }}>
              <svg className="w-8 h-8" style={{ color: "#9a72ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l3-4 4 3 5-8" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#222225] mb-2" style={{ letterSpacing: "-0.04em" }}>No results yet</h1>
            <p className="text-sm text-[#7b7b8d] mb-6">Take your first mock test to see your band scores here.</p>
            <Link
              href="/start-test"
              className="inline-flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-[14px] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
            >
              Start a test
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#d9d1ff" }}>
      {/* Top bar */}
      <div className="bg-white px-6 h-14 flex items-center justify-between" style={{ borderBottom: "1px solid #ececf3" }}>
        <Link href="/dashboard" className="flex items-center gap-2 text-[#7b7b8d] hover:text-[#222225] transition-colors cursor-pointer text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="text-sm text-[#7b7b8d] hover:text-[#222225] flex items-center gap-1.5 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Attempt selector — only when there are multiple attempts */}
        {attemptIds.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            {attemptIds.map((aid) => {
              const meta = groupedByAttempt[aid][0];
              const title = meta.test_attempts?.tests?.title ?? "Mock Test";
              const date = meta.published_at
                ? new Date(meta.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : "";
              const active = aid === currentAttemptId;
              return (
                <button
                  key={aid}
                  onClick={() => setSelectedAttemptId(aid)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all"
                  style={
                    active
                      ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white", boxShadow: "0 4px 12px rgba(159,121,255,0.22)" }
                      : { background: "white", color: "#434552", border: "1px solid #dedee8" }
                  }
                >
                  {title.length > 40 ? title.slice(0, 38) + "…" : title} · {date}
                </button>
              );
            })}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ background: "#efe7ff", color: "#6a45d0" }}>
            {heroTitle} · {heroTrack} · {heroDate}
          </span>
          <h1 className="text-3xl font-bold text-[#222225] mb-2" style={{ letterSpacing: "-0.04em" }}>Your results are ready</h1>

          {/* Overall band */}
          <div className="inline-flex flex-col items-center bg-white rounded-[20px] px-10 py-6 mt-4" style={{ border: "2px solid #ddd0ff", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <p className="text-xs font-semibold text-[#7b7b8d] uppercase tracking-wide mb-2">Overall Band Score</p>
            <div className="text-6xl font-bold leading-none mb-1" style={{ color: "#9a72ff" }}>
              {overallBand > 0 ? overallBand.toFixed(1) : "—"}
            </div>
            <p className="text-sm text-[#7b7b8d] mt-1">
              {overallBand >= 8 ? "Very Good User" :
               overallBand >= 7 ? "Good User" :
               overallBand >= 6 ? "Competent User" :
               overallBand >= 5 ? "Modest User" :
               overallBand > 0 ? "Limited User" : "Pending modules"}
            </p>
          </div>
        </div>

        {/* Module score overview */}
        {moduleScores.length > 0 && (
          <div className="bg-white rounded-[20px] p-6 mb-8" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
            <h2 className="text-base font-bold text-[#222225] mb-6">Score by module</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {moduleScores.map((m) => (
                <div key={m.label} className="text-center">
                  <ScoreRing score={m.score} />
                  <p className="text-sm font-semibold text-[#222225] mt-2">{m.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.type === "auto" ? "bg-[#f6f7fb] text-[#7b7b8d]" : "bg-[#efe7ff] text-[#6a45d0]"
                  }`}>
                    {m.type === "auto" ? "Auto-marked" : "Expert reviewed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed feedback per module */}
        <div className="space-y-6">
          {moduleScores.map((m) => (
            <div key={m.label} className="bg-white rounded-[20px] overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
              <div className="px-6 py-5 flex items-center justify-between" style={{ background: "#f6f7fb", borderBottom: "1px solid #f1f1f7" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: "#efe7ff", color: "#9a72ff" }}>
                    {m.score % 1 === 0 ? m.score : m.score.toFixed(1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#222225]">{m.label}</h3>
                    <p className="text-xs text-[#7b7b8d]">{m.type === "auto" ? "Automatically marked" : "Marked by examiner"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#7b7b8d] mb-1">Band score</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <div
                        key={n}
                        className="h-2 w-4 rounded-sm"
                        style={{ background: n <= m.score ? "#9a72ff" : "#ececf3" }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Criteria breakdown — only for manually-reviewed modules */}
              {m.criteria && m.criteria.length > 0 && (
                <div className="px-6 py-5" style={{ borderBottom: "1px solid #f1f1f7" }}>
                  <p className="text-xs font-semibold text-[#222225] mb-4">Criteria breakdown</p>
                  <div className="space-y-4">
                    {m.criteria.map((c) => (
                      <div key={c.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#222225]">{c.label}</span>
                          <span className="text-sm font-bold text-[#9a72ff]">{c.score % 1 === 0 ? c.score : c.score.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: "#ececf3" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(c.score / 9) * 100}%`, background: "linear-gradient(90deg, #9f79ff 0%, #8f69f7 100%)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examiner feedback */}
              <div className="px-6 py-5">
                <p className="text-xs font-semibold text-[#222225] mb-2">Examiner feedback</p>
                <p className="text-sm text-[#7b7b8d] leading-relaxed">{m.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/start-test"
            className="flex-1 text-center text-sm font-semibold px-6 py-3 rounded-[14px] transition-colors cursor-pointer"
            style={{ color: "#9a72ff", background: "white", border: "2px solid #ddd0ff" }}
          >
            Take another test
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 text-center text-white text-sm font-semibold px-6 py-3 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
