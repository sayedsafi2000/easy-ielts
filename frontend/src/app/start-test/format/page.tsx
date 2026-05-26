"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Test } from "@/types";

const modules = [
  {
    key: "listening",
    label: "Listening",
    duration: "30 min",
    questions: "40 questions",
    desc: "4 audio recordings + question sets. MCQ, fill-in-the-blank, matching, and labelling.",
    href: "/test/listening",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    key: "reading",
    label: "Reading",
    duration: "60 min",
    questions: "40 questions",
    desc: "3 passages with mixed question types — MCQ, True/False/Not Given, matching headings, short answer.",
    href: "/test/reading",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: "writing",
    label: "Writing",
    duration: "60 min",
    questions: "Task 1 + Task 2",
    desc: "Task 1: 150 words minimum. Task 2: 250 words minimum. Manually marked by an examiner.",
    href: "/test/writing",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    key: "speaking",
    label: "Speaking",
    duration: "15 min",
    questions: "3 parts",
    desc: "Live video call with an examiner. You must book a slot and the session will be conducted in real-time.",
    href: "/test/speaking",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function FormatSelectorPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#d9d1ff" }} />}>
      <FormatSelectorInner />
    </Suspense>
  );
}

function FormatSelectorInner() {
  const router = useRouter();
  const params = useSearchParams();
  const track = (params.get("track") === "general" ? "general" : "academic") as "academic" | "general";
  const [tests, setTests] = useState<Test[]>([]);
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  useEffect(() => {
    api.get<Test[]>("/api/tests").then(setTests).catch(() => {});
  }, []);

  // Pick the newest published test that matches the track and the module.
  function pickTest(format: "full" | "single", moduleKey?: string) {
    const matchTrack = tests.filter((t) => t.type === track);
    if (format === "full") {
      return matchTrack.find((t) => Array.isArray(t.modules) && t.modules.length >= 4) ?? matchTrack[0] ?? tests[0];
    }
    return (
      matchTrack.find((t) => Array.isArray(t.modules) && t.modules.includes(moduleKey || "")) ??
      matchTrack[0] ??
      tests[0]
    );
  }

  async function startTest(targetHref: string, format: "full" | "single", moduleKey?: string) {
    if (loadingHref) return;
    const t = pickTest(format, moduleKey);
    if (!t) return;
    setLoadingHref(targetHref);
    try {
      const attempt = await api.post<{ id: string }>("/api/attempts", {
        test_id: t.id,
        track,
        format,
        module: format === "single" ? moduleKey : null,
      });
      router.push(`${targetHref}?attempt=${attempt.id}&test=${t.id}`);
    } catch {
      setLoadingHref(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#d9d1ff" }}>
      {/* Top bar */}
      <div className="bg-white px-6 h-16 flex items-center justify-between" style={{ borderBottom: "1px solid #ececf3" }}>
        <Link href="/start-test" className="flex items-center gap-2 text-[#7b7b8d] hover:text-[#222225] transition-colors cursor-pointer text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-semibold text-[#222225]">IELTS<span style={{ color: "#9a72ff" }}>Pro</span></span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white px-6 py-3" style={{ borderBottom: "1px solid #f1f1f7" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: "#2a9350" }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-[#7b7b8d]">Choose track</span>
          </div>
          <div className="flex-1 h-px bg-[#ececf3]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}>2</div>
            <span className="text-sm font-medium" style={{ color: "#9a72ff" }}>Choose format</span>
          </div>
          <div className="flex-1 h-px bg-[#ececf3]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#ececf3", color: "#7b7b8d" }}>3</div>
            <span className="text-sm text-[#7b7b8d]">Start test</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-8">
        <div className="text-center mb-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ background: "#efe7ff", color: "#6a45d0" }}>
            {track === "academic" ? "Academic" : "General Training"} track selected
          </div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>What would you like to practise?</h1>
        </div>

        <div className="w-full max-w-2xl space-y-4 mb-10">
          {/* Full mock test */}
          <button
            type="button"
            onClick={() => startTest("/test/listening", "full")}
            disabled={loadingHref !== null}
            className="block w-full text-left disabled:opacity-60"
          >
            <div
              className="group rounded-[20px] p-6 cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>Recommended</span>
                  <h2 className="text-lg font-bold text-white mt-1" style={{ letterSpacing: "-0.04em" }}>
                    {loadingHref === "/test/listening" ? "Starting…" : "Full Mock Test"}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>All 4 modules in sequence — same as the real exam.</p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>2h 45min total</span>
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Auto-mark + Expert review</span>
                  </div>
                </div>
                <svg className="w-6 h-6 flex-shrink-0 mt-1 transition-colors" style={{ color: "rgba(255,255,255,0.7)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Single modules */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#7b7b8d] uppercase tracking-wide mb-3 text-center">Or practise a single module</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
              {modules.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => startTest(m.href, "single", m.key)}
                  disabled={loadingHref !== null}
                  className="flex text-left disabled:opacity-60"
                >
                  <div
                    className="group bg-white hover:bg-[#fafafe] rounded-[20px] p-5 cursor-pointer transition-all border border-[#f1f1f7] hover:border-[#ddd0ff] flex flex-col w-full"
                    style={{ boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-[#efe7ff] group-hover:text-[#9a72ff]"
                        style={{ background: "#f6f7fb", color: "#7b7b8d" }}
                      >
                        {m.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#222225]">
                          {loadingHref === m.href ? "Starting…" : m.label}
                        </h3>
                        <p className="text-xs text-[#7b7b8d]">{m.duration} · {m.questions}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#7b7b8d] flex-1">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
