import Link from "next/link";

export default function TrackSelectorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#ececf3] px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-[#7b7b8d] hover:text-[#222225] transition-colors cursor-pointer text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #9a72ff 0%, #8f69f7 100%)" }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-[#222225]" style={{ letterSpacing: "-0.02em" }}>IELTS<span style={{ color: "#9a72ff" }}>Pro</span></span>
        </Link>
      </div>

      {/* Progress indicator */}
      <div className="bg-white border-b border-[#ececf3] px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {[{ n: 1, label: "Choose track", active: true }, { n: 2, label: "Choose format", active: false }, { n: 3, label: "Start test", active: false }].map((step, i, arr) => (
            <div key={step.n} className="flex items-center gap-3 flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={step.active ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "#fff" } : { background: "#ececf3", color: "#7b7b8d" }}>
                  {step.n}
                </div>
                <span className="text-sm font-semibold" style={{ color: step.active ? "#9a72ff" : "#7b7b8d" }}>{step.label}</span>
              </div>
              {i < arr.length - 1 && <div className="flex-1 h-px bg-[#ececf3]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>
            Which IELTS track are you preparing for?
          </h1>
          <p className="mt-2 text-sm text-[#7b7b8d]">Both tracks cover all 4 modules — Listening, Reading, Writing, and Speaking.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
          <Link href="/start-test/format?track=academic">
            <div className="group bg-white border-2 border-[#ececf3] hover:border-[#9a72ff] rounded-[22px] p-8 cursor-pointer transition-all text-left" style={{ boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5" style={{ background: "#efe7ff", color: "#9a72ff" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#222225] mb-2" style={{ letterSpacing: "-0.03em" }}>Academic</h2>
              <p className="text-sm text-[#7b7b8d] leading-relaxed mb-5">For university admission, professional registration, and immigration to English-speaking countries.</p>
              <ul className="space-y-2 mb-6">
                {["Graph/chart description (Task 1)", "Academic reading passages", "Complex academic vocabulary"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#7b7b8d]">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: "#9a72ff" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#efe7ff", color: "#6a45d0" }}>University &amp; Immigration</span>
                <svg className="w-5 h-5 text-[#ececf3] group-hover:text-[#9a72ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/start-test/format?track=general">
            <div className="group bg-white border-2 border-[#ececf3] hover:border-[#34ba65] rounded-[22px] p-8 cursor-pointer transition-all text-left" style={{ boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5" style={{ background: "#dff1e8", color: "#34ba65" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#222225] mb-2" style={{ letterSpacing: "-0.03em" }}>General Training</h2>
              <p className="text-sm text-[#7b7b8d] leading-relaxed mb-5">For work experience, training programmes, and migration to English-speaking countries.</p>
              <ul className="space-y-2 mb-6">
                {["Formal letter writing (Task 1)", "Everyday reading texts", "Practical English skills"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#7b7b8d]">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: "#34ba65" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#dff1e8", color: "#2a9350" }}>Work &amp; Migration</span>
                <svg className="w-5 h-5 text-[#ececf3] group-hover:text-[#34ba65] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
