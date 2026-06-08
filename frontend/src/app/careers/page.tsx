import Link from "next/link";

const openings = [
  {
    title: "Senior IELTS Examiner",
    type: "Full-time · Remote",
    location: "Worldwide",
    desc: "Review Writing & Speaking submissions, provide detailed feedback, and maintain quality standards.",
  },
  {
    title: "Full Stack Engineer",
    type: "Full-time · Remote",
    location: "Worldwide",
    desc: "Build features for our Next.js + Express platform. Help scale to 100K+ users.",
  },
  {
    title: "Content Writer (IELTS)",
    type: "Part-time · Remote",
    location: "Worldwide",
    desc: "Create practice questions, mock tests, and study materials for all 4 IELTS modules.",
  },
];

export default function CareersPage() {
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Join Our Team
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Help us make IELTS preparation accessible to students worldwide. We're a fully remote team building the future of test prep.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          {/* Why Join */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Why Join IELTS Journal?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🌍", title: "Fully Remote", desc: "Work from anywhere in the world" },
                { icon: "⏰", title: "Flexible Hours", desc: "Set your own schedule" },
                { icon: "📈", title: "Growth", desc: "Learn and grow with us" },
                { icon: "💰", title: "Competitive Pay", desc: "Fair compensation" },
              ].map((item, i) => (
                <div key={i} className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Open Positions</h2>
            <div className="space-y-4">
              {openings.map((job, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{job.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-3">
                        <span>{job.type}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                      </div>
                      <p className="text-slate-600">{job.desc}</p>
                    </div>
                    <Link 
                      href={`mailto:careers@ieltsjournal.com?subject=Application: ${job.title}`}
                      className="flex-shrink-0 bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm"
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Don't See a Perfect Fit?</h3>
            <p className="text-slate-600 mb-4">
              We're always looking for talented people. Send us your resume and we'll keep you in mind for future openings.
            </p>
            <a 
              href="mailto:careers@ieltsjournal.com" 
              className="inline-block bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Send Resume
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
