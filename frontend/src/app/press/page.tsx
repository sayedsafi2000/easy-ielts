import Link from "next/link";

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-slate-900">IELTS <span className="text-blue-700">Journal</span></span>
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">← Back to Home</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Press Kit</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Media resources and company information for journalists and content creators.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-5 space-y-12">
          {/* About */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About IELTS Journal</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              IELTS Journal is an online IELTS preparation platform serving 10,000+ students from 50+ countries. 
              We provide full mock tests for all 4 IELTS modules with expert feedback from certified examiners.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Founded in 2024, our mission is to make high-quality IELTS preparation accessible and affordable 
              to students worldwide through technology and expert instruction.
            </p>
          </div>

          {/* Key Facts */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Key Facts</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Founded", value: "2024" },
                { label: "Students", value: "10,000+" },
                { label: "Countries", value: "50+" },
                { label: "Team", value: "Fully Remote" },
                { label: "Examiners", value: "Certified IELTS" },
                { label: "Average Band Score", value: "7.2" },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Assets */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Brand Assets</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <p className="text-slate-600 mb-4">
                Download our logo, screenshots, and brand guidelines.
              </p>
              <a 
                href="mailto:press@ieltsjournal.com?subject=Brand Assets Request" 
                className="inline-block bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors text-sm"
              >
                Request Brand Kit
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Media Contact</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-slate-600 mb-3">
                For press inquiries, interviews, or partnership opportunities:
              </p>
              <a href="mailto:press@ieltsjournal.com" className="text-blue-700 font-semibold text-lg">
                press@ieltsjournal.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
