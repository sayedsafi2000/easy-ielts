"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import AntiCheatBanner from "@/components/AntiCheatBanner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LQuestion {
  id: number;
  text?: string;
  prefix?: string;
  suffix?: string;
  opts?: string[];
}
interface LGroup {
  label: string;
  instruction: string;
  type: "mcq" | "form" | "matching";
  formTitle?: string;
  matchOpts?: string[];
  questions: LQuestion[];
}
interface LSection {
  id: number;
  range: string;
  context: string;
  audioLabel: string;
  audioDuration: string;
  audioUrl?: string;
  groups: LGroup[];
}

type Answers = Record<number, string>;
type Flagged = Record<number, boolean>;

// ─── Styles (UNCHANGED from original British-Council look) ────────────────────
const S = {
  page:    { minHeight: "100vh", background: "#f0f0f0", fontFamily: "Arial, sans-serif", fontSize: 14 },
  header:  { background: "#fff", borderBottom: "2px solid #003d7c", padding: "10px 24px", display: "flex" as const, alignItems: "center" as const, justifyContent: "space-between" as const, position: "sticky" as const, top: 0, zIndex: 100 },
  subbar:  { background: "#f8f8f8", borderBottom: "1px solid #c8c8c8", padding: "6px 24px", display: "flex" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  content: { maxWidth: 860, margin: "0 auto", padding: "24px 24px 200px" },
  panel:   { background: "#fff", border: "1px solid #c8c8c8", marginBottom: 20, padding: "16px 20px" },
  instrLbl:{ fontWeight: 700 as const, fontSize: 13, marginBottom: 4, color: "#1a1a1a" },
  instr:   { fontSize: 13, fontStyle: "italic" as const, marginBottom: 16, color: "#333", borderLeft: "3px solid #005eb8", paddingLeft: 10, background: "#f0f6ff", padding: "8px 12px" },
  qBlock:  { marginBottom: 18 },
  qNum:    { fontWeight: 700 as const, color: "#1a1a1a", marginRight: 6 },
  qText:   { color: "#1a1a1a", lineHeight: 1.5 as const },
  optRow:  { display: "flex" as const, alignItems: "flex-start" as const, gap: 8, margin: "6px 0 0 24px", cursor: "pointer" as const },
  input:   { border: "1px solid #888", padding: "3px 6px", fontSize: 13, width: 180, fontFamily: "Arial, sans-serif" },
  flagBtn: { background: "none", border: "1px solid #c8c8c8", padding: "2px 10px", fontSize: 11, cursor: "pointer" as const, color: "#555", marginTop: 6, marginLeft: 24 },
  flagBtnActive: { background: "#fff3cd", border: "1px solid #d47600", color: "#d47600" },
  footer:  { position: "fixed" as const, bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "2px solid #003d7c", padding: "10px 24px", zIndex: 100 },
  palette: { display: "flex" as const, flexWrap: "wrap" as const, gap: 3, marginBottom: 8 },
  pBox:    (answered: boolean, flagged: boolean, current: boolean) => ({
    width: 26, height: 26, display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
    fontSize: 11, fontWeight: 600 as const, cursor: "pointer" as const,
    background: flagged ? "#d47600" : answered ? "#005eb8" : "#f0f0f0",
    color: (answered || flagged) ? "#fff" : "#555",
    border: current ? "2px solid #003d7c" : "1px solid #c8c8c8",
  }),
  prevBtn: (disabled: boolean) => ({ padding: "7px 22px", background: "#fff", border: "1px solid #c8c8c8", fontSize: 13, cursor: disabled ? "default" as const : "pointer" as const, color: disabled ? "#aaa" : "#1a1a1a", opacity: disabled ? 0.5 : 1 }),
  nextBtn: (disabled: boolean) => ({ padding: "7px 22px", background: disabled ? "#ccc" : "#005eb8", border: "none", fontSize: 13, fontWeight: 700 as const, cursor: disabled ? "default" as const : "pointer" as const, color: "#fff", opacity: disabled ? 0.6 : 1 }),
  logo:    { fontWeight: 800 as const, fontSize: 16, color: "#003d7c", letterSpacing: "-0.03em" },
};

function fmtTime(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Inner component (uses search params) ────────────────────────────────────
function ListeningTestInner() {
  const router = useRouter();
  const params = useSearchParams();
  const attemptId = params.get("attempt");
  const testId = params.get("test");

  const [sections, setSections] = useState<LSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");

  const [secIdx, setSecIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [flagged, setFlagged] = useState<Flagged>({});
  const [missedWarning, setMissedWarning] = useState<number[] | null>(null);
  const [audioProgress] = useState(32);

  const [secondsRemaining, setSecondsRemaining] = useState(30 * 60);
  const [submitting, setSubmitting] = useState(false);
  const dirtyRef = useRef(false);

  // Anti-cheat: tab switch / blur / clipboard / context menu / devtools.
  // After 3 violations the test auto-submits.
  const cheat = useAntiCheat({
    disabled: loading || !!loadError,
    blockClipboard:   true,
    blockContextMenu: true,
    blockDevtools:    true,
    violationLimit:   3,
    onLimit:          () => { handleSubmitRef.current?.(); },
  });
  const handleSubmitRef = useRef<() => void>();

  // Load test content + start session
  useEffect(() => {
    if (!attemptId || !testId) {
      setLoadError("Missing test or attempt parameters. Please start the test from the dashboard.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [content, sess] = await Promise.all([
          api.get<LSection[]>(`/api/test-content/${testId}/listening`),
          api.post<{ secondsRemaining: number; answers: Array<{ question_number: number; answer_value: string | null; flagged: boolean }> }>(
            "/api/test-sessions/start",
            { attempt_id: attemptId, module: "listening" }
          ),
        ]);
        if (cancelled) return;
        setSections(content);
        setSecondsRemaining(sess.secondsRemaining);
        const a: Answers = {};
        const f: Flagged = {};
        for (const r of sess.answers || []) {
          if (r.answer_value !== null && r.answer_value !== undefined) a[r.question_number] = r.answer_value;
          if (r.flagged) f[r.question_number] = true;
        }
        setAnswers(a);
        setFlagged(f);
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || "Failed to load test.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attemptId, testId]);

  // Server-side timer countdown
  useEffect(() => {
    if (loading || loadError) return;
    const id = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [loading, loadError]);

  // Auto-save every 30s when dirty
  useEffect(() => {
    if (!attemptId || loading || loadError) return;
    const id = setInterval(async () => {
      if (!dirtyRef.current) return;
      try {
        const res = await api.post<{ secondsRemaining: number }>("/api/test-sessions/save", {
          attempt_id: attemptId, module: "listening", answers, flagged,
        });
        setSecondsRemaining(res.secondsRemaining);
        dirtyRef.current = false;
      } catch { /* swallow — we'll retry next tick */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [attemptId, answers, flagged, loading, loadError]);

  // Auto-submit at 0 seconds
  useEffect(() => {
    if (!loading && !submitting && secondsRemaining === 0 && attemptId) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining]);

  function setAnswer(id: number, val: string) {
    setAnswers((a) => ({ ...a, [id]: val }));
    dirtyRef.current = true;
  }
  function toggleFlag(id: number) {
    setFlagged((f) => ({ ...f, [id]: !f[id] }));
    dirtyRef.current = true;
  }

  const ALL_Q_IDS = sections.flatMap((s) => s.groups.flatMap((g) => g.questions.map((q) => q.id)));
  const answered = Object.keys(answers).filter((k) => (answers[+k] ?? "").toString().trim()).length;
  const section = sections[secIdx];
  const warn = secondsRemaining < 300;

  function getMissedInSection(idx: number): number[] {
    if (!sections[idx]) return [];
    const ids = sections[idx].groups.flatMap((g) => g.questions.map((q) => q.id));
    return ids.filter((id) => !answers[id] || (answers[id] as string).trim() === "");
  }

  function handleNext() {
    const missed = getMissedInSection(secIdx);
    if (missed.length > 0) setMissedWarning(missed);
    else setSecIdx((i) => i + 1);
  }
  function confirmNext() { setMissedWarning(null); setSecIdx((i) => i + 1); }

  async function handleSubmit() {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/api/test-sessions/submit", {
        attempt_id: attemptId, module: "listening", answers, flagged,
      });
      router.push(`/awaiting-review?type=single&module=listening&attemptId=${attemptId}`);
    } catch (e) {
      setSubmitting(false);
      alert("Failed to submit — please try again.");
    }
  }
  handleSubmitRef.current = handleSubmit;

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <span style={S.logo}>IELTS<span style={{ color: "#005eb8" }}>Pro</span></span>
          <Link href="/start-test" style={{ color: "#005eb8", fontSize: 13, textDecoration: "none" }}>← Back</Link>
        </div>
        <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: 24, background: "#fff", border: "1px solid #c8c8c8" }}>
          <p style={{ color: "#cc0000", fontWeight: 700, marginBottom: 12 }}>{loadError}</p>
          <Link href="/start-test" style={{ color: "#005eb8", textDecoration: "underline" }}>Start a test</Link>
        </div>
      </div>
    );
  }

  if (loading || !section) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <span style={S.logo}>IELTS<span style={{ color: "#005eb8" }}>Pro</span></span>
        </div>
        <div style={{ textAlign: "center", padding: 80, color: "#555" }}>Loading test…</div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <AntiCheatBanner
        open={cheat.warningOpen}
        violation={cheat.lastViolation}
        count={cheat.violationCount}
        limit={cheat.violationLimit}
        onDismiss={cheat.dismissWarning}
      />
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={S.logo}>IELTS<span style={{ color: "#005eb8" }}>Pro</span></span>
          <span style={{ color: "#c8c8c8" }}>│</span>
          <span style={{ fontWeight: 700, color: "#1a1a1a" }}>Listening Test</span>
          <span style={{ background: "#e8f0ff", border: "1px solid #b0c4ee", color: "#003d7c", fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>ACADEMIC</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: warn ? "#cc0000" : "#1a1a1a" }}>
            Time Remaining: <span style={{ fontFamily: "monospace", fontSize: 15 }}>{fmtTime(secondsRemaining)}</span>
          </span>
          <button onClick={handleSubmit} disabled={submitting} style={{ background: "#005eb8", color: "#fff", padding: "6px 18px", fontSize: 13, fontWeight: 700, border: "none", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Submitting…" : "Submit Test"}
          </button>
        </div>
      </div>

      {/* Sub bar */}
      <div style={S.subbar}>
        <span style={{ fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>
          Section {section.id} of {sections.length} &nbsp;—&nbsp; Questions {section.range}
        </span>
        <span style={{ fontSize: 12, color: "#575757" }}>
          Questions answered: <strong>{answered}</strong> / 40
        </span>
      </div>

      {/* Content */}
      <div style={S.content}>
        <p style={{ fontSize: 13, fontStyle: "italic", color: "#333", marginBottom: 16, lineHeight: 1.6 }}>{section.context}</p>

        {/* Audio player */}
        <div style={{ background: "#fff", border: "1px solid #c8c8c8", padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#005eb8", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="11" height="13" fill="white" viewBox="0 0 11 13"><path d="M0 0l11 6.5L0 13V0z" /></svg>
          </div>
          <span style={{ fontSize: 12, color: "#555", width: 72, flexShrink: 0 }}>{section.audioLabel}</span>
          {section.audioUrl ? (
            <audio
              key={section.audioUrl}
              src={section.audioUrl.startsWith("http") ? section.audioUrl : `${API_URL}${section.audioUrl}`}
              controls
              style={{ flex: 1, height: 30 }}
            />
          ) : (
            <>
              <div style={{ flex: 1, height: 5, background: "#e0e0e0", position: "relative" }}>
                <div style={{ width: `${audioProgress}%`, height: "100%", background: "#005eb8" }} />
              </div>
              <span style={{ fontSize: 12, color: "#555", flexShrink: 0 }}>{section.audioDuration}</span>
              <span style={{ fontSize: 11, color: "#888", fontStyle: "italic", flexShrink: 0 }}>Audio plays automatically in exam</span>
            </>
          )}
        </div>

        {/* Question groups */}
        {section.groups.map((group) => (
          <div key={group.label} style={S.panel}>
            <div style={S.instrLbl}>{group.label}</div>
            <div style={S.instr}>{group.instruction}</div>

            {group.type === "form" && group.formTitle && (
              <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, marginBottom: 14, borderBottom: "1px solid #c8c8c8", paddingBottom: 10 }}>
                {group.formTitle}
              </div>
            )}

            {group.questions.map((q) => (
              <div key={q.id} style={S.qBlock}>
                {group.type === "mcq" ? (
                  <>
                    <div>
                      <span style={S.qNum}>{q.id}.</span>
                      <span style={S.qText}>{q.text}</span>
                    </div>
                    {(q.opts || []).map((opt) => (
                      <label key={opt} style={S.optRow}>
                        <input
                          type="radio" name={`q${q.id}`} value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswer(q.id, opt)}
                          style={{ marginTop: 2, cursor: "pointer" }}
                        />
                        <span style={{ ...S.qText, cursor: "pointer" }}>{opt}</span>
                      </label>
                    ))}
                    <button onClick={() => toggleFlag(q.id)} style={{ ...(flagged[q.id] ? S.flagBtnActive : S.flagBtn) }}>
                      {flagged[q.id] ? "★ Flagged for review" : "☆ Flag for review"}
                    </button>
                  </>
                ) : group.type === "matching" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <span style={S.qNum}>{q.id}.</span>
                    <span style={S.qText}>{q.text}</span>
                    <select
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      style={{ border: "1px solid #888", padding: "3px 6px", fontSize: 13, fontFamily: "Arial, sans-serif", cursor: "pointer" }}
                    >
                      <option value="">— Select —</option>
                      {(group.matchOpts || []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <button onClick={() => toggleFlag(q.id)} style={{ ...(flagged[q.id] ? S.flagBtnActive : S.flagBtn), marginTop: 0, marginLeft: 0 }}>
                      {flagged[q.id] ? "★ Flagged" : "☆ Flag"}
                    </button>
                  </div>
                ) : (
                  /* form / fill-in */
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                    <span style={S.qNum}>{q.id}.</span>
                    {q.prefix && <span style={S.qText}>{q.prefix}</span>}
                    <input
                      type="text"
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      style={S.input}
                    />
                    {q.suffix && <span style={S.qText}>{q.suffix}</span>}
                    <button onClick={() => toggleFlag(q.id)} style={{ ...(flagged[q.id] ? S.flagBtnActive : S.flagBtn), marginTop: 0, marginLeft: 0 }}>
                      {flagged[q.id] ? "★ Flagged" : "☆ Flag"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <div style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 11, color: "#555", alignItems: "center" }}>
          <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f0f0f0", border: "1px solid #c8c8c8", verticalAlign: "middle", marginRight: 4 }} />Not answered</span>
          <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#005eb8", verticalAlign: "middle", marginRight: 4 }} />Answered</span>
          <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#d47600", verticalAlign: "middle", marginRight: 4 }} />Flagged for review</span>
        </div>
        <div style={S.palette}>
          {ALL_Q_IDS.map((n) => (
            <div key={n} style={S.pBox(!!(answers[n] ?? "").toString().trim(), !!flagged[n], false)}>{n}</div>
          ))}
        </div>

        {missedWarning && (
          <div style={{ background: "#fff3cd", border: "1px solid #d47600", padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
            <div style={{ fontSize: 13, color: "#7a4000" }}>
              <strong>Warning:</strong> You have not answered Question{missedWarning.length > 1 ? "s" : ""}{" "}
              <strong>{missedWarning.join(", ")}</strong> in this section. Do you want to go back and answer {missedWarning.length > 1 ? "them" : "it"}, or continue to the next section?
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setMissedWarning(null)} style={{ padding: "5px 14px", background: "#fff", border: "1px solid #d47600", fontSize: 12, cursor: "pointer", color: "#7a4000", fontWeight: 700 }}>← Go back</button>
              <button onClick={confirmNext} style={{ padding: "5px 14px", background: "#d47600", border: "none", fontSize: 12, cursor: "pointer", color: "#fff", fontWeight: 700 }}>Continue anyway ►</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <button onClick={() => { setMissedWarning(null); setSecIdx((i) => Math.max(0, i - 1)); }} disabled={secIdx === 0} style={S.prevBtn(secIdx === 0)}>◄ Previous</button>
          {secIdx < sections.length - 1
            ? <button onClick={handleNext} style={S.nextBtn(false)}>Next ►</button>
            : <button onClick={handleSubmit} disabled={submitting} style={S.nextBtn(submitting)}>{submitting ? "Submitting…" : "Submit ►"}</button>
          }
        </div>
      </div>
    </div>
  );
}

export default function ListeningTestPage() {
  return (
    <Suspense fallback={<div style={S.page}><div style={{ textAlign: "center", padding: 80, color: "#555" }}>Loading…</div></div>}>
      <ListeningTestInner />
    </Suspense>
  );
}
