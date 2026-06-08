import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
      <section className="py-12 sm:py-14 lg:py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            About IELTS Journal
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We're on a mission to make IELTS preparation accessible, effective, and affordable for students worldwide.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Our Story */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
            <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
              <p>
                IELTS Journal was founded in 2024 by a team of educators and IELTS examiners who saw a gap in the market for high-quality, affordable IELTS preparation.
              </p>
              <p>
                Traditional IELTS prep courses can cost thousands of dollars and require commuting to physical locations. We believed there had to be a better way.
              </p>
              <p>
                Today, IELTS Journal serves over 10,000 students from 50+ countries, helping them achieve their target band scores and reach their academic and immigration goals.
              </p>
            </div>
          </div>

          {/* Our Mission */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600">
              To provide every student with access to expert IELTS preparation, realistic mock tests, and personalized feedback—regardless of their location or budget.
            </p>
          </div>

          {/* What Makes Us Different */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What Makes Us Different</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "Real Examiners", desc: "All Writing & Speaking feedback comes from certified IELTS examiners with years of experience." },
                { title: "Authentic Tests", desc: "Our mock tests mirror the official IELTS format exactly—same structure, timing, and difficulty." },
                { title: "Instant Results", desc: "Listening & Reading are auto-marked. Writing & Speaking feedback within 24 hours." },
                { title: "Affordable Pricing", desc: "Premium IELTS prep at a fraction of the cost of traditional courses." },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Get Started?</h3>
            <p className="text-slate-600 mb-4">Join thousands of students preparing for IELTS with us.</p>
            <Link 
              href="/register" 
              className="inline-block bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
