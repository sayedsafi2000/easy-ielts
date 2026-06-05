"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface SPart {
  num: number;
  title: string;
  duration?: string;
  desc?: string;
  sampleQ: string[];
}

const CRITERIA = [
  { label: "Fluency & Coherence", desc: "How smoothly and naturally you speak, and how well your ideas connect." },
  { label: "Lexical Resource", desc: "Your range of vocabulary and how accurately and flexibly you use it." },
  { label: "Grammatical Range & Accuracy", desc: "The variety and correctness of your grammar structures." },
  { label: "Pronunciation", desc: "How clearly and accurately you produce sounds and stress patterns." },
];

const TIPS = [
  "Test your camera and microphone at least 10 minutes before the session.",
  "Find a quiet room with good lighting facing your face.",
  "Have a glass of water nearby.",
  "Speak at a natural pace — clarity matters more than speed.",
  "You may ask the examiner to repeat a question once if needed.",
];

function SpeakingInner() {
  const params = useSearchParams();
  const testId = params.get("test");

  const [parts, setParts] = useState<SPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [booking, setBooking] = useState<any | null>(null);

  useEffect(() => {
    const order: Record<string, number> = { scheduled: 0, time_proposed: 1, assigned: 2, requested: 3 };
    api.get<any[]>("/api/bookings")
      .then((list) => {
        const active = (list ?? [])
          .filter((b) => order[b.status] !== undefined)
          .sort((a, b) => order[a.status] - order[b.status])[0] || null;
        setBooking(active);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!testId) { setLoading(false); return; }
    let cancelled = false;
    api.get<SPart[]>(`/api/test-content/${testId}/speaking`)
      .then((d) => { if (!cancelled) setParts(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [testId]);

  const headerStyle: React.CSSProperties = {
    background: "#fff",
    borderBottom: "2px solid #003d7c",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", fontSize: 14, background: "#f0f0f0" }}>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#003d7c" }}>IELTS<span style={{ color: "#005eb8" }}>Pro</span></span>
          <span style={{ color: "#c8c8c8" }}>│</span>
          <span style={{ fontWeight: 700, color: "#1a1a1a" }}>Speaking Test</span>
          <span style={{ background: "#e8f0ff", border: "1px solid #b0c4ee", color: "#003d7c", fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>ACADEMIC</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/dashboard" style={{ color: "#005eb8", fontSize: 13, textDecoration: "none" }}>
            ← Return to Dashboard
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px", width: "100%" }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#003d7c", marginBottom: 4 }}>SPEAKING MODULE</div>
          <div style={{ fontSize: 13, color: "#555" }}>
            The Speaking test is a face-to-face interview with a certified IELTS examiner conducted via video call. It lasts approximately 11–14 minutes.
          </div>
        </div>

        {/* Booking status panel — wired to the real booking */}
        <div style={{ background: "#fff", border: "1px solid #c8c8c8", marginBottom: 20 }}>
          <div style={{ background: "#003d7c", padding: "8px 16px" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>YOUR SESSION</span>
          </div>

          {!booking ? (
            <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ fontSize: 13, color: "#555" }}>You haven&apos;t booked a speaking session yet.</div>
              <Link href="/dashboard/book-speaking" style={{ padding: "7px 18px", background: "#003d7c", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                Book a session
              </Link>
            </div>
          ) : (() => {
            const when = booking.status === "time_proposed" && booking.proposed_at ? booking.proposed_at : booking.scheduled_at;
            const whenStr = when ? new Date(when).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
            const badge: Record<string, { text: string; bg: string; border: string; color: string }> = {
              requested:     { text: "AWAITING ASSIGNMENT", bg: "#fff3cd", border: "#ffc107", color: "#7a6000" },
              assigned:      { text: "EXAMINER REVIEWING",   bg: "#e8f0ff", border: "#005eb8", color: "#003d7c" },
              time_proposed: { text: "NEW TIME PROPOSED",    bg: "#efe7ff", border: "#8f69f7", color: "#6a45d0" },
              scheduled:     { text: "✓ CONFIRMED",          bg: "#d4edda", border: "#28a745", color: "#155724" },
            };
            const b = badge[booking.status] ?? { text: booking.status.toUpperCase(), bg: "#eee", border: "#999", color: "#555" };
            return (
              <>
                <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
                      {booking.status === "time_proposed" ? "Proposed date & time" : "Scheduled date & time"}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{whenStr}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                      <span style={{ display: "inline-block", background: b.bg, border: `1px solid ${b.border}`, color: b.color, padding: "1px 8px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>
                        {b.text}
                      </span>
                      {booking.examiner?.full_name ? `Examiner: ${booking.examiner.full_name}` : "Examiner: to be assigned"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Link href="/dashboard/book-speaking" style={{ padding: "7px 18px", background: "#fff", border: "1px solid #c8c8c8", fontSize: 13, color: "#333", textDecoration: "none", display: "inline-block" }}>
                      Manage Booking
                    </Link>
                    {booking.status === "scheduled" && booking.join_url ? (
                      <a href={booking.join_url} target="_blank" rel="noreferrer" style={{ padding: "7px 18px", background: "#28a745", border: "none", fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", display: "inline-block" }}>
                        Join Call
                      </a>
                    ) : (
                      <button disabled style={{ padding: "7px 18px", background: "#c8c8c8", border: "none", fontSize: 13, fontWeight: 700, color: "#888", cursor: "not-allowed" }}>
                        {booking.status === "scheduled" ? "Link pending" : "Join Call"}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #c8c8c8", padding: "10px 20px", background: "#fffde7", fontSize: 12, color: "#666" }}>
                  <strong style={{ color: "#333" }}>Note:</strong>{" "}
                  {booking.status === "time_proposed"
                    ? "Your examiner proposed a new time. Go to Manage Booking to confirm or decline it."
                    : booking.status === "scheduled"
                    ? `This is a live ${booking.provider === "zoom" ? "Zoom" : "Google Meet"} call. Use the Join Call button at your scheduled time. Ensure your camera and microphone work beforehand.`
                    : "An admin will assign an examiner who confirms your time or proposes a new one. You'll be notified."}
                </div>
              </>
            );
          })()}
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          <div style={{ flex: 1 }}>

            {/* Test structure */}
            <div style={{ background: "#fff", border: "1px solid #c8c8c8", marginBottom: 20 }}>
              <div style={{ background: "#003d7c", padding: "8px 16px" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>TEST STRUCTURE</span>
              </div>
              {loading ? (
                <div style={{ padding: 20, color: "#777", fontSize: 13 }}>Loading parts…</div>
              ) : parts.length === 0 ? (
                <div style={{ padding: 20, color: "#777", fontSize: 13 }}>
                  No structure available yet. Speaking content will appear here once the test is set up.
                </div>
              ) : parts.map((part, i) => (
                <div key={part.num} style={{ borderBottom: i < parts.length - 1 ? "1px solid #c8c8c8" : "none" }}>
                  <button
                    onClick={() => setExpanded(expanded === part.num ? null : part.num)}
                    style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 28, height: 28, background: "#005eb8", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {part.num}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>{part.title}</div>
                        {part.duration && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{part.duration}</div>}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#555" }}>{expanded === part.num ? "▲" : "▼"}</span>
                  </button>

                  {expanded === part.num && (
                    <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #efefef" }}>
                      {part.desc && (
                        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, marginBottom: 12, paddingTop: 12 }}>
                          {part.desc}
                        </div>
                      )}
                      {part.sampleQ.length > 0 && (
                        <div style={{ background: "#f8f8f8", border: "1px solid #c8c8c8", padding: "10px 14px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#003d7c", marginBottom: 8, letterSpacing: "0.04em" }}>SAMPLE QUESTIONS</div>
                          {part.sampleQ.map((q, qi) => (
                            <div key={qi} style={{ fontSize: 13, color: "#333", lineHeight: 1.6, marginBottom: qi < part.sampleQ.length - 1 ? 6 : 0, paddingLeft: 12, borderLeft: "3px solid #005eb8" }}>
                              {q}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Marking criteria */}
            <div style={{ background: "#fff", border: "1px solid #c8c8c8" }}>
              <div style={{ background: "#003d7c", padding: "8px 16px" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>MARKING CRITERIA</span>
              </div>
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {CRITERIA.map((c) => (
                  <div key={c.label} style={{ border: "1px solid #c8c8c8", padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#003d7c", marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #c8c8c8", padding: "10px 16px", fontSize: 12, color: "#555" }}>
                Each criterion is scored from Band 1–9. Your overall Speaking band is the average of the four scores.
              </div>
            </div>
          </div>

          <div style={{ width: 260, flexShrink: 0 }}>

            <div style={{ background: "#fff", border: "1px solid #c8c8c8", marginBottom: 16 }}>
              <div style={{ background: "#003d7c", padding: "8px 16px" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>BEFORE YOUR SESSION</span>
              </div>
              <div style={{ padding: 14 }}>
                {TIPS.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#333", lineHeight: 1.6, marginBottom: i < TIPS.length - 1 ? 10 : 0 }}>
                    <span style={{ color: "#005eb8", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #c8c8c8", marginBottom: 16 }}>
              <div style={{ background: "#555", padding: "8px 16px" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>TECHNICAL REQUIREMENTS</span>
              </div>
              <div style={{ padding: 14 }}>
                {[
                  ["Webcam", "Required"],
                  ["Microphone", "Required"],
                  ["Browser", "Chrome / Firefox"],
                  ["Connection", "Stable broadband"],
                  ["Environment", "Quiet room"],
                ].map(([item, req]) => (
                  <div key={item} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#333", borderBottom: "1px solid #f0f0f0", padding: "6px 0" }}>
                    <span style={{ color: "#555" }}>{item}</span>
                    <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: "1px solid #c8c8c8", background: "#fffde7", padding: "12px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#333", marginBottom: 8 }}>IMPORTANT RULES</div>
              {[
                "Do not read from prepared notes during the test.",
                "The session will be recorded for quality assurance.",
                "Cancellations must be made at least 24 hours in advance.",
              ].map((rule, i) => (
                <div key={i} style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: i < 2 ? 6 : 0 }}>
                  · {rule}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Band descriptors */}
        <div style={{ background: "#fff", border: "1px solid #c8c8c8", marginTop: 20 }}>
          <div style={{ background: "#003d7c", padding: "8px 16px" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>BAND SCORE GUIDE — SPEAKING</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8f8f8" }}>
                  {["Band", "Level", "Description"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", borderBottom: "1px solid #c8c8c8", fontWeight: 700, color: "#003d7c", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["9", "Expert", "Speaks fluently with only rare minor slips. Handles any topic with ease."],
                  ["8", "Very Good", "Maintains a high degree of fluency and accuracy. Only occasional inaccuracies."],
                  ["7", "Good", "Some limitations in unfamiliar topics. Generally accurate with good range."],
                  ["6", "Competent", "Effective communication despite some inaccuracies and repetition."],
                  ["5", "Modest", "Basic communication on familiar topics. Noticeable errors."],
                  ["4", "Limited", "Restricted to familiar situations. Frequent breakdowns in communication."],
                ].map(([band, level, desc], i) => (
                  <tr key={band} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "8px 14px", borderBottom: "1px solid #efefef", fontWeight: 700, color: "#005eb8" }}>{band}</td>
                    <td style={{ padding: "8px 14px", borderBottom: "1px solid #efefef", fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>{level}</td>
                    <td style={{ padding: "8px 14px", borderBottom: "1px solid #efefef", color: "#555", lineHeight: 1.5 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SpeakingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f0f0f0", textAlign: "center", padding: 80, color: "#555", fontFamily: "Arial, sans-serif" }}>Loading…</div>}>
      <SpeakingInner />
    </Suspense>
  );
}
