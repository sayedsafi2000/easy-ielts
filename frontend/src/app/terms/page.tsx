import Link from "next/link";

export default function TermsPage() {
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

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-5">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-500 mb-12">Last updated: June 8, 2026</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using IELTS Journal, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Use License</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Permission is granted to temporarily access the materials on IELTS Journal for personal, non-commercial use only. This license shall automatically terminate if you violate any of these restrictions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Prohibited Uses</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li>Share your account with others</li>
                <li>Copy, reproduce, or redistribute test content</li>
                <li>Use automated tools to access the platform</li>
                <li>Engage in any activity that disrupts or interferes with our services</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Subscriptions and Billing</h2>
              <p className="text-slate-600 leading-relaxed">
                Subscriptions are billed in advance on a monthly or annual basis. You may cancel your subscription at any time from your account settings. Cancellations take effect at the end of the current billing period.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Refund Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We offer a 14-day money-back guarantee for new subscriptions. Refund requests must be submitted within 14 days of your initial purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Disclaimer</h2>
              <p className="text-slate-600 leading-relaxed">
                IELTS Journal is not affiliated with or endorsed by IELTS, British Council, IDP, or Cambridge Assessment English. Our platform provides practice materials and preparation services only.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                Questions about the Terms of Service should be sent to{" "}
                <a href="mailto:legal@ieltsjournal.com" className="text-blue-700 font-semibold">legal@ieltsjournal.com</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
