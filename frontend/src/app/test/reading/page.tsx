"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import AntiCheatBanner from "@/components/AntiCheatBanner";

interface RQuestion {
  id: number;
  text?: string;
  pre?: string;
  suf?: string;
  opts?: string[];
}
interface RGroup {
  label: string;
  instruction: string;
  type: "tfng" | "mcq" | "fill";
  opts?: string[];
  questions: RQuestion[];
}
interface RPassage {
  id: number;
  title: string;
  range: string;
  text: string;
  groups: RGroup[];
}

function fmtTime(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function ReadingTestInner() {
  const router = useRouter();
  const params = useSearchParams();
  const attemptId = params.get("attempt");
  const testId = params.get("test");

  const [passages, setPassages] = useState<RPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [passIdx, setPassIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  const [secondsRemaining, setSecondsRemaining] = useState(60 * 60);
  const [submitting, setSubmitting] = useState(false);
  const dirtyRef = useRef(false);

  const handleSubmitRef = useRef<() => void>();
  const cheat = useAntiCheat({
    disabled: loading || !!loadError,
    blockClipboard:   true,
    blockContextMenu: true,
    blockDevtools:    true,
    violationLimit:   3,
    onLimit:          () => { handleSubmitRef.current?.(); },
  });

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
          api.get<RPassage[]>(`/api/test-content/${testId}/reading`),
          api.post<{ secondsRemaining: number; answers: Array<{ question_number: number; answer_value: string | null; flagged: boolean }> }>(
            "/api/test-sessions/start",
            { attempt_id: attemptId, module: "reading" }
          ),
        ]);
        if (cancelled) return;
        setPassages(content);
        setSecondsRemaining(sess.secondsRemaining);
        const a: Record<number, string> = {};
        const f: Record<number, boolean> = {};
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

  useEffect(() => {
    if (loading || loadError) return;
    const id = setInterval(() => setSecondsRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [loading, loadError]);

  useEffect(() => {
    if (!attemptId || loading || loadError) return;
    const id = setInterval(async () => {
      if (!dirtyRef.current) return;
      try {
        const res = await api.post<{ secondsRemaining: number }>("/api/test-sessions/save", {
          attempt_id: attemptId, module: "reading", answers, flagged,
        });
        setSecondsRemaining(res.secondsRemaining);
        dirtyRef.current = false;
      } catch { /* retry next tick */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [attemptId, answers, flagged, loading, loadError]);

  useEffect(() => {
    if (!loading && !submitting && secondsRemaining === 0 && attemptId) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining]);

  function setAns(id: number, val: string) {
    setAnswers((a) => ({ ...a, [id]: val }));
    dirtyRef.current = true;
  }
  function toggleFlag(id: number) {
    setFlagged((f) => ({ ...f, [id]: !f[id] }));
    dirtyRef.current = true;
  }

  async function handleSubmit() {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/api/test-sessions/submit", {
        attempt_id: attemptId, module: "reading", answers, flagged,
      });
      router.push(`/awaiting-review?type=single&module=reading&attemptId=${attemptId}`);
    } catch {
      setSubmitting(false);
      alert("Failed to submit — please try again.");
    }
  }
  handleSubmitRef.current = handleSubmit;

  const ALL_Q_IDS = passages.flatMap((p) => p.groups.flatMap((g) => g.questions.map((q) => q.id)));
  const answered = Object.keys(answers).filter((k) => (answers[+k] ?? "").toString().trim()).length;
  const passage = passages[passIdx];
  const warn = secondsRemaining < 300;

  const headerStyle: React.CSSProperties = { background: "#fff", borderBottom: "2px solid #003d7c", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 };
  const footerStyle: React.CSSProperties = { background: "#fff", borderTop: "2px solid #003d7c", padding: "10px 20px", flexShrink: 0 };
  const pBox = (ans: boolean, flag: boolean): React.CSSProperties => ({ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, background: flag ? "#d47600" : ans ? "#005eb8" : "#f0f0f0", color: (ans || flag) ? "#fff" : "#555", border: "1px solid #c8c8c8", cursor: "pointer" });

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", fontSize: 14, background: "#f0f0f0" }}>
        <div style={headerStyle}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#003d7c" }}>IELTS<span style={{ color: "#005eb8" }}>Pro</span></span>
          <Link href="/start-test" style={{ color: "#005eb8", fontSize: 13, textDecoration: "none" }}>← Back</Link>
        </div>
        <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: 24, background: "#fff", border: "1px solid #c8c8c8" }}>
          <p style={{ color: "#cc0000", fontWeight: 700, marginBottom: 12 }}>{loadError}</p>
          <Link href="/start-test" style={{ color: "#005eb8", textDecoration: "underline" }}>Start a test</Link>
        </div>
      </div>
    );
  }

  if (loading || !passage) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "Arial, sans-serif", background: "#f0f0f0" }}>
        <div style={headerStyle}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#003d7c" }}>IELTS<span style={{ color: "#005eb8" }}>Pro</span></span>
        </div>
        <div style={{ textAlign: "center", padding: 80, color: "#555" }}>Loading test…</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", fontSize: 14, background: "#f0f0f0" }}>

      <AntiCheatBanner
        open={cheat.warningOpen}
        violation={cheat.lastViolation}
        count={cheat.violationCount}
        limit={cheat.violationLimit}
        onDismiss={cheat.dismissWarning}
      />

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#003d7c" }}>IELTS<span style={{ color: "#005eb8" }}>Pro</span></span>
          <span style={{ color: "#c8c8c8" }}>│</span>
          <span style={{ fontWeight: 700, color: "#1a1a1a" }}>Reading Test</span>
          <span style={{ background: "#e8f0ff", border: "1px solid #b0c4ee", color: "#003d7c", fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>ACADEMIC</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: warn ? "#cc0000" : "#1a1a1a" }}>
            Time Remaining: <span style={{ fontFamily: "monospace", fontSize: 15 }}>{fmtTime(secondsRemaining)}</span>
          </span>
          <span style={{ fontSize: 12, color: "#555" }}>Answered: <strong>{answered}</strong> / 40</span>
          <button onClick={handleSubmit} disabled={submitting} style={{ background: "#005eb8", color: "#fff", padding: "6px 18px", fontSize: 13, fontWeight: 700, border: "none", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Submitting…" : "Submit Test"}
          </button>
        </div>
      </div>

      {/* Passage tabs */}
      <div style={{ background: "#f8f8f8", borderBottom: "1px solid #c8c8c8", padding: "0 20px", display: "flex", flexShrink: 0 }}>
        {passages.map((p, i) => (
          <button key={p.id} onClick={() => setPassIdx(i)} style={{ padding: "9px 22px", fontSize: 13, fontWeight: passIdx === i ? 700 : 400, background: passIdx === i ? "#fff" : "transparent", borderTop: passIdx === i ? "2px solid #005eb8" : "2px solid transparent", borderRight: "1px solid #c8c8c8", borderBottom: passIdx === i ? "1px solid #fff" : "none", borderLeft: "none", cursor: "pointer", color: passIdx === i ? "#003d7c" : "#555", marginBottom: passIdx === i ? -1 : 0 }}>
            Passage {p.id} &nbsp;·&nbsp; Q {p.range}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#777", alignSelf: "center", paddingRight: 8, fontStyle: "italic" }}>{passage.title}</span>
      </div>

      {/* Split pane */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Passage text */}
        <div style={{ flex: 1, overflowY: "auto", background: "#fff", borderRight: "1px solid #c8c8c8", padding: "28px 32px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#1a1a1a", borderBottom: "1px solid #e0e0e0", paddingBottom: 12 }}>{passage.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: "#1a1a1a", whiteSpace: "pre-line" }}>{passage.text}</div>
        </div>

        {/* Questions */}
        <div style={{ width: 420, overflowY: "auto", background: "#fafafa", padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16, color: "#1a1a1a", borderBottom: "1px solid #e0e0e0", paddingBottom: 10 }}>
            Questions {passage.range}
          </div>

          {passage.groups.map((group) => (
            <div key={group.label} style={{ border: "1px solid #c8c8c8", marginBottom: 16, padding: "14px 16px", background: "#fff" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{group.label}</div>
              <div style={{ fontSize: 13, fontStyle: "italic", marginBottom: 14, borderLeft: "3px solid #005eb8", paddingLeft: 10, background: "#f0f6ff", padding: "8px 12px", color: "#333", whiteSpace: "pre-line" as const }}>{group.instruction}</div>

              {group.questions.map((q) => (
                <div key={q.id} style={{ marginBottom: 18 }}>
                  {group.type === "tfng" ? (
                    <>
                      <div style={{ marginBottom: 8, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, marginRight: 6 }}>{q.id}.</span>{q.text}
                      </div>
                      <div style={{ display: "flex", gap: 10, marginLeft: 20, flexWrap: "wrap" }}>
                        {(group.opts || []).map((opt) => (
                          <label key={opt} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 13, background: answers[q.id] === opt ? "#e8f0ff" : "#f8f8f8", border: `1px solid ${answers[q.id] === opt ? "#005eb8" : "#c8c8c8"}`, padding: "4px 12px" }}>
                            <input type="radio" name={`q${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAns(q.id, opt)} style={{ cursor: "pointer" }} />
                            {opt}
                          </label>
                        ))}
                      </div>
                      <button onClick={() => toggleFlag(q.id)} style={{ background: flagged[q.id] ? "#fff3cd" : "none", border: `1px solid ${flagged[q.id] ? "#d47600" : "#c8c8c8"}`, padding: "2px 8px", fontSize: 11, cursor: "pointer", color: flagged[q.id] ? "#d47600" : "#666", marginTop: 6, marginLeft: 20 }}>
                        {flagged[q.id] ? "★ Flagged for review" : "☆ Flag for review"}
                      </button>
                    </>
                  ) : group.type === "mcq" ? (
                    <>
                      <div style={{ marginBottom: 6, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, marginRight: 6 }}>{q.id}.</span>{q.text}
                      </div>
                      {(q.opts || []).map((opt) => (
                        <label key={opt} style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "6px 0 0 20px", cursor: "pointer" }}>
                          <input type="radio" name={`q${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAns(q.id, opt)} style={{ marginTop: 3, cursor: "pointer", flexShrink: 0 }} />
                          <span style={{ color: "#1a1a1a", lineHeight: 1.45, cursor: "pointer" }}>{opt}</span>
                        </label>
                      ))}
                      <button onClick={() => toggleFlag(q.id)} style={{ background: flagged[q.id] ? "#fff3cd" : "none", border: `1px solid ${flagged[q.id] ? "#d47600" : "#c8c8c8"}`, padding: "2px 8px", fontSize: 11, cursor: "pointer", color: flagged[q.id] ? "#d47600" : "#666", marginTop: 6, marginLeft: 20 }}>
                        {flagged[q.id] ? "★ Flagged for review" : "☆ Flag for review"}
                      </button>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 700 }}>{q.id}.</span>
                      {q.pre && <span style={{ color: "#1a1a1a" }}>{q.pre}</span>}
                      <input type="text" value={answers[q.id] ?? ""} onChange={(e) => setAns(q.id, e.target.value)} style={{ border: "1px solid #888", padding: "3px 6px", fontSize: 13, fontFamily: "Arial, sans-serif", width: 150 }} />
                      {q.suf && <span style={{ color: "#1a1a1a" }}>{q.suf}</span>}
                      <button onClick={() => toggleFlag(q.id)} style={{ background: flagged[q.id] ? "#fff3cd" : "none", border: `1px solid ${flagged[q.id] ? "#d47600" : "#c8c8c8"}`, padding: "2px 8px", fontSize: 11, cursor: "pointer", color: flagged[q.id] ? "#d47600" : "#666" }}>
                        {flagged[q.id] ? "★" : "☆ Flag"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", gap: 14, marginBottom: 8, fontSize: 11, color: "#555", alignItems: "center" }}>
              <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f0f0f0", border: "1px solid #c8c8c8", verticalAlign: "middle", marginRight: 4 }} />Not answered</span>
              <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#005eb8", verticalAlign: "middle", marginRight: 4 }} />Answered</span>
              <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#d47600", verticalAlign: "middle", marginRight: 4 }} />Flagged for review</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {ALL_Q_IDS.map((n) => <div key={n} style={pBox(!!(answers[n] ?? "").toString().trim(), !!flagged[n])}>{n}</div>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPassIdx((i) => Math.max(0, i - 1))} disabled={passIdx === 0} style={{ padding: "7px 22px", background: "#fff", border: "1px solid #c8c8c8", fontSize: 13, cursor: passIdx === 0 ? "default" : "pointer", color: passIdx === 0 ? "#aaa" : "#1a1a1a", opacity: passIdx === 0 ? 0.5 : 1 }}>◄ Previous</button>
            {passIdx < passages.length - 1
              ? <button onClick={() => setPassIdx((i) => i + 1)} style={{ padding: "7px 22px", background: "#005eb8", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff" }}>Next ►</button>
              : <button onClick={handleSubmit} disabled={submitting} style={{ padding: "7px 22px", background: submitting ? "#ccc" : "#005eb8", border: "none", fontSize: 13, fontWeight: 700, cursor: submitting ? "default" : "pointer", color: "#fff" }}>{submitting ? "Submitting…" : "Submit ►"}</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReadingTestPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f0f0f0", textAlign: "center", padding: 80, color: "#555", fontFamily: "Arial, sans-serif" }}>Loading…</div>}>
      <ReadingTestInner />
    </Suspense>
  );
}
