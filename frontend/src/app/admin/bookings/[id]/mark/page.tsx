"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";

const CRITERIA: { key: string; label: string }[] = [
  { key: "fluency_coherence",  label: "Fluency & Coherence" },
  { key: "lexical_resource",   label: "Lexical Resource" },
  { key: "grammatical_range",  label: "Grammatical Range & Accuracy" },
  { key: "pronunciation",      label: "Pronunciation" },
];
const BAND_VALUES = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

interface Booking {
  id: string;
  scheduled_at: string | null;
  status: string;
  provider: string | null;
  recording_status: string | null;
  recording_url: string | null;
  transcript_url: string | null;
  transcript_text: string | null;
  student: { full_name: string; email: string } | null;
}

export default function SpeakingMarkPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  // Manual recording + transcript attach
  const [recUrl, setRecUrl] = useState("");
  const [recFile, setRecFile] = useState<File | null>(null);
  const [recBusy, setRecBusy] = useState(false);
  const [recMsg, setRecMsg] = useState("");
  const [transcript, setTranscript] = useState("");
  const [trBusy, setTrBusy] = useState(false);
  const [trMsg, setTrMsg] = useState("");

  async function saveRecording() {
    setRecBusy(true); setRecMsg("");
    try {
      let updated: Booking;
      if (recFile) {
        const fd = new FormData();
        fd.append("file", recFile);
        const token = typeof window !== "undefined" ? window.localStorage.getItem("eielts_token") : null;
        const res = await fetch(`${API_URL}/api/examiner/bookings/${id}/recording`, {
          method: "POST",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Upload failed");
        updated = json.data;
      } else if (recUrl.trim()) {
        updated = await api.post<Booking>(`/api/examiner/bookings/${id}/recording`, { recording_url: recUrl.trim() });
      } else {
        setRecMsg("Choose a file or paste a URL."); setRecBusy(false); return;
      }
      setBooking((b) => (b ? { ...b, recording_status: "available", recording_url: updated.recording_url } : b));
      setRecFile(null); setRecUrl(""); setRecMsg("Recording attached ✓");
    } catch (e: any) {
      setRecMsg(e?.message ?? "Failed to attach recording.");
    } finally { setRecBusy(false); }
  }

  async function saveTranscript() {
    if (!transcript.trim()) { setTrMsg("Paste the transcript text first."); return; }
    setTrBusy(true); setTrMsg("");
    try {
      const updated = await api.put<Booking>(`/api/examiner/bookings/${id}/transcript`, { transcript_text: transcript.trim() });
      setBooking((b) => (b ? { ...b, transcript_text: updated.transcript_text } : b));
      setTranscript(""); setTrMsg("Transcript saved ✓");
    } catch (e: any) {
      setTrMsg(e?.message ?? "Failed to save transcript.");
    } finally { setTrBusy(false); }
  }

  useEffect(() => {
    if (!id) return;
    api.get<Booking[]>("/api/examiner/bookings")
      .then((list) => {
        const b = (list ?? []).find((x) => x.id === id);
        if (!b) setLoadErr("Session not found in your queue.");
        else setBooking(b);
      })
      .catch((e) => setLoadErr(e?.message ?? "Failed to load session"))
      .finally(() => setLoading(false));
  }, [id]);

  const avg = (() => {
    const vals = CRITERIA.map((c) => Number(scores[c.key])).filter((n) => Number.isFinite(n) && n > 0);
    if (vals.length !== CRITERIA.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2;
  })();

  async function submit() {
    if (avg === null || !feedback.trim()) return;
    setSubmitErr("");
    setSubmitting(true);
    try {
      const criteria: Record<string, number> = {};
      CRITERIA.forEach((c) => { criteria[c.key] = Number(scores[c.key]); });
      await api.post(`/api/examiner/bookings/${id}/marks`, { criteria, feedback });
      setSubmitted(true);
    } catch (e: any) {
      setSubmitErr(e?.message ?? "Failed to submit marks.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8"><div className="h-64 rounded-2xl animate-pulse" style={{ background: "#f1f1f7" }} /></div>;
  }

  if (loadErr || !booking) {
    return (
      <div className="p-8">
        <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-4">← Back to Bookings</Link>
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>{loadErr || "Not found."}</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Marks Submitted</h2>
          <p className="text-slate-500 text-sm mb-6">The student has been notified and the result is now in their dashboard.</p>
          <Link href="/admin/bookings" className="bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">Back to Bookings</Link>
        </div>
      </div>
    );
  }

  const recAvailable = booking.recording_status === "available";

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-6">← Back to Bookings</Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — session info + recording/transcript */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
                {(booking.student?.full_name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{booking.student?.full_name}</p>
                <p className="text-xs text-slate-500">
                  Speaking · {booking.provider === "zoom" ? "Zoom" : "Google Meet"} ·{" "}
                  {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Recording */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Recording</p>
                {recAvailable && booking.recording_url && (
                  <a href={booking.recording_url} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold mb-2 cursor-pointer" style={{ color: "#9a72ff" }}>Open current recording ↗</a>
                )}
                <input
                  type="file" accept="audio/*,video/*"
                  onChange={(e) => setRecFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-slate-600 mb-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#efe7ff] file:text-[#6a45d0] cursor-pointer"
                />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-slate-400">or paste a link</span>
                  <input
                    type="url" value={recUrl} onChange={(e) => setRecUrl(e.target.value)}
                    placeholder="https://…"
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={saveRecording} disabled={recBusy || (!recFile && !recUrl.trim())}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer disabled:opacity-50" style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
                    {recBusy ? "Saving…" : "Attach recording"}
                  </button>
                  {recMsg && <span className="text-xs text-slate-500">{recMsg}</span>}
                </div>
              </div>

              {/* Transcript */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Transcript</p>
                {booking.transcript_text && !transcript && (
                  <div className="text-xs leading-relaxed text-slate-700 bg-slate-50 rounded-xl p-3 max-h-32 overflow-y-auto whitespace-pre-wrap mb-2">{booking.transcript_text}</div>
                )}
                <textarea
                  value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={5}
                  placeholder={booking.transcript_text ? "Paste new transcript text to replace…" : "Paste the session transcript here…"}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400 mb-2"
                />
                <div className="flex items-center gap-3">
                  <button onClick={saveTranscript} disabled={trBusy || !transcript.trim()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer disabled:opacity-50" style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
                    {trBusy ? "Saving…" : "Save transcript"}
                  </button>
                  {trMsg && <span className="text-xs text-slate-500">{trMsg}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — marking panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-5">Speaking Marks</h2>

            {booking.status !== "scheduled" && (
              <div className="rounded-xl px-4 py-3 text-xs font-medium mb-5" style={{ background: "#dff1e8", color: "#2a9350", border: "1px solid #b6e4c8" }}>
                Marks already submitted for this session. You can still attach a recording or transcript on the left.
              </div>
            )}

            <div className="space-y-4 mb-6">
              {CRITERIA.map((c) => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">{c.label}</label>
                    {scores[c.key] && <span className="text-xs font-bold text-blue-600">{scores[c.key]}</span>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {BAND_VALUES.map((v) => (
                      <button key={v} onClick={() => setScores((s) => ({ ...s, [c.key]: String(v) }))}
                        className={`w-10 h-8 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${scores[c.key] === String(v) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
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
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Feedback</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={6}
                placeholder="Comment on fluency, vocabulary range, grammar, and pronunciation. Give specific suggestions…"
                className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400" />
              <p className="text-xs text-slate-400 mt-1">{feedback.length} characters</p>
            </div>

            {submitErr && (
              <div className="rounded-xl px-4 py-3 text-xs font-medium mb-4" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>{submitErr}</div>
            )}

            <button onClick={submit} disabled={booking.status !== "scheduled" || avg === null || !feedback.trim() || submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm py-3 rounded-xl cursor-pointer transition-colors">
              {submitting ? "Submitting…" : "Submit Marks"}
            </button>
            {(avg === null || !feedback.trim()) && (
              <p className="text-xs text-slate-400 text-center mt-2">Score all four criteria and add feedback to submit</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
