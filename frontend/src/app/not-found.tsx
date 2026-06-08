import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900">
            IELTS <span className="text-blue-700">Journal</span>
          </span>
        </Link>

        {/* 404 Illustration */}
        <div className="relative">
          <div className="text-[180px] font-black text-slate-900/5 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl p-8 max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Page Not Found
              </h1>
              <p className="text-slate-600 text-base mb-6">
                Looks like you've ventured into uncharted territory. The page you're looking for doesn't exist.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  href="/" 
                  className="inline-flex items-center justify-center gap-2 bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Home
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-6 py-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="pt-8">
          <p className="text-sm text-slate-500 mb-3">Looking for something specific?</p>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <Link href="/dashboard" className="text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2">
              Dashboard
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/start-test" className="text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2">
              Start Test
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/pricing" className="text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2">
              Pricing
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/register" className="text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
