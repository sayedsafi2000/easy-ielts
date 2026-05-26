"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import AntiCheatBanner from "@/components/AntiCheatBanner";

interface WTask {
  id: number;                    // task_number
  min: number;
  time: string;
  heading: string;
  instruction: string;
  prompt: string;
  note?: string;
  hasChart?: boolean;
  chartType?: string;
  chartImageUrl?: string | null;
}

function fmtTime(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function WritingTestInner() {
  const router = useRouter();
  const params = useSearchParams();
  const attemptId = params.get("attempt");
  const testId = params.get("test");

  const [tasks, setTasks] = useState<WTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [taskIdx, setTaskIdx] = useState(0);
  const [texts, setTexts] = useState<string[]>(["", ""]);
  const [secondsRemaining, setSecondsRemaining] = useState(60 * 60);
  const [submitting, setSubmitting] = useState(false);

  // Writing allows paste? IELTS computer-based test forbids it. We block
  // clipboard inside the test container too. Tab switch / blur / dev-tools
  // shortcuts are blocked everywhere.
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
          api.get<WTask[]>(`/api/test-content/${testId}/writing`),
          api.post<{ secondsRemaining: number }>("/api/test-sessions/start", { attempt_id: attemptId, module: "writing" }),
        ]);
        if (cancelled) return;
        setTasks(content);
        setTexts(content.map(() => ""));
        setSecondsRemaining(sess.secondsRemaining);
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
    if (!loading && !submitting && secondsRemaining === 0 && attemptId) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining]);

  function setText(val: string) {
    setTexts((arr) => arr.map((t, i) => (i === taskIdx ? val : t)));
  }

  async function handleSubmit() {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const writing_answers: Record<string, string> = {};
      tasks.forEach((t, i) => { writing_answers[`task${t.id}`] = texts[i] || ""; });
      const totalWords = texts.reduce((acc, t) => acc + wordCount(t), 0);
      await api.post("/api/test-sessions/submit", {
        attempt_id: attemptId,
        module: "writing",
        writing_answers,
        word_count: totalWords,
      });
      router.push(`/awaiting-review?type=single&module=writing&attemptId=${attemptId}`);
    } catch {
      setSubmitting(false);
      alert("Failed to submit — please try again.");
    }
  }
  handleSubmitRef.current = handleSubmit;

  const task = tasks[taskIdx];
  const currentText = texts[taskIdx] ?? "";
  const wc = wordCount(currentText);
  const wcMet = task ? wc >= task.min : false;
  const warn = secondsRemaining < 300;

  const headerStyle: React.CSSProperties = { background: "#fff", borderBottom: "2px solid #003d7c", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 };

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

  if (loading || !task) {
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
          <span style={{ fontWeight: 700, color: "#1a1a1a" }}>Writing Test</span>
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

      {/* Task tabs */}
      <div style={{ background: "#f8f8f8", borderBottom: "1px solid #c8c8c8", padding: "0 20px", display: "flex", flexShrink: 0 }}>
        {tasks.map((t, i) => (
          <button key={t.id} onClick={() => setTaskIdx(i)} style={{ padding: "9px 22px", fontSize: 13, fontWeight: taskIdx === i ? 700 : 400, background: taskIdx === i ? "#fff" : "transparent", borderTop: taskIdx === i ? "2px solid #005eb8" : "2px solid transparent", borderRight: "1px solid #c8c8c8", borderBottom: taskIdx === i ? "1px solid #fff" : "none", borderLeft: "none", cursor: "pointer", color: taskIdx === i ? "#003d7c" : "#555", marginBottom: taskIdx === i ? -1 : 0, display: "flex", alignItems: "center", gap: 10 }}>
            Task {t.id}
            <span style={{ fontSize: 11, padding: "1px 8px", background: wordCount(texts[i] ?? "") >= t.min ? "#d4edda" : "#f0f0f0", border: `1px solid ${wordCount(texts[i] ?? "") >= t.min ? "#28a745" : "#c8c8c8"}`, color: wordCount(texts[i] ?? "") >= t.min ? "#155724" : "#666" }}>
              {wordCount(texts[i] ?? "")}/{t.min}
            </span>
          </button>
        ))}
      </div>

      {/* Split pane */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Task prompt */}
        <div style={{ width: 380, overflowY: "auto", background: "#fff", borderRight: "1px solid #c8c8c8", padding: "24px 24px", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#003d7c", letterSpacing: "0.05em" }}>{task.heading}</div>
          <div style={{ fontSize: 13, color: "#333", marginBottom: 12, fontStyle: "italic" }}>{task.instruction}</div>

          <div style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.7, marginBottom: 16, whiteSpace: "pre-line" }}>{task.prompt}</div>

          {task.hasChart && task.chartImageUrl && (
            <div style={{ border: "1px solid #c8c8c8", padding: "8px", marginBottom: 16, background: "#fafafa", textAlign: "center" }}>
              <img
                src={task.chartImageUrl.startsWith("http") ? task.chartImageUrl : `${API_URL}${task.chartImageUrl}`}
                alt="Task 1 chart"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              {task.chartType && (
                <div style={{ fontSize: 11, color: "#777", marginTop: 6 }}>{task.chartType}</div>
              )}
            </div>
          )}

          {task.note && (
            <div style={{ border: "1px solid #c8c8c8", background: "#fffde7", padding: "8px 12px", fontSize: 13, color: "#333" }}>
              <strong>{task.note}</strong>
            </div>
          )}
        </div>

        {/* Writing area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 20px" }}>

          <div style={{ background: "#fff", border: "1px solid #c8c8c8", borderBottom: "none", padding: "6px 10px", display: "flex", gap: 2, flexShrink: 0 }}>
            {["Cut", "Copy", "Paste", "Undo", "Redo"].map((btn) => (
              <button key={btn} style={{ padding: "3px 12px", fontSize: 12, background: "#f8f8f8", border: "1px solid #c8c8c8", cursor: "pointer", color: "#1a1a1a" }}>
                {btn}
              </button>
            ))}
            <div style={{ width: 1, background: "#c8c8c8", margin: "0 6px" }} />
            <span style={{ fontSize: 11, color: "#888", alignSelf: "center" }}>No formatting available in exam mode</span>
          </div>

          <textarea
            value={currentText}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Type your Task ${task.id} response here...`}
            spellCheck={false}
            style={{ flex: 1, resize: "none", border: "1px solid #c8c8c8", padding: "14px 16px", fontSize: 14, fontFamily: "Arial, sans-serif", lineHeight: 1.7, color: "#1a1a1a", background: "#fff", outline: "none" }}
          />

          <div style={{ background: "#fff", border: "1px solid #c8c8c8", borderTop: "none", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: wcMet ? "#155724" : "#1a1a1a" }}>
                Word count: {wc}
              </span>
              <div style={{ width: 160, height: 8, background: "#e0e0e0", position: "relative" }}>
                <div style={{ width: `${Math.min((wc / task.min) * 100, 100)}%`, height: "100%", background: wcMet ? "#28a745" : "#005eb8", transition: "width 0.2s" }} />
              </div>
              <span style={{ fontSize: 12, color: "#555" }}>Minimum: {task.min} words</span>
              {wcMet && <span style={{ fontSize: 12, color: "#155724", fontWeight: 700 }}>✓ Minimum reached</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {taskIdx < tasks.length - 1 && (
                <button onClick={() => setTaskIdx(taskIdx + 1)} style={{ padding: "6px 18px", background: "#fff", border: "1px solid #c8c8c8", fontSize: 13, cursor: "pointer", color: "#1a1a1a" }}>
                  Next: Task {tasks[taskIdx + 1].id} ►
                </button>
              )}
              {taskIdx > 0 && (
                <button onClick={() => setTaskIdx(taskIdx - 1)} style={{ padding: "6px 18px", background: "#fff", border: "1px solid #c8c8c8", fontSize: 13, cursor: "pointer", color: "#1a1a1a" }}>
                  ◄ Task {tasks[taskIdx - 1].id}
                </button>
              )}
              <button onClick={handleSubmit} disabled={submitting} style={{ padding: "6px 18px", background: submitting ? "#ccc" : "#005eb8", border: "none", fontSize: 13, fontWeight: 700, cursor: submitting ? "default" : "pointer", color: "#fff" }}>
                {submitting ? "Submitting…" : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WritingTestPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f0f0f0", textAlign: "center", padding: 80, color: "#555", fontFamily: "Arial, sans-serif" }}>Loading…</div>}>
      <WritingTestInner />
    </Suspense>
  );
}
