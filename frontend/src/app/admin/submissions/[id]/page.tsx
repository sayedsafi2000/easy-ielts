"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CRITERIA = ["Task Achievement", "Coherence & Cohesion", "Lexical Resource", "Grammatical Accuracy"];
const BAND_VALUES = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

interface SubDetail {
  id: string;
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_plan: string;
  target_band: number | null;
  prev_writing_band: number | null;
  track: string;
  format: string;
  test_title: string;
  module: string;
  answers: Record<string, string>;
  word_count: number | null;
  status: string;
  submitted_at: string;
}

export default function SubmissionReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const subId = params?.id as string;

  const [sub, setSub]       = useState<SubDetail | null>(null);
  const [loading, setLoad]  = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [scores, setScores] = useState<Record<string, string>>({
    "Task Achievement":          "",
    "Coherence & Cohesion":      "",
    "Lexical Resource":          "",
    "Grammatical Accuracy":      "",
  });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!subId) return;
    api.get<SubDetail>(`/api/admin/submissions/${subId}`)
      .then(d => setSub(d))
      .catch(e => setLoadErr(e?.message ?? "Failed to load submission"))
      .finally(() => setLoad(false));
  }, [subId]);

  const avg = (() => {
    const vals = Object.values(scores).map(Number).filter(Boolean);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2;
  })();

  async function handleSubmit() {
    if (!sub || !avg || !feedback.trim()) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await api.post(`/api/admin/submissions/${subId}/review`, {
        band_score:   avg,
        task1_score:  Number(scores["Task Achievement"]) || null,
        task2_score:  Number(scores["Coherence & Cohesion"]) || null,
        feedback,
        criteria: {
          task_achievement:   Number(scores["Task Achievement"]),
          coherence_cohesion: Number(scores["Coherence & Cohesion"]),
          lexical_resource:   Number(scores["Lexical Resource"]),
          grammatical_range:  Number(scores["Grammatical Accuracy"]),
        },
        student_id: sub.student_id,
        attempt_id: sub.attempt_id,
      });
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e?.message ?? "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (loadErr || !sub) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Submissions
        </Link>
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {loadErr || "Submission not found."}
        </div>
      </div>
    );
  }

  const task1Text = sub.answers?.task1 ?? sub.answers?.["task1"] ?? "";
  const task2Text = sub.answers?.task2 ?? sub.answers?.["task2"] ?? "";

  if (submitted) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Review Submitted</h2>
          <p className="text-slate-500 text-sm mb-6">The student has been notified and their results are now available in their dashboard.</p>
          <div className="flex justify-center gap-3">
            <Link href="/admin/submissions" className="bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              Back to Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/submissions" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Submissions
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — student submission */}
        <div className="space-y-4">
          {/* Student info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}
              >
                {sub.student_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{sub.student_name}</p>
                <p className="text-xs text-slate-500">
                  {sub.track.charAt(0).toUpperCase() + sub.track.slice(1)} · Writing Task 1 + Task 2 ·{" "}
                  {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                sub.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
              }`}>
                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-500">Track</p>
                <p className="font-semibold text-slate-900 mt-0.5 capitalize">{sub.track}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-500">Target Band</p>
                <p className="font-semibold text-slate-900 mt-0.5">{sub.target_band ?? "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-500">Prev. Writing</p>
                <p className="font-semibold text-slate-900 mt-0.5">{sub.prev_writing_band ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Task 1 */}
          {task1Text && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Task 1</h3>
                <span className="text-xs text-slate-400">{task1Text.trim().split(/\s+/).length} words</span>
              </div>
              <div className="text-xs leading-relaxed text-slate-700 bg-blue-50 rounded-xl p-4 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {task1Text}
              </div>
            </div>
          )}

          {/* Task 2 */}
          {task2Text && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Task 2</h3>
                <span className="text-xs text-slate-400">{task2Text.trim().split(/\s+/).length} words</span>
              </div>
              <div className="text-xs leading-relaxed text-slate-700 bg-blue-50 rounded-xl p-4 max-h-56 overflow-y-auto whitespace-pre-wrap">
                {task2Text}
              </div>
            </div>
          )}

          {!task1Text && !task2Text && (
            <div className="bg-slate-50 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-500">No written content found for this submission.</p>
              <p className="text-xs text-slate-400 mt-1">Keys: {Object.keys(sub.answers ?? {}).join(", ")}</p>
            </div>
          )}
        </div>

        {/* Right — marking panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-5">Examiner Review</h2>

            <div className="space-y-4 mb-6">
              {CRITERIA.map(c => (
                <div key={c}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">{c}</label>
                    {scores[c] && <span className="text-xs font-bold text-blue-600">{scores[c]}</span>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {BAND_VALUES.map(v => (
                      <button
                        key={v}
                        onClick={() => setScores(s => ({ ...s, [c]: String(v) }))}
                        className={`w-10 h-8 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                          scores[c] === String(v) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {avg !== null && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 font-medium">Calculated Band Score</span>
                  <span className="text-2xl font-bold text-blue-700">{avg}</span>
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Written Feedback</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={6}
                placeholder="Write detailed examiner feedback. Address Task Achievement, vocabulary, grammar, coherence. Include specific suggestions for improvement..."
                className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400 mt-1">{feedback.length} characters</p>
            </div>

            {submitError && (
              <div className="rounded-xl px-4 py-3 text-xs font-medium mb-4" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!avg || !feedback.trim() || submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm py-3 rounded-xl cursor-pointer transition-colors"
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>

            {(!avg || !feedback.trim()) && (
              <p className="text-xs text-slate-400 text-center mt-2">Score all criteria and add feedback to submit</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
