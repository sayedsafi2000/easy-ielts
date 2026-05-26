"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

// Shape of one result row from /api/results
interface ResultRow {
  attempt_id: string;
  module: string;
  band_score: string | number | null;
  submitted_at?: string;
  test_attempts?: { tests?: { title?: string } | null } | null;
}

const MODULE_META: Record<string, { label: string; autoMarked: boolean }> = {
  listening: { label: "Listening", autoMarked: true  },
  reading:   { label: "Reading",   autoMarked: true  },
  writing:   { label: "Writing",   autoMarked: false },
  speaking:  { label: "Speaking",  autoMarked: false },
};

const NEXT_STEPS: Record<string, string[]> = {
  listening: ["Your Listening score has been calculated automatically.", "Go to Results to see your band score and per-question breakdown."],
  reading:   ["Your Reading score has been calculated automatically.", "Go to Results to see your band score and per-question breakdown."],
  writing:   ["Your writing will be reviewed by an examiner within 48 hours.", "You'll be notified when feedback is ready."],
  speaking:  ["Your speaking session is scheduled — check your booking for the join link.", "The examiner will publish your band score after the session."],
  full:      [
    "Listening and Reading scores are available immediately.",
    "Writing will be reviewed by an examiner within 48 hours.",
    "Speaking session — check your booking for the video link.",
    "Your full band score is published once all modules are complete.",
  ],
};

function AwaitingReviewContent() {
  const params     = useSearchParams();
  const type       = params.get("type")      ?? "single";
  const moduleKey  = params.get("module")    ?? "listening";
  const attemptId  = params.get("attemptId") ?? "";

  const isSingle   = type === "single";

  // Fetch real results for this attempt
  const [results, setResults]   = useState<ResultRow[]>([]);
  const [loadingR, setLoadingR] = useState(!!attemptId);
  const [submittedAt, setSubmittedAt] = useState<string>("");
  const [testTitle,   setTestTitle]   = useState<string>("");

  useEffect(() => {
    if (!attemptId) { setLoadingR(false); return; }
    api.get<ResultRow[]>("/api/results")
      .then(rows => {
        const mine = (rows ?? []).filter(r => r.attempt_id === attemptId);
        setResults(mine);
        // Pull meta from first row
        const first = mine[0];
        if (first) {
          const title = first.test_attempts?.tests?.title;
          if (title) setTestTitle(title);
          if ((first as any).published_at) {
            setSubmittedAt(new Date((first as any).published_at).toLocaleString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingR(false));
  }, [attemptId]);

  // Build module list — single = just that module, full = all 4
  const MODULES_TO_SHOW = isSingle
    ? [moduleKey]
    : ["listening", "reading", "writing", "speaking"];

  // For each module, determine status + score from real results
  function moduleInfo(mod: string) {
    const r = results.find(x => x.module === mod);
    const meta = MODULE_META[mod] ?? { label: mod, autoMarked: false };
    if (r && r.band_score !== null && r.band_score !== undefined) {
      const score = typeof r.band_score === "number" ? r.band_score : parseFloat(String(r.band_score));
      return {
        label:   meta.label,
        status:  meta.autoMarked ? "Auto-marked" : "Reviewed",
        score:   Number.isFinite(score) ? score : null,
        icon:    "check" as const,
      };
    }
    if (mod === "speaking") {
      return { label: meta.label, status: "Booking confirmed", score: null, icon: "scheduled" as const };
    }
    return {
      label:   meta.label,
      status:  meta.autoMarked ? "Being calculated…" : "Pending review",
      score:   null,
      icon:    meta.autoMarked ? ("check" as const) : ("pending" as const),
    };
  }

  const visibleModules = MODULES_TO_SHOW.map(moduleInfo);
  const nextSteps      = isSingle ? (NEXT_STEPS[moduleKey] ?? []) : NEXT_STEPS.full;

  const heroTitle = isSingle
    ? `${MODULE_META[moduleKey]?.label ?? moduleKey} — Single Module Test`
    : testTitle || "IELTS Mock Test";

  const subtitle = isSingle
    ? (moduleKey === "listening" || moduleKey === "reading")
      ? "Your score has been calculated automatically."
      : "Your submission is with the examiner."
    : "Listening and Reading are auto-marked. Writing and Speaking are with the examiner.";

  // Determine if the submitted module has a real auto-score to show
  const autoScoreReady = isSingle && (moduleKey === "listening" || moduleKey === "reading") && results.some(r => r.module === moduleKey && r.band_score !== null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "#f8f8fb" }}>
      <div className="max-w-lg w-full">

        {/* Hero icon */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 20px 40px rgba(159,121,255,0.35)" }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>
            {isSingle ? "Module submitted!" : "Test submitted!"}
          </h1>
          <p className="mt-2 text-sm text-[#7b7b8d] max-w-sm mx-auto leading-relaxed">{subtitle}</p>
        </div>

        {/* Module status card */}
        <div className="bg-white rounded-[24px] mb-4 overflow-hidden" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f1f7" }}>
            <h2 className="text-sm font-bold text-[#222225]">{heroTitle}</h2>
            <p className="text-xs text-[#a4a4b5] font-medium mt-0.5">
              {submittedAt ? `Submitted ${submittedAt}` : "Just submitted"}
            </p>
          </div>

          {loadingR ? (
            <div className="px-6 py-8 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#efe7ff", borderTopColor: "#9a72ff" }} />
              <span className="text-sm text-[#7b7b8d]">Calculating scores…</span>
            </div>
          ) : (
            <div>
              {visibleModules.map((m, i) => (
                <div
                  key={m.label}
                  className="px-6 py-4 flex items-center justify-between"
                  style={i < visibleModules.length - 1 ? { borderBottom: "1px solid #f6f7fb" } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          m.icon === "check"     ? "#dff1e8" :
                          m.icon === "pending"   ? "#fff2b3" :
                                                   "#d7e6ff",
                      }}
                    >
                      {m.icon === "check" && (
                        <svg className="w-5 h-5" style={{ color: "#2a9350" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {m.icon === "pending" && (
                        <svg className="w-5 h-5" style={{ color: "#7a6000" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {m.icon === "scheduled" && (
                        <svg className="w-5 h-5" style={{ color: "#2a55a0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#222225]">{m.label}</p>
                      <p
                        className="text-xs font-medium"
                        style={{
                          color:
                            m.icon === "check"     ? "#2a9350" :
                            m.icon === "pending"   ? "#7a6000" :
                                                     "#2a55a0",
                        }}
                      >
                        {m.status}
                      </p>
                    </div>
                  </div>
                  {m.score !== null ? (
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-[#222225]">{m.score}</span>
                      <p className="text-[10px] text-[#a4a4b5] mt-0.5">Band score</p>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-[#d0d0dc]">Pending</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick link to results if auto-score ready */}
        {autoScoreReady && (
          <div className="mb-4 rounded-[16px] p-4 flex items-center justify-between gap-3" style={{ background: "#dff1e8", border: "1px solid #b6e4c8" }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#2a9350" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: "#2a9350" }}>Your score is ready!</span>
            </div>
            <Link
              href={`/results${attemptId ? `?attemptId=${attemptId}` : ""}`}
              className="text-xs font-bold px-3 py-1.5 rounded-[10px] cursor-pointer whitespace-nowrap"
              style={{ background: "#2a9350", color: "white" }}
            >
              View results →
            </Link>
          </div>
        )}

        {/* What happens next */}
        <div className="bg-white rounded-[24px] p-6 mb-4" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <h3 className="text-sm font-bold text-[#222225] mb-4">What happens next</h3>
          <div className="space-y-3">
            {nextSteps.map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#efe7ff", color: "#6a45d0" }}
                >
                  {i + 1}
                </div>
                <p className="text-sm text-[#7b7b8d] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email notice */}
        <div className="rounded-[16px] p-4 flex gap-3 mb-8" style={{ background: "#efe7ff", border: "1px solid #ddd0ff" }}>
          <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#6a45d0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "#6a45d0" }}>
            You&apos;ll receive a notification when all your results are ready.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/start-test"
            className="flex-1 text-center text-sm font-bold px-5 py-3 rounded-[14px] cursor-pointer transition-colors"
            style={{ border: "1px solid #dedee8", color: "#353741", background: "white" }}
          >
            Start another test
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 text-center text-white text-sm font-bold px-5 py-3 rounded-[14px] cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AwaitingReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f8fb" }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "#efe7ff", borderTopColor: "#9a72ff" }} />
      </div>
    }>
      <AwaitingReviewContent />
    </Suspense>
  );
}
